// Basic Required Modules
require("dotenv").config();
const jwt = require("jsonwebtoken");
const express = require("express");
const ejs = require("ejs");
const path = require("node:path");
const otpGenerator = require("otp-generator");


// Basic Model Imports
const { JobModel, JobAppliedModel, UserModel, OtpModel } = require("../model/ModelExport");

// Basic Middleware Imports
const { CompanyOwnerDetailsModel } = require("../model/companyOwner.model");
const { uploadMiddleWare } = require("../middleware/FileUpload");
const { ProfessionalAuthentication } = require("../middleware/Authentication");
const { gmailtransporter } = require("../service/transporter");
const { SendOtp, VerifyOtp } = require("../service/otpService");
const { saveOtp } = require("./user");

const ProfessionalDetailsRouter = express.Router();

// Updating Professional User Details


ProfessionalDetailsRouter.post("/add/ownerdetails", [ProfessionalAuthentication, uploadMiddleWare.fields([{ name: "profile", maxCount: 1 }, { name: "resume", maxCount: 1 }])], async (req, res) => {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, "Authentication");

    const {
        fname,
        lname,
        phoneno,
        email,
        dob,
        position,
        industryCategory,
        education,
        location,
        city,
        state,
        country,
        gender,
        about
    } = req.body;

    const ownerdetailsexists = await CompanyOwnerDetailsModel.find({ userId: decoded._id });

    if (ownerdetailsexists.length !== 0) {
        return res.json({ status: 'error', message: 'Owner Details Already Exists !!' })
    }

    let resumefile = "";
    if (req.files?.resume) {
        resumefile = req.files?.resume[0]?.location;
    }

    let profilefile = "";
    if (req.files?.profile) {
        profilefile = req.files?.profile[0]?.location;
    }

    const ownerdetails = new CompanyOwnerDetailsModel({
        fname,
        lname,
        phoneno,
        email,
        dob,
        position,
        industryCategory,
        education,
        location,
        city,
        state,
        country,
        userId: decoded._id,
        website: req.body?.website || "",
        resume: resumefile,
        profile: profilefile,
        gender,
        about
    });
    try {
        await ownerdetails.save();
        return res.json({
            status: "success",
            message: `Updated Company Owner Details !!`,
        });
    } catch (error) {
        return res.json({
            status: "error",
            message: `Failed To Add Company Owner Details ${error.message}`,
        });
    }
},
);

ProfessionalDetailsRouter.patch("/edit/ownerdetails/:id", [ProfessionalAuthentication, uploadMiddleWare.fields([{ name: "profile", maxCount: 1 }, { name: "resume", maxCount: 1 }])], async (req, res) => {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, "Authentication");
    const { id } = req.params;

    const ownerdetailsexists = await CompanyOwnerDetailsModel.find({ userId: decoded._id, _id: id });

    if (ownerdetailsexists.length == 0) {
        return res.json({ status: 'error', message: 'No Owner Details Found For THis ' })
    }

    let resumefile;
    if (req.files?.resume) {
        resumefile = req.files?.resume[0]?.location || ownerdetailsexists[0]?.resume || "";
    }

    let profilefile;
    if (req.files?.profile) {
        profilefile = req.files?.profile[0]?.location || ownerdetailsexists[0]?.profile || "";
    }

    const data = {
        fname: req.body?.fname || ownerdetailsexists[0].fname,
        lname: req.body?.lname || ownerdetailsexists[0].lname,
        phoneno: req.body?.phoneno || ownerdetailsexists[0].phoneno,
        email: req.body?.email || ownerdetailsexists[0].email,
        about: req.body?.about || ownerdetailsexists[0].about,
        gender: req.body?.gender || ownerdetailsexists[0].gender,
        dob: req.body?.dob || ownerdetailsexists[0].dob,
        position: req.body?.position || ownerdetailsexists[0].position,
        industryCategory: req.body?.industryCategory || ownerdetailsexists[0].industryCategory,
        education: req.body?.education || ownerdetailsexists[0].education,
        location: req.body?.location || ownerdetailsexists[0].location,
        city: req.body?.city || ownerdetailsexists[0].city,
        state: req.body?.state || ownerdetailsexists[0].state,
        country: req.body?.country || ownerdetailsexists[0].country,
        website: req.body?.website || ownerdetailsexists[0].website,
        resume: resumefile,
        profile: profilefile
    }
    try {
        const updatedetails = await CompanyOwnerDetailsModel.findByIdAndUpdate(id, data, { new: true });
        if (updatedetails.length !== 0) {
            return res.json({ status: 'success', message: 'Owner Details Updated Successfully!' });
        } else {
            return res.json({ status: 'error', message: 'Failed To Updated Owner Details!' });

        }
    } catch (error) {
        return res.json({
            status: "error",
            message: `Failed To Update Company Owner Details ${error.message}`,
        });
    }
},
);

