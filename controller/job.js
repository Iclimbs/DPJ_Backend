// Basic Required Modules
require('dotenv').config()
const jwt = require('jsonwebtoken');
const express = require("express");

// Basic Model Imports
const { JobModel } = require('../model/ModelExport');


// Basic Middleware Imports
const { ProfessionalAuthentication, UserAuthentication, AdminAuthentication } = require('../middleware/MiddlewareExport');

const JobRouter = express.Router()


// Creating A Job Post

JobRouter.post("/add", UserAuthentication, async (req, res) => {
    const token = req.headers.authorization.split(" ")[1]
    const decoded = jwt.verify(token, 'Authentication')
    // Calculating End Date of Job || Job Will be Active For 30 Days
    const currentDate = new Date();
    const dateObj = new Date(currentDate.setDate(currentDate.getDate() + 30));
    // Creating Date
    const month = (dateObj.getUTCMonth() + 1) < 10 ? String(dateObj.getUTCMonth() + 1).padStart(2, '0') : dateObj.getUTCMonth() + 1 // months from 1-12
    const day = dateObj.getUTCDate() < 10 ? String(dateObj.getUTCDate()).padStart(2, '0') : dateObj.getUTCDate()
    const year = dateObj.getUTCFullYear();
    const endDate = year + "-" + month + "-" + day;

    const { salary, role, workType, description, position, education, experience, companyOverview, employmentType } = req.body;

    console.log(req.body);
    

    let addressdetails = {
        country: req.body.country,
        state: req.body.state,
        city: req.body.city,
        location: req.body.location
    }
    let jobBenefits;
    if (typeof (req.body.benefits) === "string") {
        jobBenefits = JSON.parse(req.body.benefits)
    } else {
        jobBenefits = req.body.benefits
    }
    let keyResponsibilities;
    if (typeof (req.body.keyResponsibilities) === "string") {
        keyResponsibilities = JSON.parse(req.body.keyResponsibilities)
    } else {
        keyResponsibilities = req.body.keyResponsibilities
    }

    const newJobPosting = new JobModel({
        createdBy: decoded._id,
        salary, role, workType, description,
        position, education, experience, companyOverview,
        employmentType, address: addressdetails, endtime: endDate,
        benefits: jobBenefits, keyResponsibilities: keyResponsibilities
    })
    try {
        await newJobPosting.save();
        res.json({ status: "success", message: `Job Creation Successful. Please Wait Till Admin Verify This Job !!` })

    } catch (error) {
        res.json({ status: "error", message: `Failed To Create New Job Posting ${error.message}` })
    }
})


// Editing Job Post Details

JobRouter.patch("/edit/:id", ProfessionalAuthentication, async (req, res) => {
    const { id } = req.params;
    const JobDetails = await JobModel.findByIdAndUpdate({ _id: id }, req.body)
    try {
        await JobDetails.save();
        res.json({ status: "success", message: `Job Details Updated Successfully !!` })
    } catch (error) {
        res.json({ status: "error", message: `Failed To Update Job Details ${error.message}` })
    }
})



// Disable Job Details

JobRouter.patch("/disable/:id", AdminAuthentication, async (req, res) => {
    const { id } = req.params;
    const JobDetails = await JobModel.find({ _id: id })
    try {
        JobDetails[0].status = 'Hold'
        await JobDetails[0].save();
        res.json({ status: "success", message: `Job Post Disabled Successfully !!` })
    } catch (error) {
        res.json({ status: "error", message: `Failed To Disable Job Details ${error.message}` })
    }
})



// Get Job Details 

JobRouter.get("/detailone/:id", UserAuthentication, async (req, res) => {
    const { id } = req.params;
    try {
        const JobDetails = await JobModel.find({ _id: id })
        if (JobDetails.lenght !== 0) {
            res.json({ status: "success", data: JobDetails })
        } else {
            res.json({ status: "error", message: `No Job Post Found with this ID !! ` })
        }
    } catch (error) {
        res.json({ status: "error", message: `Failed To GET Job Details ${error.message}` })
    }
})



// Get All Job List

JobRouter.patch("/listall", UserAuthentication, async (req, res) => {
    try {
        const JobDetails = await JobModel.find({})
        if (JobDetails.lenght !== 0) {
            res.json({ status: "success", data: JobDetails })
        } else {
            res.json({ status: "error", message: `No Job Post Found !!` })
        }
    } catch (error) {
        res.json({ status: "error", message: `Failed To Get Job List ${error.message}` })
    }
})

JobRouter.patch("/listall/professional", UserAuthentication, async (req, res) => {
    const token = req.headers.authorization.split(" ")[1]
    const decoded = jwt.verify(token, 'Authentication')
    try {
        const JobDetails = await JobModel.find({ createdBy: decoded._id })
        if (JobDetails.lenght !== 0) {
            res.json({ status: "success", data: JobDetails })
        } else {
            res.json({ status: "error", message: `No Job Post Found !!` })
        }
    } catch (error) {
        res.json({ status: "error", message: `Failed To Get Job List ${error.message}` })
    }
})

JobRouter.post("/apply", UserAuthentication, async (req, res) => {
    const token = req.headers.authorization.split(" ")[1]
    const decoded = jwt.verify(token, 'Authentication')
    try {
        const JobDetails = await JobModel.find({ createdBy: decoded._id })
        if (JobDetails.lenght !== 0) {
            res.json({ status: "success", data: JobDetails })
        } else {
            res.json({ status: "error", message: `No Job Post Found !!` })
        }
    } catch (error) {
        res.json({ status: "error", message: `Failed To Get Job List ${error.message}` })
    }
})


module.exports = { JobRouter }