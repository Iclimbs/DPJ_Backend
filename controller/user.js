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

// Required Modules For Google Login
const { oauth2client } = require("../service/googleConfig");

// Required Modules For Sending Email
const { transporter } = require("../service/transporter");

// Required Models 
const { UserModel, DocumentModel, FollowModel } = require("../model/ModelExport");

// Required Middleware For File Upload & User Authentication 
const { UserAuthentication, uploadMiddleWare } = require("../middleware/MiddlewareExport");


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
      if (hash.sha256(password) === userExists[0].password && userExists[0].disabled != true) {
        if (userExists[0].accountType !== "admin") {
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
            "Authentication"
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
          if (userExists[0].profile === undefined || userExists[0].profile === "") {
            return res.json({
              status: "success",
              message: "Login Successful",
              token: token,
              type: userExists[0].accountType,
              redirect: "/user/basicprofile",
            });
          }

          if (userExists[0].category === undefined || userExists[0].category === "") {
            return res.json({
              status: "success",
              message: "Login Successful",
              token: token,
              type: userExists[0].accountType,
              redirect: "/user/basicprofile",
            });
          }

          res.json({
            status: "success",
            message: "Login Successfully",
            token: token,
            type: userExists[0].accountType,
          });
        } else {
          res.json({
            status: "error",
            message: "You Cannot Login Using Admin Credential's !! ",
            redirect: "/",
          });
        }
      } else if (hash.sha256(password) !== userExists[0].password) {
        res.json({
          status: "error",
          message: "Wrong Password Please Try Again",
        });
      } else if (userExists[0].disabled === true) {
        res.json({
          status: "error",
          message: "Your Account has been Temporarily disabled",
        })
      }
    }
  } catch (error) {
    res.json({
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
      if (hash.sha256(password) === userExists[0].password && userExists[0].disabled != true) {
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
            "Authentication"
          );

          res.json({
            status: "success",
            message: "Login Successfully",
            token: token,
            type: userExists[0].accountType,
          });
        } else {
          res.json({
            status: "error",
            message: "You Can Login Only Using Admin Credential's !! ",
            redirect: "/",
          });
        }
      } else if (hash.sha256(password) !== userExists[0].password) {
        res.json({
          status: "error",
          message: "Wrong Password Please Try Again",
        });
      } else if (userExists[0].disabled === true) {
        res.json({
          status: "error",
          message: "Your Account has been Temporarily disabled",
        })
      }
    }
  } catch (error) {
    res.json({
      status: "error",
      message: `Error Found in Login ${error.message}`,
    });
  }
});

// User Registration Step 1 Basic Detail's Registration

