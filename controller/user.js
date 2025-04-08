/**
 * @swagger
 * /user/login:
 *   post:
 *     summary: Login Into Your Account Using Email & Password.
 *     description: Use this route to login into your DJP Hub account.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: The user's Email ID.
 *                 example: uttamkr5599@gmail.com
 *               password:
 *                 type: string
 *                 description: The user's Password.
 *                 example: Uttam@5599
 *     responses:
 *       success:
 *         description: Login successful.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   description: Indicates whether the response was successful or not.
 *                   example: true
 *                 message:
 *                   type: string
 *                   description: The response message from the server.
 *                   example: Login Successful
 *                 token:
 *                   type: string
 *                   description: Token is the combined data of different parameters.
 *                   example: Token
 *       error:
 *         description: Bad request due to invalid input.
 *       401:
 *         description: Unauthorized, invalid credentials.
 */

require("dotenv").config();
// Basic Required Modules
const mongoose = require("mongoose");
const crypt = require("crypto");
const ejs = require("ejs");
const jwt = require("jsonwebtoken");
const path = require("node:path");
const express = require("express");
const otpGenerator = require("otp-generator");

// Required Modules For Google Login
const { oauth2client } = require("../service/googleConfig");

// Required Modules For Sending Email
const { transporter, gmailtransporter } = require("../service/transporter");

// Transaction Api
const { transactionData, subAmountinWallet, addAmountinWallet } = require("./wallet");

// Required Models
const {
  UserModel,
  DocumentModel,
  FollowModel,
  WalletModel,
  SubscriptionModel,
  ForgotPasswordModel,
  TransactionModel,
  SubscriptionLogs,
  JobAppliedModel,
  ReviewModel,
  BookMarkModel,
  ReferModel,
  OtpModel,
} = require("../model/ModelExport");

// Required Middleware For File Upload & User Authentication
const {
  UserAuthentication,
  uploadMiddleWare,
  AdminAuthentication,
  ArtistAuthentication,
} = require("../middleware/MiddlewareExport");
const { createWallet } = require("./wallet");
const { currentDate, getDateAfter30Days } = require("../service/currentDate");
const generateUniqueId = require('generate-unique-id');
const { SendOtp, VerifyOtp } = require("../service/otpService");

const UserRouter = express.Router();

const hash = {
  sha256: (data) => {
    return crypt.createHash("sha256").update(data).digest("hex");
  },
  sha512: (data) => {
    return crypt.createHash("sha512").update(data).digest("hex");
  },
  md5: (data) => {
    return crypt.createHash("md5").update(data).digest("hex");
  },
};

const generateToken = async (props) => {
  const { id } = props;
  try {
    const userdetails = await UserModel.aggregate([{ $match: { _id: new mongoose.Types.ObjectId(id) } }])

    if (userdetails.length === 0) {
      return { status: "error", message: "No User Found With This Id" }
    } else {
      let token = jwt.sign({
        _id: userdetails[0]._id, name: userdetails[0].name, email: userdetails[0].email, phoneno: userdetails[0].phoneno, accountType: userdetails[0].accountType, profile: userdetails[0].profile, verified: userdetails[0].verified, subscription: userdetails[0].subscription, planExpireAt: userdetails[0].planExpireAt, exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
      }, "Authentication",);
      return { status: "success", token: token }
    }
  } catch (error) {
    return { status: "error", message: `${error.message}` }
  }
}

const generateReferalCode = async (props) => {
  try {
    const newid = new ReferModel({
      userId: props.userId,
      referId: generateUniqueId({
        length: 6,
        useLetters: true,
        useNumbers: true
      }).toUpperCase()
    })
    await newid.save()
    return { status: "success" }
  } catch (error) {
    return { status: 'error', message: `${error.message}` }
  }
}

const addReferalCodeBonus = async (props) => {
  const { code, newUserId } = props;
  try {
    const userExists = await ReferModel.aggregate([{ $match: { referId: code } }]);
    if (userExists.length === 0) {
      return { status: 'error', message: `No User Found With This Referal Code` }
    } else {
      const addingNewUserIdInUserReferModel = await ReferModel.findByIdAndUpdate(
        userExists[0]._id, // First argument should be the ID directly
        { registeredBy: newUserId },
        { new: true } // Optional: Returns the updated document
      );
      const addingReferalBonusToUserWallet = await addAmountinWallet({ amount: Number(process.env.ReferalAmount), userId: userExists[0]?.userId })
      if (addingReferalBonusToUserWallet.status === 'error') {
        return { status: 'error', message: addingReferalBonusToUserWallet?.message }
      }
      const addingReferalBonusTransaction = await transactionData({ amount: Number(process.env.ReferalAmount), userId: userExists[0]?.userId, message: 'Adding Referal Bonus To Users Wallet', toUserId: userExists[0]?.userId });
      if (addingReferalBonusTransaction.status === 'error') {
        return { status: 'error', message: addingReferalBonusTransaction.message }
      }
      return { status: 'success' }
    }

  } catch (error) {
    return { status: 'error', message: `${error.message}` }
  }

}

// Save OTP 
const saveOtp = async (props) => {
  const VerifyAccount = new OtpModel({
    userId: props?.userId,
    otp: props?.newotp,
    requestId: props?.requestId,
    expireAt: Date.now() + 2 * 60 * 1000,
  });
  try {
    await VerifyAccount.save();
    return { status: 'success' }
  } catch (error) {
    return { status: 'error', message: error.message }
  }
}

// Regular User Login

UserRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const userExists = await UserModel.find({ email });
    if (userExists.length === 0) {
      return res.json({
        status: "error",
        message: "No User Exists With This Email ID",
        redirect: "/user/register",
      });
    } else {
      if (
        hash.sha256(password) === userExists[0].password &&
        userExists[0].disabled != true
      ) {
        if (userExists[0].accountType !== "admin") {
          let token = jwt.sign(
            {
              _id: userExists[0]._id,
              name: userExists[0].name,
              email: userExists[0].email,
              phoneno: userExists[0].phoneno,
              accountType: userExists[0].accountType,
              profile: userExists[0].profile,
              verified: userExists[0].verified,
              subscription: userExists[0].subscription,
              planExpireAt: userExists[0].planExpireAt,
              exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
            },
            "Authentication",
          );
          if (userExists[0].dob === undefined || userExists[0].dob === "") {
            return res.json({
              status: "success",
              message: "Login Successful",
              token: token,
              type: userExists[0].accountType,
              redirect: "/user/basicprofile",
            });
          }
          if (
            userExists[0].profile === undefined ||
            userExists[0].profile === ""
          ) {
            return res.json({
              status: "success",
              message: "Login Successful",
              token: token,
              type: userExists[0].accountType,
              redirect: "/user/basicprofile",
            });
          }
          return res.json({
            status: "success",
            message: "Login Successfully",
            token: token,
            type: userExists[0].accountType,
          });
        } else {
          return res.json({
            status: "error",
            message: "You Cannot Login Using Admin Credential's !! ",
            redirect: "/",
          });
        }
      } else if (hash.sha256(password) !== userExists[0].password) {
        return res.json({
          status: "error",
          message: "Wrong Password Please Try Again",
        });
      } else if (userExists[0].disabled === true) {
        return res.json({
          status: "error",
          message: "Your Account has been Temporarily disabled",
        });
      }
    }
  } catch (error) {
    return res.json({
      status: "error",
      message: `Error Found in Login ${error.message}`,
    });
  }
});