ProfessionalDetailsRouter.post("/email/send", ProfessionalAuthentication, async (req, res) => {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, "Authentication");
    try {
        const userExists = await CompanyOwnerDetailsModel.find({ userId: decoded._id });
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
                userId: userExists[0].userId,
            });
            if (existsotp.length !== 0) {
                return res.json({
                    status: "error",
                    message:
                        "Check Your mailbox You can still use your old otp to reset the password ",
                });
            }
            const VerifyAccount = new OtpModel({
                userId: userExists[0].userId,
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
                                console.log("info", info);

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
            message: `Error Found While Sending Otp ${error.message}`,
        });
    }
});

ProfessionalDetailsRouter.post("/email/verify/", ProfessionalAuthentication, async (req, res) => {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, "Authentication")
    console.log("req", req.body);

    const { otp } = req.body;
    if (!otp) {
        return res.json({ status: 'error', message: 'Otp Is Required To Verify Email Id' })
    }
    try {
        const otpExists = await OtpModel.find({
            otp: otp,
            userId: decoded._id
        })
        console.log(otpExists);

        if (otpExists.length === 0) {
            return res.json({ status: 'error', message: `Email Verification Failed. Unable To Verifiy Otp` })
        } else {

            const updateuser = await CompanyOwnerDetailsModel.find({ userId: decoded._id })
            if (updateuser.length === 0) {
                return res.json({ status: 'success', message: 'OwnerShip Detail Not Found. Email Verification Failed' })
            } else {
                updateuser[0].emailverification = true;
                await updateuser[0].save();
                return res.json({ status: 'success', message: 'Owner Email Verified Successfully!' })
            }
        }
    } catch (error) {
        return res.json({ status: 'error', message: `Failed To Verify Otp ${error.message}` })
    }
},
);

// Send Otp To User Account For Mobile Verification
ProfessionalDetailsRouter.get("/otp/send/phoneno", ProfessionalAuthentication, async (req, res) => {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, "Authentication");
    try {
        const userExists = await CompanyOwnerDetailsModel.find({ userId: decoded._id });
        if (userExists.length === 0) {
            return res.json({
                status: "error",
                message: "No User Exists With This Email, Please SignUp First",
                redirect: "/user/register",
            });
        } else {
            const existsotp = await OtpModel.find({
                userId: userExists[0].userId,
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
ProfessionalDetailsRouter.post("/otp/verify/phoneno", ProfessionalAuthentication, async (req, res) => {
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
            if (otpVerification.status === 'success') {
                const userdetails = await CompanyOwnerDetailsModel.find({userId:decoded._id});
                if (userdetails.length==0) {
                  return res.json({status:'error',message:'No Company Owner Details Found For Phone No Verification!'})  
                } 
                const updateuser = await CompanyOwnerDetailsModel.findByIdAndUpdate(userdetails[0]._id, { phonenoverification: true }, { new: true })
                console.log("user",updateuser);
                
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

module.exports = { ProfessionalDetailsRouter };