UserRouter.post("/register", async (req, res) => {
  const { name, email, password, accountType } = req.body;
  if (accountType === "admin") {
    res.json({
      status: "error",
      message: "You Cannot Register Using Admin Credential's",
    })
  }
  const userExists = await UserModel.find({ email });
  if (userExists.length >= 1) {
    res.json({
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
      await user.save();
      res.json({
        status: "success",
        message: "Registration Successful",
        redirect: "/user/login",
      });
    } catch (error) {
      res.json({
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
          exp: Math.floor(Date.now() / 1000) + 60 * 15,
        },
        "Registration"
      );
      let link = `${process.env.domainurl}${newotp}/${forgotpasswordtoken}`;
      userExists[0].otp = newotp;
      userExists[0].forgotpasswordtoken = forgotpasswordtoken;
      try {
        await userExists[0].save();
      } catch (error) {
        return res.json({
          status: "error",
          message: "Failed To Save Use",
          redirect: "/",
        });
      }
      let forgotPasswordtemplate = path.join(
        __dirname,
        "../emailtemplate/forgotPassword.ejs"
      );
      ejs.renderFile(
        forgotPasswordtemplate,
        { link: link },
        function (err, template) {
          if (err) {
            res.json({ status: "error", message: err.message });
          } else {
            const mailOptions = {
              from: process.env.emailuser,
              to: `${userExists[0].email}`,
              subject: "Otp To Reset Password ",
              html: template,
            };
            transporter.sendMail(mailOptions, (error, info) => {
              if (error) {
                console.log(error);
                return res.json({
                  status: "error",
                  message: "Failed to send email",
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
        }
      );
    }
  } catch (error) {
    res.json({
      status: "error",
      message: `Error Found in Forgot Password ${error.message}`,
    });
  }
});

// Module to Send Otp on Email

UserRouter.post("/forgot/phone", async (req, res) => {
  try {
    const { phoneno } = req.body;
    const userExists = await UserModel.find({ phoneno });
    if (userExists.length === 0) {
      return res.json({
        status: "error",
        message: "No User Exists Please SignUp First",
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
          phoneno: userExists[0].phoneno,
          exp: Math.floor(Date.now() / 1000) + 60 * 15,
        },
        "Registration"
      );
      userExists[0].otp = newotp;
      userExists[0].forgotpasswordtoken = forgotpasswordtoken;
      try {
        await userExists[0].save();
      } catch (error) {
        return res.json({
          status: "error",
          message: "Failed To Save User New OTP",
          redirect: "/",
        });
      }
      let forgotPasswordtemplate = path.join(
        __dirname,
        "../emailtemplate/forgotPasswordmobile.ejs"
      );
      ejs.renderFile(
        forgotPasswordtemplate,
        { otp: newotp },
        function (err, template) {
          if (err) {
            res.json({ status: "error", message: err.message });
          } else {
            const mailOptions = {
              from: process.env.emailuser,
              to: `${userExists[0].email}`,
              subject: "Otp To Reset Password.",
              html: template,
            };
            transporter.sendMail(mailOptions, (error, info) => {
              if (error) {
                console.log(error);
                return res.json({
                  status: "error",
                  message: "Failed to send email",
                  redirect: "/",
                });
              } else {
                return res.json({
                  status: "success",
                  message: "Please Check Your Email",
                  redirect: "/",
                  token: forgotpasswordtoken,
                });
              }
            });
          }
        }
      );
    }
  } catch (error) {
    res.json({
      status: "error",
      message: `Error Found in Login Section ${error.message}`,
    });
  }
});

// Getting Basic User Detail's Like username, email & more which is passed via token

UserRouter.get("/me", UserAuthentication, async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  try {
    if (!token) {
      return res.json({
        status: "error",
        message: "Please Login to Access User Detail's",
        redirect: "/user/login",
      });
    } else {
      const decoded = jwt.verify(token, "Authentication");
      const user = await UserModel.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(decoded._id), // Convert id to ObjectId using 'new'
          }
        }, {
          $lookup: {
            from: 'wallets',
            localField: '_id',
            foreignField: 'userId',
            as: 'walletdetails'
          }
        }
      ]);
      return res.json({
        status: "success",
        message: "Getting User Details",
        user: user[0],
      });
    }
  } catch (error) {
    res.json({
      status: "error",
      message: `Error Found in Login Section ${error.message}`,
    });
  }
});

// Updating User Detail's in the Database.

UserRouter.patch("/me/update", uploadMiddleWare.fields([{ name: 'profile', maxCount: 1 }, { name: 'banner', maxCount: 1 }]), UserAuthentication, async (req, res) => {

  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "Authentication");

  try {
    const updatedUser = await UserModel.findOne({ _id: decoded._id });

    let addressdata = {};
    addressdata.country = req.body?.country || updatedUser?.address?.country;
    addressdata.state = req.body?.state || updatedUser?.address?.state;
    addressdata.city = req.body?.city || updatedUser?.address?.city;
    addressdata.location = req.body?.location || updatedUser?.address?.location;

    let sociallinks = {};
    sociallinks.facebook = req.body?.facebook || updatedUser?.sociallinks?.facebook;
    sociallinks.linkdein = req.body?.linkdein || updatedUser?.sociallinks?.linkdein;
    sociallinks.twitter = req.body?.twitter || updatedUser?.sociallinks?.twitter;
    sociallinks.instagram = req.body?.instagram || updatedUser?.sociallinks?.instagram;

    let profile;
    if (!!req?.files.profile) {
      profile = req.files.profile[0]?.location || updatedUser?.profile;
    }
    let banner;
    if (!!req?.files.banner) {
      banner = req.files.banner[0]?.location || updatedUser?.banner;;
    }

    let skills;

    if (updatedUser?.accountType === "artist") {
      skills = JSON.parse(req.body?.skills) || updatedUser?.skills;
    }

    let companycategory;
    if (updatedUser?.accountType === "professional") {
      companycategory = req.body?.companycategory || updatedUser?.companycategory;
    }

    const updatedData = {
      ...req.body, // Update other fields if provided
      banner: banner, // Use the new image if uploaded
      profile: profile,
      address: addressdata,
      sociallinks: sociallinks,
      skills: skills,
      companycategory: companycategory
    };

    const updatedItem = await UserModel.findByIdAndUpdate(decoded._id, updatedData, {
      new: true, // Return the updated document
    });
    return res.json({ status: "success", message: "User Details Updated" });
  } catch (error) {
    res.json({
      status: "error",
      message: `Failed To Update User Detail's  ${error.message}`,
    });
  }
});

// Step 1 Uploading Documents For Account Verifications :-

// UserRouter.post("/documentupload", upload.single("document"), UserAuthentication, async (req, res) => {
//   const token = req.headers.authorization.split(" ")[1];
//   const { accountType, documentType } = req.body;
//   const profile = req.files['profile'][0];
//   const banner = req.files['banner'][0];
//   const decoded = jwt.verify(token, "Authentication");
//   const user = await UserModel.find({ _id: decoded._id });
//   try {
//     user[0].profile = profile;
//     user[0].banner = banner;
//     await user[0].save();
//   } catch (error) {
//     res.json({
//       status: "error",
//       message: `Error Found while trying to upload Documents ${error.message}`,
//     });
//   }

//   const documentDetails = new DocumentModel({
//     documentType: documentType,
//     document: fileName,
//     userId: decoded._id,
//   });

//   try {
//     await documentDetails.save();
//     return res.json({
//       status: "success",
//       message:
//         "Documents Successfully Uploaded Kindly Wait Till we verify the documents.",
//     });
//   } catch (error) {
//     res.json({
//       status: "error",
//       message: `Error Found while trying to upload Documents ${error.message}`,
//     });
//   }
// }
// );


// Get List of All The Artists From Server It Will Be Based On Email & Category
UserRouter.get("/find/artist", UserAuthentication, async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "Authentication");
  const { search } = req.query;
  const regex = new RegExp(search, 'i');
  try {
    const results = await UserModel.find({
      $or: [
        { email: { $regex: regex, $ne: decoded.email } },
        { category: { $regex: regex } },
      ],
      accountType: "artist", disabled: "false", verified: "true"
    }, { password: 0, verified: 0, disabled: 0, CreatedAt: 0 });

    if (results.length === 0) {
      return res.json({ status: 'error', message: 'No matching records found' });
    }
    return res.json({ status: 'success', data: results });
  } catch (error) {
    return res.json({ status: 'error', message: `Èrror Found While Searching For Artist ${error.message}` });
  }
})