UserRouter.post("/login/admin", async (req, res) => {
  try {
    const { email, password } = req.body;
    const userExists = await UserModel.find({ email: email, verified: "true" });
    if (userExists.length === 0) {
      return res.json({
        status: "error",
        message: "No User Exists With This Email ID",
        redirect: "/user/register",
      });
    } else {
      if (
        hash.sha256(password) === userExists[0].password &&
        userExists[0].disabled != true
      ) {
        if (userExists[0].accountType === "admin") {
          let token = jwt.sign(
            {
              _id: userExists[0]._id,
              name: userExists[0].name,
              email: userExists[0].email,
              accountType: userExists[0].accountType,
              profile: userExists[0].profile,
              verified: userExists[0].verified,
              exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
            },
            "Authentication",
          );

          return res.json({
            status: "success",
            message: "Login Successfully",
            token: token,
            type: userExists[0].accountType,
          });
        } else {
          return res.json({
            status: "error",
            message: "You Can Login Only Using Admin Credential's !! ",
            redirect: "/",
          });
        }
      } else if (hash.sha256(password) !== userExists[0].password) {
        return res.json({
          status: "error",
          message: "Wrong Password Please Try Again",
        });
      } else if (userExists[0].disabled === true) {
        return res.json({
          status: "error",
          message: "Your Account has been Temporarily disabled",
        });
      }
    }
  } catch (error) {
    return res.json({
      status: "error",
      message: `Error Found in Admin Login ${error.message}`,
    });
  }
});

// User Registration Step 1 Basic Detail's Registration

UserRouter.post("/register", async (req, res) => {
  const { name, email, password, accountType } = req.body;
  if (accountType === "admin") {
    return res.json({
      status: "error",
      message: "You Cannot Register Using Admin Credential's",
    });
  }
  const userExists = await UserModel.find({ email });
  if (userExists.length >= 1) {
    return res.json({
      status: "error",
      message:
        "User Already Exists with this Email ID. Please Try again with another Email ID",
      redirect: "/user/login",
    });
  } else {
    const user = new UserModel({
      name,
      email,
      password: hash.sha256(password),
      accountType: accountType,
    });
    try {
      const newUser = await user.save();

      const newUserReferalCode = await generateReferalCode({ userId: newUser._id })

      if (newUserReferalCode.status === "error") {
        return res.json({
          status: "error",
          message: "Failed To Create Referal Code For New User",
          redirect: "/",
        })
      }

      if (req.body?.referalCode) {
        const addingReferalBonus = await addReferalCodeBonus({ code: req.body?.referalCode, newUserId: newUser._id });

        if (addingReferalBonus.status === 'error') {
          return res.json({ status: 'error', message: `Faild To Add Referal Bonus To User Account ${addingReferalBonus?.message}` })
        }

      }

      const wallet = await createWallet({ userId: newUser._id });

      if (wallet.status === "error") {
        return res.json({
          status: "error",
          message: "Failed To Create Wallet",
          redirect: "/",
        });
      } else {
        return res.json({
          status: "success",
          message: "Registration Successful",
          redirect: "/user/login",
        });
      }
    } catch (error) {
      return res.json({
        status: "error",
        message: `Failed To Register New User, Error :- ${error.message}`,
      });
    }
  }
});

// Forgot Password Step 1 Sending Otp in Email

UserRouter.post("/forgot", async (req, res) => {
  try {
    const { email } = req.body;
    const userExists = await UserModel.find({ email });
    if (userExists.length === 0) {
      return res.json({
        status: "error",
        message: "No User Exists With This Email, Please SignUp First",
        redirect: "/user/register",
      });
    } else {
      let newotp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        specialChars: false,
        lowerCaseAlphabets: false,
      });
      let forgotpasswordtoken = jwt.sign(
        {
          name: userExists[0].name,
          email: userExists[0].email,
          userId: userExists[0]._id,
          exp: Math.floor(Date.now() / 1000) + 60 * 15,
        },
        "ResetPassword",
      );
      let link = `${process.env.domainurl}/change-password/${newotp}/${forgotpasswordtoken}`;
      try {
        const existstoken = await ForgotPasswordModel.find({
          userId: userExists[0]._id,
        });
        if (existstoken.length !== 0) {
          return res.json({
            status: "error",
            message:
              "Check Your mailbox You can still use your old otp to reset the password ",
          });
        }
        const ResetPassword = new ForgotPasswordModel({
          userId: userExists[0]._id,
          token: forgotpasswordtoken,
          otp: newotp,
          expireAt: Date.now() + 15 * 60 * 1000,
        });
        await ResetPassword.save();
      } catch (error) {
        return res.json({
          status: "error",
          message: "Failed To Save Use",
          redirect: "/",
        });
      }
      let forgotPasswordtemplate = path.join(
        __dirname,
        "../emailtemplate/forgotPassword.ejs",
      );
      ejs.renderFile(
        forgotPasswordtemplate,
        { link: link, otp: newotp },
        function (err, template) {
          if (err) {
            return res.json({ status: "error", message: err.message });
          } else {
            const mailOptions = {
              from: process.env.emailuser,
              to: `${userExists[0].email}`,
              subject: "Otp To Reset Password ",
              html: template,
            };
            gmailtransporter.sendMail(mailOptions, (error, info) => {
              if (error) {
                return res.json({
                  status: "error",
                  message: `Failed to send email ${error.message}`,
                  redirect: "/",
                });
              } else {
                return res.json({
                  status: "success",
                  message: "Please Check Your Email",
                  redirect: "/",
                });
              }
            });
          }
        },
      );
    }
  } catch (error) {
    return res.json({
      status: "error",
      message: `Error Found in Forgot Password ${error.message}`,
    });
  }
});

UserRouter.post("/changePassword", async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  const { otp, password, cnfpassword } = req.body;
  try {
    const decoded = jwt.verify(token, "ResetPassword");
    const otpkey = await ForgotPasswordModel.aggregate([
      {
        $match: { userId: new mongoose.Types.ObjectId(decoded.userId) },
      },
    ]);
    if (otpkey.length === 0) {
      return res.json({
        status: "success",
        message:
          "Otp Expired, Your Otp is Only Valid For 15 minutes. Please try again",
      });
    }
    if (Number(otp) !== otpkey[0].otp) {
      return res.json({
        status: "error",
        message: "Entered Otp is wrong",
      });
    }
    if (password !== cnfpassword) {
      return res.json({
        status: "error",
        message: "Your password & Confirm Password Doesn't Match",
      });
    }
    const user = await UserModel.findByIdAndUpdate(decoded.userId, {
      password: hash.sha256(password),
    });
    const deletetoken = await ForgotPasswordModel.findByIdAndDelete(
      decoded.userId,
    );
    return res.json({
      status: "success",
      message: "You have Successfully Updated Your Account Password.",
    });
  } catch (error) {
    return res.json({
      status: "error",
      message: `Failed To Change Password ${error.message}`,
    });
  }
});

// Getting Basic User Detail's Like username, email & more which is passed via token

