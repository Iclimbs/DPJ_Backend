// Basic Required Modules
require("dotenv").config();
const jwt = require("jsonwebtoken");
const express = require("express");

// Basic Model Imports
const { JobModel, JobAppliedModel, UserModel } = require("../model/ModelExport");

// Basic Middleware Imports
const { CompanyOwnerDetailsModel } = require("../model/companyOwner.model");
const { uploadMiddleWare } = require("../middleware/FileUpload");
const { ProfessionalAuthentication } = require("../middleware/Authentication");

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
        country
    } = req.body;

    const ownerdetailsexists = await CompanyOwnerDetailsModel.find({ userId: decoded._id });

    if (ownerdetailsexists.length !== 0) {
        return res.json({ status: 'error', message: 'Owner Details Already Exists !!' })
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
        resume: req.files.resume[0]?.location || "",
        profile: req.files.profile[0]?.location || "",
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

    const data = {
        fname: req.body?.fname || ownerdetailsexists[0].fname,
        lname: req.body?.lname || ownerdetailsexists[0].lname,
        phoneno: req.body?.phoneno || ownerdetailsexists[0].phoneno,
        email: req.body?.email || ownerdetailsexists[0].email,
        dob: req.body?.dob || ownerdetailsexists[0].dob,
        position: req.body?.position || ownerdetailsexists[0].position,
        industryCategory: req.body?.industryCategory || ownerdetailsexists[0].industryCategory,
        education: req.body?.education || ownerdetailsexists[0].education,
        location: req.body?.location || ownerdetailsexists[0].location,
        city: req.body?.city || ownerdetailsexists[0].city,
        state: req.body?.state || ownerdetailsexists[0].state,
        country: req.body?.country || ownerdetailsexists[0].country,
        website: req.body?.website || ownerdetailsexists[0].website,
        resume: req.files?.resume[0]?.location || ownerdetailsexists[0].resume,
        profile:req.files?.profile[0]?.location || ownerdetailsexists[0].profile
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


module.exports = { ProfessionalDetailsRouter };