// Get List of All The Artists From Server User Which needs to be shown in Artist Search Page

UserRouter.get("/listall/artist", UserAuthentication, async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "Authentication");
  try {
    const results = await UserModel.find({ email: { $ne: decoded.email }, accountType: "artist", disabled: "false", verified: "true" }, { password: 0, verified: 0, disabled: 0, CreatedAt: 0 });

    if (results.length === 0) {
      return res.json({ status: 'error', message: 'No Artist found' });
    }
    return res.json({ status: 'success', data: results });
  } catch (error) {
    return res.json({ status: 'error', message: `Èrror Found While Fetching The List Of AllvArtist ${error.message}` });
  }
})

// Get List of All The Details of Artist From Server

UserRouter.get("/detailone/artist/:id", UserAuthentication, async (req, res) => {
  const { id } = req.params;
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "Authentication");
  try {
    // const results = await UserModel.find({ email: { $ne: decoded.email }, accountType: "artist", disabled: "false", verified: "true" }, { password: 0, verified: 0, disabled: 0, CreatedAt: 0 });

    const results = await UserModel.aggregate([{ $match: { _id: new mongoose.Types.ObjectId(id) } }])
    if (results.length === 0) {
      return res.json({ status: 'error', message: 'No Artist found' });
    }
    return res.json({ status: 'success', data: results });
  } catch (error) {
    return res.json({ status: 'error', message: `Èrror Found While Fetching The List Of AllvArtist ${error.message}` });
  }
})

// 

UserRouter.get("/find/professional", UserAuthentication, async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "Authentication");
  const { search } = req.query;
  const regex = new RegExp(search, 'i');
  try {
    const results = await UserModel.find({
      $or: [
        { email: { $regex: regex, $ne: decoded.email } },
        { category: { $regex: regex } },
      ],
      accountType: "artist", disabled: "false", verified: "true"
    }, { password: 0, verified: 0, disabled: 0, CreatedAt: 0 });

    if (results.length === 0) {
      return res.json({ status: 'error', message: 'No matching records found' });
    }
    return res.json({ status: 'success', data: results });
  } catch (error) {
    return res.json({ status: 'error', message: `Èrror Found While Searching For Artist ${error.message}` });
  }
})

// Get List of All The Artists From Server User Which needs to be shown in Artist Search Page

UserRouter.get("/listall/professional", UserAuthentication, async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "Authentication");
  try {
    const results = await UserModel.find({ email: { $ne: decoded.email }, accountType: "artist", disabled: "false", verified: "true" }, { password: 0, verified: 0, disabled: 0, CreatedAt: 0 });

    if (results.length === 0) {
      return res.json({ status: 'error', message: 'No Artist found' });
    }
    return res.json({ status: 'success', data: results });
  } catch (error) {
    return res.json({ status: 'error', message: `Èrror Found While Fetching The List Of AllvArtist ${error.message}` });
  }
})

// Get List of All The Details of Artist From Server