UserRouter.get("/me", UserAuthentication, async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  try {
    if (!token) {
      return res.json({
        status: "error",
        message: "Please Login to Access User Details",
        redirect: "/user/login",
      });
    }

    const decoded = jwt.verify(token, "Authentication");
    const user = await UserModel.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(decoded._id),
        },
      },
      {
        $lookup: {
          from: "wallets",
          localField: "_id",
          foreignField: "userId",
          as: "walletdetails",
        },
      },
      {
        $lookup: {
          from: "documents",
          localField: "_id",
          foreignField: "userId",
          as: "documentdetails",
        },
      },
      {
        $lookup: {
          from: "followers",
          localField: "_id",
          foreignField: "userId",
          as: "followers",
        },
      },
      {
        $addFields: {
          followerscount: {
            $size: {
              $ifNull: [{ $arrayElemAt: ["$followers.followedBy", 0] }, []],
            },
          },
        },
      },
      {
        $lookup: {
          from: "followers",
          localField: "_id",
          foreignField: "followedBy",
          as: "followings",
        },
      },
      {
        $addFields: {
          followingcount: { $size: { $ifNull: ["$followings", []] } },
        },
      },
      {
        $lookup: {
          from: "reviews",
          localField: "_id",
          foreignField: "userId",
          as: "reviews",
        },
      },
      {
        $lookup: {
          from: "companyownerdetails",
          localField: "_id",
          foreignField: "userId",
          as: "companyownerdetails",
        },
      },
      {
        $addFields: {
          reviewCount: { $size: { $ifNull: ["$reviews", []] } },
          totalRating: { $sum: { $ifNull: ["$reviews.rating", []] } },
        },
      },
      {
        $project: {
          password: 0,
          forgotpasswordtoken: 0,
          otp: 0,
          reviews: 0,
          followers: 0,
          followings: 0,
        },
      },
    ]);

    return res.json({
      status: "success",
      message: "Getting User Details",
      user: user[0] || null,
    });
  } catch (error) {
    return res.json({
      status: "error",
      message: `Error Found while getting User following list: ${error.message}`,
    });
  }
});

// Getting Wallet & Transaction Details
UserRouter.get("/me/wallet", UserAuthentication, async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "Authentication");
  try {
    const user = await WalletModel.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(decoded._id), // Convert id to ObjectId using 'new'
        },
      },
      {
        $lookup: {
          from: "transactions", // Foreign collection name
          let: { userId: "$userId" }, // Define local variables
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    // { $eq: ["$userId", "$$userId"] }, // Match username with author
                    // { $eq: ["$from", "$$userId"] }, // Match email with contact
                    // { $eq: ["$to", "$$userId"] }, // Match email with contact
                    { $eq: ["$display", "$$userId"] }, // Match username with author
                    
                  ],
                },
              },
            },
            { $sort: { CreatedAt: -1 } },
          ],
          as: "transactions", // Name of the output array
        },
      },
    ]);

    return res.json({
      status: "success",
      user: user,
    });
  } catch (error) {
    return res.json({
      status: "error",
      message: `Error Found in Getting User Wallet Details Section ${error.message}`,
    });
  }
});
// Updating User Detail's in the Database.

UserRouter.patch("/me/update", uploadMiddleWare.fields([{ name: "profile", maxCount: 1 }, { name: "banner", maxCount: 1 }]), UserAuthentication, async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "Authentication");

  try {
    const updatedUser = await UserModel.findOne({ _id: decoded._id });

    let addressdata = {};
    addressdata.country = req.body?.country || updatedUser?.address?.country;
    addressdata.state = req.body?.state || updatedUser?.address?.state;
    addressdata.city = req.body?.city || updatedUser?.address?.city;
    addressdata.location =
      req.body?.location || updatedUser?.address?.location;

    let sociallinks = {};
    sociallinks.facebook =
      req.body?.facebook || updatedUser?.sociallinks?.facebook;
    sociallinks.linkdein =
      req.body?.linkdein || updatedUser?.sociallinks?.linkdein;
    sociallinks.twitter =
      req.body?.twitter || updatedUser?.sociallinks?.twitter;
    sociallinks.instagram =
      req.body?.instagram || updatedUser?.sociallinks?.instagram;

    let profile;
    if (!!req?.files.profile) {
      profile = req.files.profile[0]?.location || updatedUser?.profile;
    }
    let banner;
    if (!!req?.files.banner) {
      banner = req.files.banner[0]?.location || updatedUser?.banner;
    }

    const skills = JSON.parse(req.body?.skills) || updatedUser?.skills;

    let companycategory;
    if (updatedUser?.accountType === "professional") {
      companycategory =
        req.body?.companycategory || updatedUser?.companycategory;
    }

    let phoneno = req.body?.phoneno || updatedUser?.phoneno
    // Artist Company & Designation
    let artistcompany;
    if (updatedUser?.accountType === "artist") {
      artistcompany = req.body?.company || updatedUser?.company || "";
    }
    let artistdesignation;
    if (updatedUser?.accountType === "artist") {
      artistdesignation = req.body?.designation || updatedUser?.designation || "";
    }



    const updatedData = {
      ...req.body, // Update other fields if provided
      banner: banner, // Use the new image if uploaded
      profile: profile,
      address: addressdata,
      sociallinks: sociallinks,
      skills: skills,
      companycategory: companycategory,
      phoneno: phoneno,
      company: artistcompany,
      designation: artistdesignation
    };

    const updatedItem = await UserModel.findByIdAndUpdate(
      decoded._id,
      updatedData,
      {
        new: true, // Return the updated document
      },
    );
    return res.json({ status: "success", message: "User Details Updated" });
  } catch (error) {
    return res.json({
      status: "error",
      message: `Failed To Update User Detail's  ${error.message}`,
    });
  }
},
);

// Getting list Of All Followers Of Users
UserRouter.get("/me/followers", UserAuthentication, async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "Authentication");

  try {
    const user = await FollowModel.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(decoded._id), // Convert id to ObjectId
        },
      },
      {
        $unwind: "$followedBy",
      },
      {
        $lookup: {
          from: "users",
          localField: "followedBy",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                _id: 1,
                name: 1,
                profile: 1,
                accountType: 1,
                email: 1,
                category: 1,
                verified: 1,
              },
            },
            {
              $lookup: {
                from: "followers",
                localField: "_id",
                foreignField: "userId",
                pipeline: [
                  {
                    $addFields: {
                      followstatus: {
                        $in: [
                          new mongoose.Types.ObjectId(decoded._id),
                          { $ifNull: ["$followedBy", []] }, // Ensure followedBy is an array
                        ],
                      },
                    },
                  },
                ],
                as: "followerdetails",
              },
            },
          ],
          as: "userdetails",
        },
      },
      {
        $unwind: "$userdetails",
      },
      {
        $addFields: {
          "userdetails.followstatus": {
            $cond: {
              if: {
                $gt: [
                  {
                    $size: {
                      $filter: {
                        input: {
                          $ifNull: ["$userdetails.followerdetails", []],
                        },
                        as: "follower",
                        cond: {
                          $in: [
                            new mongoose.Types.ObjectId(decoded._id),
                            { $ifNull: ["$$follower.followedBy", []] },
                          ],
                        },
                      },
                    },
                  },
                  0,
                ],
              },
              then: true,
              else: false,
            },
          },
        },
      },
      { $project: { "userdetails.followerdetails": 0 } },
    ]);

    return res.json({
      status: "success",
      user: user,
    });
  } catch (error) {
    return res.json({
      status: "error",
      message: `Error Found While Getting User Follower List: ${error.message}`,
    });
  }
});

// Getting list Of All Followings Of Users
UserRouter.get("/me/following", UserAuthentication, async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "Authentication");

  try {
    const user = await FollowModel.aggregate([
      {
        $match: {
          followedBy: {
            $elemMatch: {
              $eq: new mongoose.Types.ObjectId(decoded._id), // Check if the userId is in the followedBy array
            },
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                _id: 1,
                name: 1,
                profile: 1,
                accountType: 1,
                email: 1,
                category: 1,
                verified: 1,
              }
            },
          ],
          as: "userDetails",
        },
      },
      {
        $project: {
          __v: 0,
          followedBy: 0,
          CreatedAt: 0,
          userId: 0,
        },
      },
    ]);
    return res.json({
      status: "success",
      user: user,
    });
  } catch (error) {
    return res.json({
      status: "error",
      message: `Error Found while getting User following list Section: ${error.message}`,
    });
  }
});

// Disable Any User By Admin

UserRouter.patch("/disable/admin/:id", AdminAuthentication, async (req, res) => {
  const { id } = req.params;
  try {
    const updatedUser = await UserModel.findByIdAndUpdate(id, {
      disabled: true,
    });
    return res.json({
      status: "success",
      message: "User SuccessFully Deactivated ",
    });
  } catch (error) {
    return res.json({
      status: "error",
      message: `Failed To Disable User ${error.message}`,
    });
  }
},
);

// Step 1 Uploading Documents For Account Verifications

UserRouter.post("/documentupload", uploadMiddleWare.single("document"), UserAuthentication, async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "Authentication");

  if (!req.file) {
    return res.json({
      status: "error",
      error: "please upload a Document",
    });
  }
  try {
    const userDocuments = await DocumentModel.find({ userId: decoded._id });

    if (userDocuments.length == 0) {
      const newDocument = new DocumentModel({
        document: req.file?.location,
        documentType: req.body?.documentType,
        userId: decoded._id,
      });
      await newDocument.save();
      return res.json({
        status: "success",
        message:
          "Document Uploaded Successfully Please Wait For 48 Hours Untill Admin Verify Your Document",
      });
    } else {
      if (userDocuments[0].status === "Rejected") {
        userDocuments[0].document = req.file?.location;
        userDocuments[0].documentType =
          req.body?.documentType || userDocuments[0].documentType;
        userDocuments[0].status = "Pending";
        await DocumentModel.findByIdAndUpdate(
          userDocuments[0]._id,
          userDocuments[0],
        );
        return res.json({
          status: "success",
          message:
            "Document ReUploaded For Verification Please Wait For 48 Hours Untill Admin Verify Your Document",
        });
      } else if (userDocuments[0].status === "Approved") {
        return res.json({
          status: "success",
          message: "Document Already Approved",
        });
      } else if (userDocuments[0].status === "Pending") {
        return res.json({
          status: "error",
          message: "Document Already In Pending",
        });
      }
    }
  } catch (error) {
    return res.json({
      status: "error",
      message: `Error Found while trying to upload Documents ${error.message}`,
    });
  }
},
);

// Resume Upload For Artist

UserRouter.post("/resumeupload", uploadMiddleWare.single("resume"), ArtistAuthentication, async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "Authentication");

  if (!req.file) {
    return res.json({
      status: "error",
      error: "please upload a Document",
    });
  }
  try {
    const userDocuments = await UserModel.findByIdAndUpdate(decoded._id, {
      resume: req.file?.location || "",
    });
    return res.json({
      status: "success",
      message: `Resume Uploaded Successfully`,
    });
  } catch (error) {
    return res.json({
      status: "error",
      message: `Error Found while trying to upload Resume ${error.message}`,
    });
  }
},
);

// Step 2 Verifying Documents Status For Account Verifications

UserRouter.post("/document/verification/:id", AdminAuthentication, async (req, res) => {
  const { id } = req.params;
  try {
    const userDocuments = await DocumentModel.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(id) } },
    ]);
    if (userDocuments.length == 0) {
      return res.json({
        status: "error",
        message: "No Document Found For This User",
      });
    } else {
      if (req.body.status == "Approved") {
        await UserModel.findByIdAndUpdate(userDocuments[0].userId, {
          verified: true,
        });
        await DocumentModel.findByIdAndUpdate(userDocuments[0]._id, {
          status: "Approved",
        });
        return res.json({
          status: "success",
          message: "Document Approved Successfully",
        });
      } else if (req.body.status == "Rejected") {
        await UserModel.findByIdAndUpdate(userDocuments[0].userId, {
          verified: false,
        });
        await DocumentModel.findByIdAndUpdate(userDocuments[0]._id, {
          status: "Rejected",
          message: req.body?.message || "Document Rejected By Admin",
        });
        return res.json({
          status: "success",
          message: "Document Rejected Successfully",
        });
      }
    }
  } catch (error) {
    return res.json({
      status: "error",
      message: `Error Found while trying to Update Document Status ${error.message}`,
    });
  }
},
);

// Get Document Details Current Status
UserRouter.get("/me/document/status", UserAuthentication, async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "Authentication");
  try {
    const userDocuments = await DocumentModel.find({ userId: decoded._id });

    if (userDocuments.length == 0) {
      return res.json({
        status: "error",
        message: "No Document Found For Your Id",
      });
    } else {
      return res.json({
        status: "success",
        data: userDocuments,
      });
    }
  } catch (error) {
    return res.json({
      status: "error",
      message: `Error Found while trying to Get Current Documents Details ${error.message}`,
    });
  }
});

// Get List of All The Artists From Server It Will Be Based On Email & Category

UserRouter.get("/find/artist", UserAuthentication, async (req, res) => {
  try {
    // Extract token and decode user details
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ status: "error", message: "Unauthorized: No token provided" });
    }

    const decoded = jwt.verify(token, "Authentication");
    const { search } = req.query;

    let filter = {
      email: { $ne: decoded.email }, // Exclude logged-in user's profile
      accountType: "artist",
      disabled: false,
      verified: true,
    };

    // If search query is provided, apply regex filtering
    if (search) {
      const regex = new RegExp(search, "i");
      filter.$or = [
        { email: { $regex: regex } },
        { category: { $regex: regex } },
      ];
    }

    const results = await UserModel.find(filter, {
      password: 0,
      CreatedAt: 0,
    });

    if (results.length === 0) {
      return res.json({
        status: "error",
        message: "No matching records found",
      });
    }

    return res.json({ status: "success", data: results });

  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: `Error while searching for artists: ${error.message}`,
    });
  }
});


// Get List of All The Artists From Server User Which needs to be shown in Artist Search Page

UserRouter.get("/listall/artist", UserAuthentication, async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "Authentication");
  try {
    const results = await UserModel.find(
      {
        email: { $ne: decoded.email },
        accountType: "artist",
        disabled: "false",
        verified: "true",
      },
      { password: 0, verified: 0, disabled: 0, CreatedAt: 0 },
    );

    if (results.length === 0) {
      return res.json({ status: "error", message: "No Artist found" });
    }
    return res.json({ status: "success", data: results });
  } catch (error) {
    return res.json({
      status: "error",
      message: `Èrror Found While Fetching The List Of AllvArtist ${error.message}`,
    });
  }
});

// Search For Professional Based on Email & Category