UserRouter.get("/detailone/artist/:id", UserAuthentication, async (req, res) => {
  const { id } = req.params;
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "Authentication");
  try {
    // const results = await UserModel.find({ email: { $ne: decoded.email }, accountType: "artist", disabled: "false", verified: "true" }, { password: 0, verified: 0, disabled: 0, CreatedAt: 0 });

    const results = await UserModel.aggregate([{ $match: { _id: new mongoose.Types.ObjectId(id) } }])
    if (results.length === 0) {
      return res.json({ status: 'error', message: 'No Artist found' });
    }
    return res.json({ status: 'success', data: results });
  } catch (error) {
    return res.json({ status: 'error', message: `Èrror Found While Fetching The List Of AllvArtist ${error.message}` });
  }
})


// Add Basic Profile Details 

UserRouter.post("/basicdetails/update", uploadMiddleWare.fields([{ name: 'profile', maxCount: 1 }, { name: 'banner', maxCount: 1 }]), UserAuthentication, async (req, res) => {

  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "Authentication");
  const { gender, country, state, city, dob, category } = req.body;

  if (!req?.files?.profile) {
    return res.json({ status: "error", error: "please upload a Profile Image" })
  }

  if (!req?.files?.banner) {
    return res.json({ status: "error", error: "please upload a Banner Image" })

  }

  try {
    const user = await UserModel.findOne({ _id: decoded._id });
    user.gender = gender;
    user.dob = dob;
    user.category = category;

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
    res.json({
      status: "success",
      message: `Successfully Updated Basic Profile Details`,
    });

  } catch (error) {
    res.json({
      status: "error",
      message: `Error Found while trying to upload Documents ${error.message}`,
    });
  }
}
);



// Follow Each Other 
UserRouter.get("/follow", UserAuthentication, async (req, res) => {
  const { userId, status } = req.query;
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "Authentication");
  try {
    const userIdResult = await FollowModel.aggregate([{ $match: { userId: new mongoose.Types.ObjectId(userId) } }]);

    if (userIdResult.length == 0) {
      if (status == "false") {
        res.json({
          status: "error",
          message: "No Follow Found",
        });

      } else {
        const follow = new FollowModel({
          followedBy: decoded._id,
          userId: userId,
        });
        await follow.save();
        res.json({ status: "success", message: `Started Following` });
      }

    } else {
      const followResult = await FollowModel.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            followedBy: { $elemMatch: { $eq: new mongoose.Types.ObjectId(decoded._id) } }
          }
        }
      ]);

      if (followResult.length > 0) {
        if (status == "false") {
          const follow = await FollowModel.updateOne(
            { userId: new mongoose.Types.ObjectId(userId) },
            { $pull: { followedBy: new mongoose.Types.ObjectId(decoded._id) } } // Add ObjectId to the array
          )

          res.json({
            status: "success",
            message: "Stopped Following",
          });
        } else {
          res.json({
            status: "success",
            message: "You Already Follow This User",
          });
        }

      } else {
        if (status == "false") {
          res.json({
            status: "success",
            message: "You Already Unfollow This User",
          });

        } else {
          const follow = await FollowModel.updateOne(
            { userId: new mongoose.Types.ObjectId(userId) },
            { $push: { followedBy: new mongoose.Types.ObjectId(decoded._id) } } // Add ObjectId to the array
          )
          res.json({
            status: "success",
            message: "Started Following",
          });
        }

      }
    }
  } catch (error) {
    res.json({
      status: "error",
      message: `Failed To Get Follow Details Of User's ${error.message}`,
    });
  }

})


// Register With Google

UserRouter.get("/register/google", async (req, res) => {
  try {
    const { code } = req.query;
    const googleRes = await oauth2client.getToken(code);
    oauth2client.setCredentials(googleRes.tokens);
    const googleresponse = await fetch(
      `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${googleRes.tokens.access_token}`
    );
    const result = await googleresponse.json();
    const { email, name, picture } = result;
    let user = await UserModel.findOne({ email });
    if (!user) {
      user = new UserModel({ name, email, picture, verified: { email: true } });
      await user.save();
      let token = jwt.sign(
        {
          name: user.name,
          email: user.email,
          exp: Math.floor(Date.now() / 1000) + 60 * 60,
        },
        "Authentication"
      );
      return res.json({
        status: "success",
        message: "Registration Successful",
        token: token,
      });
    } else {
      let token = jwt.sign(
        {
          name: user.name,
          email: user.email,
          exp: Math.floor(Date.now() / 1000) + 60 * 60,
        },
        "Authentication"
      );
      return res.json({
        status: "success",
        message: "Login Successful",
        token: token,
      });
    }
  } catch (error) {
    return res.json({
      status: "error",
      message: `Error Found in User Registration ${error}`,
    });
  }
});



module.exports = { UserRouter };