UserRouter.get("/find/professional", UserAuthentication, async (req, res) => {
  try {
    // Extract token and decode user details
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ status: "error", message: "Unauthorized: No token provided" });
    }

    const decoded = jwt.verify(token, "Authentication");
    const { search } = req.query;

    let filter = {
      email: { $ne: decoded.email }, // Exclude logged-in user's profile
      accountType: "professional",
      disabled: false,
      verified: true,
    };

    // If search query is provided, apply regex filtering
    if (search) {
      const regex = new RegExp(search, "i");
      filter.$or = [
        { email: { $regex: regex } },
        { category: { $regex: regex } },
      ];
    }

    const results = await UserModel.find(filter, {
      password: 0,
      CreatedAt: 0,
    });

    if (results.length === 0) {
      return res.json({
        status: "error",
        message: "No matching records found",
      });
    }

    return res.json({ status: "success", data: results });

  } catch (error) {
    return res.json({
      status: "error",
      message: `Error while searching for professionals: ${error.message}`,
    });
  }
});


// Get List of All The Verified Professional From Server User Which needs to be shown in Professional Search Page

UserRouter.get("/listall/professional", UserAuthentication, async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "Authentication");
  try {
    const results = await UserModel.find(
      {
        email: { $ne: decoded.email },
        accountType: "professional",
        disabled: "false",
        verified: "true",
      },
      { password: 0, verified: 0, disabled: 0, CreatedAt: 0 },
    );

    if (results.length === 0) {
      return res.json({ status: "error", message: "No Professional found" });
    }
    return res.json({ status: "success", data: results });
  } catch (error) {
    return res.json({
      status: "error",
      message: `Èrror Found While Fetching The List Of All Professional ${error.message}`,
    });
  }
},
);

UserRouter.get("/listall/admin", AdminAuthentication, async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "Authentication");
  try {
    const results = await UserModel.find(
      {
        email: { $ne: decoded.email },
      },
      { password: 0, CreatedAt: 0 },
    ).sort({CreatedAt:-1})

    if (results.length === 0) {
      return res.json({ status: "error", message: "No Professional found" });
    }
    return res.json({ status: "success", data: results });
  } catch (error) {
    return res.json({
      status: "error",
      message: `Èrror Found While Fetching The List Of All Professional ${error.message}`,
    });
  }
});

// Get Basic Detail Of One User

UserRouter.get("/detailone/:id", UserAuthentication, async (req, res) => {
  const { id } = req.params;
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "Authentication");
  try {
    const results = await UserModel.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(id),
          disabled: false,
          // verified: true,
        },
      },
      { $project: { password: 0, CreatedAt: 0 } },
      {
        $lookup: {
          from: "followers",
          localField: "_id",
          foreignField: "userId",
          as: "followerlist",
        },
      },
      {
        $addFields: {
          followstatus: {
            $in: [
              new mongoose.Types.ObjectId(decoded._id),
              {
                $reduce: {
                  input: "$followerlist",
                  initialValue: [],
                  in: { $concatArrays: ["$$value", "$$this.followedBy"] }, // Flatten the likedBy arrays
                },
              },
            ],
          },
        },
      },
      {
        $lookup: {
          from: "reviews",
          localField: "_id",
          foreignField: "userId",
          as: "reviews",
        },
      },
      {
        $addFields: {
          reviewCount: { $size: { $ifNull: ["$reviews", []] } },
          totalRating: { $sum: { $ifNull: ["$reviews.rating", []] } },
        },
      },
      {
        $lookup: {
          from: "companyownerdetails",
          localField: "_id",
          foreignField: "userId",
          as: "companyownerdetails",
        },
      },
      {
        $project: {
          followerlist: 0,
          subscription: 0,
          planExpireAt: 0,
          // resume: 0,
        },
      },
    ]);
    if (results.length === 0) {
      return res.json({ status: "error", message: "No user found" });
    }
    return res.json({ status: "success", data: results });
  } catch (error) {
    return res.json({
      status: "error",
      message: `Èrror Found While Fetching The List Of All Users ${error.message}`,
    });
  }
});

UserRouter.get("/detailone/extra/:id", UserAuthentication, async (req, res) => {
  const { id } = req.params;

  const results = await UserModel.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(id),
        disabled: false,
        verified: true,
      },
    },
    { $project: { password: 0, CreatedAt: 0, } },
    {
      $lookup: {
        from: "events",
        localField: "_id",
        foreignField: "createdBy",
        pipeline: [
          {
            $match: {
              endDate: { $gt: currentDate }, // Filters events with endDate greater than the current date
              type: "Collaboration"
            },
          },
        ],
        as: "collaborationeventsdetails"
      }
    },
    {
      $lookup: {
        from: "events",
        localField: "_id",
        foreignField: "createdBy",
        pipeline: [
          {
            $match: {
              endDate: { $gt: currentDate }, // Filters events with endDate greater than the current date
              type: "Event"
            },
          },
        ],
        as: "eventdetails"
      }
    },
    {
      $lookup: {
        from: "jobs",
        localField: "_id",
        foreignField: "createdBy",
        pipeline: [
          {
            $match: {
              endtime: { $gt: currentDate }, // Filters events with endDate greater than the current date
              status: "Active"
            },
          },
        ],
        as: "jobdetails"
      }
    },
    {
      $project: {
        _id: 1,
        jobdetails: 1,
        eventdetails: 1,
        collaborationeventsdetails: 1,
        accountType: 1
      },
    },
  ]);

  return res.json({ status: "success", data: results });
})

// Get Basic Detail Of One User used by Admin
UserRouter.get("/detailone/admin/:id", AdminAuthentication, async (req, res) => {
  const { id } = req.params;
  try {
    // const results = await UserModel.find({ email: { $ne: decoded.email }, accountType: "artist", disabled: "false", verified: "true" }, { password: 0, verified: 0, disabled: 0, CreatedAt: 0 });

    const results = await UserModel.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
      {
        $project: {
          password: 0,
          CreatedAt: 0,
          forgotpasswordtoken: 0,
          otp: 0,
        },
      },
      {
        $lookup: {
          from: "documents",
          localField: "_id",
          foreignField: "userId",
          as: "documentdetails",
        },
      },
    ]);    
    if (results.length === 0) {
      return res.json({ status: "error", message: "No Artist found" });
    }
    return res.json({ status: "success", data: results });
  } catch (error) {
    return res.json({
      status: "error",
      message: `Èrror Found While Fetching The List Of AllvArtist ${error.message}`,
    });
  }
},
);

// Add Basic Profile Details

UserRouter.post("/basicdetails/update", uploadMiddleWare.fields([{ name: "profile", maxCount: 1 }, { name: "banner", maxCount: 1 },]), UserAuthentication, async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "Authentication");
  const { gender, country, state, city, dob, category, phoneno } = req.body;

  if (!req?.files?.profile) {
    return res.json({
      status: "error",
      error: "please upload a Profile Image",
    });
  }

  if (!req?.files?.banner) {
    return res.json({
      status: "error",
      error: "please upload a Banner Image",
    });
  }

  try {
    const user = await UserModel.findOne({ _id: decoded._id });
    user.gender = gender;
    user.dob = dob;
    user.category = category || "";
    user.phoneno = phoneno || 0;

    if (!user.address) {
      user.address = {}; // Initialize address if it doesn't exist
    }

    // Safely update address fields
    user.address.country = country || user.address.country;
    user.address.state = state || user.address.state;
    user.address.city = city || user.address.city;

    if (!!req?.files.profile) {
      user.profile = req.files.profile[0].location;
    }
    if (!!req?.files.banner) {
      user.banner = req.files.banner[0].location;
    }
    await user.save();
    const newtoken = await generateToken(user._id)
    if (newtoken.status === 'success') {
      return res.json({
        status: "success",
        message: `Successfully Updated Basic Profile Details`,
        token: newtoken.token
      });

    } else {
      return res.json({
        status: "success",
        message: `Successfully Updated Basic Profile Details`,
      });
    }
  } catch (error) {
    return res.json({
      status: "error",
      message: `Error Found while trying to upload Documents ${error.message}`,
    });
  }
},
);

// Follow Each Other
UserRouter.get("/follow", UserAuthentication, async (req, res) => {
  const { userId, status } = req.query;
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "Authentication");
  try {
    const userIdResult = await FollowModel.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    ]);

    if (userIdResult.length == 0) {
      if (status == "false") {
        return res.json({
          status: "error",
          message: "No Follow Found",
        });
      } else {
        const follow = new FollowModel({
          followedBy: decoded._id,
          userId: userId,
        });
        await follow.save();
        return res.json({ status: "success", message: `Started Following` });
      }
    } else {
      const followResult = await FollowModel.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            followedBy: {
              $elemMatch: { $eq: new mongoose.Types.ObjectId(decoded._id) },
            },
          },
        },
      ]);

      if (followResult.length > 0) {
        if (status == "false") {
          const follow = await FollowModel.updateOne(
            { userId: new mongoose.Types.ObjectId(userId) },
            { $pull: { followedBy: new mongoose.Types.ObjectId(decoded._id) } }, // Add ObjectId to the array
          );

          return res.json({
            status: "success",
            message: "Stopped Following",
          });
        } else {
          return res.json({
            status: "success",
            message: "You Already Follow This User",
          });
        }
      } else {
        if (status == "false") {
          return res.json({
            status: "success",
            message: "You Already Unfollow This User",
          });
        } else {
          const follow = await FollowModel.updateOne(
            { userId: new mongoose.Types.ObjectId(userId) },
            { $push: { followedBy: new mongoose.Types.ObjectId(decoded._id) } }, // Add ObjectId to the array
          );
          return res.json({
            status: "success",
            message: "Started Following",
          });
        }
      }
    }
  } catch (error) {
    return res.json({
      status: "error",
      message: `Failed To Get Follow Details Of User's ${error.message}`,
    });
  }
});

UserRouter.get("/stats/artist", ArtistAuthentication, async (req, res) => {
  // Get Job Applied List, Reviews , View , Bookmarks List
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "Authentication");
  try {
    const jobs = await JobAppliedModel.countDocuments({
      appliedBy: decoded._id,
    });
    const reviews = await ReviewModel.countDocuments({
      reviewedBy: "collabArtist",
      reviewedByUserId: decoded._id,
    });
    const bookmarks = await BookMarkModel.countDocuments({
      bookmarkedBy: decoded._id,
    });
    const followers = await FollowModel.find({ userId: decoded._id });
    let followerslength = 0;
    if (followers.length !== 0) {
      followerslength = followers[0]?.followedBy.length;
    }
    return res.json({
      status: "success",
      data: { jobs, reviews, bookmarks, followerslength },
    });
  } catch (error) {
    return res.json({
      status: "error",
      message: `Failed To Fetch Current Status Of Artist ${error.message}`,
    });
  }
});

UserRouter.get("/basicdetails/update/google", uploadMiddleWare.fields([{ name: "profile", maxCount: 1 }, { name: "banner", maxCount: 1 },]), UserAuthentication, async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "Authentication");
  const { gender, country, state, city, dob, category, accountType } =
    req.body;

  if (!req?.files?.profile) {
    return res.json({
      status: "error",
      error: "please upload a Profile Image",
    });
  }

  if (!req?.files?.banner) {
    return res.json({
      status: "error",
      error: "please upload a Banner Image",
    });
  }

  try {
    const user = await UserModel.findOne({ _id: decoded._id });
    user.gender = gender;
    user.dob = dob;
    user.category = category || "";
    user.accountType = accountType;

    if (!user.address) {
      user.address = {}; // Initialize address if it doesn't exist
    }

    // Safely update address fields
    user.address.country = country || user.address.country;
    user.address.state = state || user.address.state;
    user.address.city = city || user.address.city;

    if (!!req?.files.profile) {
      user.profile = req.files.profile[0].location;
    }
    if (!!req?.files.banner) {
      user.banner = req.files.banner[0].location;
    }
    await user.save();
    return res.json({
      status: "success",
      message: `Successfully Updated Basic Profile Details`,
    });
  } catch (error) {
    return res.json({
      status: "error",
      message: `Error Found while trying to upload Documents ${error.message}`,
    });
  }
},
);

// User Subscription Plans

UserRouter.get("/subscription/list", UserAuthentication, async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "Authentication");
  try {
    const plan = await SubscriptionModel.aggregate([
      { $match: { accountType: decoded.accountType } },
      {
        $lookup: {
          from: "features",
          localField: "featurelist",
          foreignField: "_id",
          pipeline: [
            { $match: { status: true } },
            {
              $project: { status: 0, __v: 0 },
            },
          ],
          as: "plandetails",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "subscription",
          pipeline: [
            { $match: { _id: new mongoose.Types.ObjectId(decoded._id) } },
          ],
          as: "userdetails",
        },
      },
      {
        $addFields: {
          isApplied: {
            $cond: {
              if: { $gt: [{ $size: "$userdetails" }, 0] },
              then: true,
              else: false,
            },
          },
        },
      },
      { $project: { featurelist: 0, __v: 0, userdetails: 0 } },
    ]);
    if (plan.length == 0) {
      return res.json({
        status: "error",
        message: "No Subscription Plan Found",
      });
    } else {
      return res.json({
        status: "success",
        data: plan,
      });
    }
  } catch (error) {
    return res.json({
      status: "error",
      message: `Error Found While Getting Subscription Plans ${error}`,
    });
  }
});

// User Subscription Plan Details
UserRouter.get("/me/subscription", UserAuthentication, async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "Authentication");
  try {
    const plan = await SubscriptionModel.aggregate([
      {
        $match: {
          accountType: decoded.accountType,
          _id: new mongoose.Types.ObjectId(decoded.subscription),
        },
      },
      {
        $lookup: {
          from: "features",
          localField: "featurelist",
          foreignField: "_id",
          pipeline: [
            { $match: { status: true } },
            {
              $project: { status: 0, __v: 0 },
            },
          ],
          as: "plandetails",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "subscription",
          pipeline: [
            { $match: { _id: new mongoose.Types.ObjectId(decoded._id) } },
            { $project: { planExpireAt: 1 } },
          ],
          as: "userdetails",
        },
      },
      {
        $addFields: {
          isApplied: {
            $cond: {
              if: { $gt: [{ $size: "$userdetails" }, 0] },
              then: true,
              else: false,
            },
          },
        },
      },
      { $project: { featurelist: 0, __v: 0 } },
    ]);
    if (plan.length == 0) {
      return res.json({
        status: "error",
        message: "No Subscription Plan Found",
      });
    } else {
      return res.json({
        status: "success",
        data: plan,
      });
    }
  } catch (error) {
    return res.json({
      status: "error",
      message: `Error Found While Getting Subscription Plans ${error}`,
    });
  }
});

// Purchase Subscription
UserRouter.post("/subscription/purchase/:id", UserAuthentication, async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "Authentication");
  try {
    const userDetails = await UserModel.find({ _id: decoded._id });
    if (userDetails.length === 0) {
      return res.json({
        status: "error",
        message: "No User Found",
      });
    }
    const planDetails = await SubscriptionModel.find({
      _id: req.params.id,
      accountType: decoded.accountType,
    });
    if (planDetails.length === 0) {
      return res.json({
        status: "error",
        message: "No Subscription Plan Detail found",
      });
    }

    const walletDetails = await WalletModel.find({ userId: decoded._id });

    if (planDetails[0].amount > walletDetails[0].balance) {
      return res.json({
        status: "error",
        message:
          "You Don't have enough balance in your wallet. Please Recharge To Purchase This Subscription Plan",
      });
    }
    const subscribetransaction = new TransactionModel({
      amount: planDetails[0].amount,
      type: "Debit",
      message: "Subscibing To New Plan",
      userId: decoded._id,
      status: "Success",
      paymentId: "Subscription Purchase",
      display:decoded._id
    });
    await subscribetransaction.save();
    const walletupdate = await subAmountinWallet({
      amount: planDetails[0].amount,
      userId: decoded._id,
    });
    if (walletupdate.status === "error") {
      return res.json({
        status: "error",
        message: walletupdate.message,
      });
    }

    const subscriptionlog = new SubscriptionLogs({
      userId: decoded._id,
      planId: req.params.id,
      purchaseDate: currentDate,
      expireDate: userDetails[0]?.planExpireAt
        ? getDateAfter30Days(userDetails[0]?.planExpireAt)
        : getDateAfter30Days(currentDate),
    });
    await subscriptionlog.save();

    let newSubscriptionPlan = userDetails[0]?.subscription
      ? userDetails[0].planExpireAt >= currentDate
        ? userDetails[0]?.subscription
        : req.params.id
      : req.params.id;
    let planExpireDate = userDetails[0]?.planExpireAt
      ? userDetails[0].planExpireAt >= currentDate
        ? getDateAfter30Days(userDetails[0]?.planExpireAt)
        : getDateAfter30Days(currentDate)
      : getDateAfter30Days(currentDate);

    const userUpdatedDetails = await UserModel.findByIdAndUpdate(
      decoded._id,
      {
        subscription: newSubscriptionPlan,
        planExpireAt: planExpireDate,
      },
    );
    let newtoken = await generateToken(userDetails[0]._id)

    if (newtoken.status === 'success') {
      return res.json({
        status: "success",
        message: "Subscription Plan Purchased Successfully ",
        token: newtoken.token
      });

    } else {
      return res.json({
        status: "success",
        message: "Subscription Plan Purchased Successfully ",
      });

    }
  } catch (error) {
    return res.json({
      status: "error",
      message: `Error Found While Getting Subscription Plans ${error}`,
    });
  }
},
);


// Google Login For Application 
UserRouter.get("/check/:id", async (req, res) => {
  const { id } = req.params
  try {
    const userDetails = await UserModel.find({ email: id });
    if (userDetails.length === 0) {
      return res.json({
        status: "error",
        message: "No User Found",
      });
    }

    let token = jwt.sign(
      {
        _id: userDetails[0]._id,
        name: userDetails[0].name,
        email: userDetails[0].email,
        accountType: userDetails[0].accountType,
        profile: userDetails[0].profile,
        verified: userDetails[0].verified,
        subscription: userDetails[0].subscription,
        planExpireAt: userDetails[0].planExpireAt,
        exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
      },
      "Authentication",
    );
    if (userDetails[0].dob === undefined || userDetails[0].dob === "") {
      return res.json({
        status: "success",
        message: "Login Successful",
        token: token,
        type: userDetails[0].accountType,
        redirect: "/user/basicprofile",
      });
    }
    if (
      userDetails[0].profile === undefined ||
      userDetails[0].profile === ""
    ) {
      return res.json({
        status: "success",
        message: "Login Successful",
        token: token,
        type: userDetails[0].accountType,
        redirect: "/user/basicprofile",
      });
    }
    return res.json({
      status: "success",
      message: "Login Successfully",
      token: token,
      type: userDetails[0].accountType,
    });
  } catch (error) {
    return res.json({
      status: "error",
      message: `Error Found While Getting Subscription Plans ${error}`,
    });
  }
},
);


// Find User By Search For Artist
UserRouter.post("/filter/artist", UserAuthentication, async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "Authentication");
  const { country, skills, category, gender } = req.body;
  const query = {};
  // query.verified = true,
  query.disabled = false
  query.accountType = 'artist'
  query._id = { $ne: decoded._id }

  if (category !== '') {
    query.category = category;
  }
  if (gender !== '') {
    query.gender = gender;
  }


  if (skills && skills.length > 0) {
    query.skills = { $in: skills }; // Matches any skill in the user's skill set
  }

  if (country !== '') {
    query["address.country"] = country;
  }

  try {
    const users = await UserModel.find(query, { forgotpasswordtoken: 0, otp: 0, password: 0 })
    if (users.length === 0) {
      return res.json({ status: 'error', message: 'No Artist Found ' })

    } else {
      return res.json({ status: 'success', data: users })
    }
  } catch (error) {
    return res.json({ status: 'error', message: `Failed To Filter Artists ${error.message}` })
  }

});

// Find User By Search For Professional
UserRouter.post("/filter/professional", UserAuthentication, async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "Authentication");
  const { country, skills, category, } = req.body;
  const query = {};
  // query.verified = true,
  query.disabled = false
  query.accountType = 'professional'
  query._id = { $ne: decoded._id }


  if (category !== '') {
    query.category = category;
  }

  if (skills && skills.length > 0) {
    query.skills = { $in: skills }; // Matches any skill in the user's skill set
  }

  if (country !== '') {
    query["address.country"] = country;
  }

  try {
    const users = await UserModel.find(query)
    if (users.length === 0) {
      return res.json({ status: 'error', message: 'No Professionals Found ' })

    } else {
      return res.json({ status: 'success', data: users })
    }
  } catch (error) {
    return res.json({ status: 'error', message: `Failed To Filter Professionals ${error.message}` })
  }

});

// Upgrade Guest Account To Artist || Professional
UserRouter.patch("/me/account/upgrade", uploadMiddleWare.fields([{ name: "profile", maxCount: 1 }, { name: "banner", maxCount: 1 }]), UserAuthentication, async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "Authentication");
  try {
    const updatedUser = await UserModel.findOne({ _id: decoded._id });

    let addressdata = {};
    addressdata.country = req.body?.country || updatedUser?.address?.country;
    addressdata.state = req.body?.state || updatedUser?.address?.state;
    addressdata.city = req.body?.city || updatedUser?.address?.city;
    addressdata.location =
      req.body?.location || updatedUser?.address?.location;

    let sociallinks = {};
    sociallinks.facebook =
      req.body?.facebook || updatedUser?.sociallinks?.facebook;
    sociallinks.linkdein =
      req.body?.linkdein || updatedUser?.sociallinks?.linkdein;
    sociallinks.twitter =
      req.body?.twitter || updatedUser?.sociallinks?.twitter;
    sociallinks.instagram =
      req.body?.instagram || updatedUser?.sociallinks?.instagram;

    let profile;
    if (!!req?.files.profile) {
      profile = req.files.profile[0]?.location || updatedUser?.profile;
    }
    let banner;
    if (!!req?.files.banner) {
      banner = req.files.banner[0]?.location || updatedUser?.banner;
    }

    let skills;
    if (req.body.skills) {
      skills = JSON.parse(req.body?.skills)
    } else {
      skills = updatedUser?.skills
    }

    let companycategory;
    if (updatedUser?.accountType === "professional") {
      companycategory =
        req.body?.companycategory || updatedUser?.companycategory;
    }

    const updatedData = {
      ...req.body, // Update other fields if provided
      banner: banner, // Use the new image if uploaded
      profile: profile,
      address: addressdata,
      sociallinks: sociallinks,
      skills: skills,
      companycategory: companycategory,
      accountType: req.body?.accountType
    };

    const updatedItem = await UserModel.findByIdAndUpdate(
      decoded._id,
      updatedData,
      {
        new: true, // Return the updated document
      },
    );

    const newtoken = await generateToken({ id: decoded._id })

    if (newtoken.status === 'success') {
      return res.json({
        status: "success",
        message: `Successfully Updated User AccountType`,
        token: newtoken.token
      });
    } else {
      return res.json({
        status: "success",
        message: `Successfully Updated User AccountType`,
      });
    }
  } catch (error) {
    return res.json({
      status: "error",
      message: `Failed To Update User AccountType  ${error.message}`,
    });
  }
},
);

// Send Otp To User Account For Email Verification
UserRouter.get("/otp/send", UserAuthentication, async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "Authentication");
  try {
    const userExists = await UserModel.find({ email: decoded.email });
    if (userExists.length === 0) {
      return res.json({
        status: "error",
        message: "No User Exists With This Email, Please SignUp First",
        redirect: "/user/register",
      });
    } else {
      let newotp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        specialChars: false,
        lowerCaseAlphabets: false,
      });
      const existsotp = await OtpModel.find({
        userId: userExists[0]._id,
      });
      if (existsotp.length !== 0) {
        return res.json({
          status: "error",
          message:
            "Check Your mailbox You can still use your old otp to reset the password ",
        });
      }
      const VerifyAccount = new OtpModel({
        userId: userExists[0]._id,
        otp: newotp,
        expireAt: Date.now() + 60 * 1000,
      });
      await VerifyAccount.save();
      let verifyotptemplate = path.join(
        __dirname,
        "../emailtemplate/verifyemail.ejs",
      );
      ejs.renderFile(
        verifyotptemplate,
        { otp: newotp },
        function (err, template) {
          if (err) {
            return res.json({ status: "error", message: err.message });
          } else {
            const mailOptions = {
              from: process.env.emailuser,
              to: `${userExists[0].email}`,
              subject: "Otp To Verifiy Email ",
              html: template,
            };
            gmailtransporter.sendMail(mailOptions, (error, info) => {
              if (error) {
                return res.json({
                  status: "error",
                  message: `Failed to send email ${error.message}`,
                  redirect: "/",
                });
              } else {
                return res.json({
                  status: "success",
                  message: "Please Check Your Email",
                  redirect: "/",
                });
              }
            });
          }
        },
      );
    }
  } catch (error) {
    console.log("eror", error);

    return res.json({
      status: "error",
      message: `Error Found While Sending Otp ${error.message}`,
    });
  }
})

// Send Otp To Backend To Verify User Email Address
UserRouter.post("/otp/verify", UserAuthentication, async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "Authentication")
  const { otp } = req.body;
  if (!otp) {
    return res.json({ status: 'error', message: 'Otp Is Required To Verify Email Id' })
  }
  try {
    const otpExists = await OtpModel.find({
      otp: otp,
      userId: decoded._id
    })
    if (otpExists.length === 0) {
      return res.json({ status: 'error', message: `Email Verification Failed. Unable To Verifiy Otp` })
    } else {

      const updateuser = await UserModel.findByIdAndUpdate(decoded._id, { emailVerified: true }, { new: true } // Optional: Returns the updated document
      )
      if (updateuser !== null) {
        return res.json({ status: 'success', message: 'User Email Verified' })
      } else if (updateuser === null) {
        return res.json({ status: 'error', message: 'User Email Verfication Failed' })
      }
    }
  } catch (error) {
    return res.json({ status: 'error', message: `Failed To Verify Otp ${error.message}` })
  }
})



// Send Otp To User Account For Mobile Verification
UserRouter.get("/otp/send/phoneno", UserAuthentication, async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "Authentication");
  try {
    const userExists = await UserModel.find({ email: decoded.email });
    if (userExists.length === 0) {
      return res.json({
        status: "error",
        message: "No User Exists With This Email, Please SignUp First",
        redirect: "/user/register",
      });
    } else {
      const existsotp = await OtpModel.find({
        userId: userExists[0]._id,
      });
      if (existsotp.length !== 0) {
        return res.json({
          status: "error",
          message:
            "Check Your mailbox You can still use your old otp to reset the password ",
        });
      }
      const phoneno = `+${userExists[0].phoneno}`
      const optprocess = await SendOtp({ phoneno: phoneno });

      if (optprocess?.status === 'success') {
        const optCreate = await saveOtp({ userId: decoded._id, requestId: optprocess?.requestId });
        console.log("topcreate ", optCreate);

        if (optCreate?.status === 'success') {
          return res.json({ status: 'success', message: 'Message Sent Successfully!' })
        } else {
          return res.json({ status: 'error', message: `Failed To Save Otp ${optCreate.message}` })
        }

      } else {
        return res.json({ status: 'error', message: `Failed To Save Otp ${optprocess.message}` })

      }
    }
  } catch (error) {
    return res.json({
      status: "error",
      message: `Error Found While Sending Otp ${error.message}`,
    });
  }
})

// Send Otp To Backend To Verify User MobileNo
UserRouter.post("/otp/verify/phoneno", UserAuthentication, async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "Authentication");
  
  const { otp } = req.body;
  if (!otp) {
    return res.json({ status: 'error', message: 'Otp Is Required To Verify Email Id' })
  }
  try {
    const otpExists = await OtpModel.find({
      userId: decoded._id
    })
    if (otpExists.length === 0) {
      return res.json({ status: 'error', message: `Phone Verification Failed. Unable To Find OTP Value & RequestID.` })
    } else {
      const otpVerification = await VerifyOtp({ otp: otp, requestId: otpExists[0]?.requestId });
      console.log("otp verification", otpVerification);
      if (otpVerification.status === 'success') {
        const updateuser = await UserModel.findByIdAndUpdate(decoded._id, { phonenoVerified: true }, { new: true } // Optional: Returns the updated document
        )
        if (updateuser !== null) {
          return res.json({ status: 'success', message: 'User PhoneNo Verified Successfully' })
        } else if (updateuser === null) {
          return res.json({ status: 'error', message: 'User PhoneNo Verfication Failed' })
        }
      } else {
        return res.json({ status: 'error', message: `User PhoneNo Verfication Failed ${otpVerification?.message}` })
      }

    }
  } catch (error) {
    return res.json({ status: 'error', message: `Failed To Verify Phone No ${error.message}` })
  }
})




module.exports = { UserRouter };
