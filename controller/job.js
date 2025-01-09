// Basic Required Modules
require('dotenv').config()
const jwt = require('jsonwebtoken');
const express = require("express");

// Basic Model Imports
const { JobModel } = require('../model/ModelExport');


// Basic Middleware Imports
const { ProfessionalAuthentication, UserAuthentication,AdminAuthentication } = require('../middleware/MiddlewareExport');

const JobRouter = express.Router()


// Creating A Job Post

JobRouter.post("/add", UserAuthentication, async (req, res) => {
    const token = req.headers.authorization.split(" ")[1]
    const decoded = jwt.verify(token, 'Authentication')
    const { salary, role, workType, description, position, education, experience, timeDuration, employmentType, expireAt } = req.body;

    const newJobPosting = new JobModel({
        createdBy: decoded._id,
        salary, role, workType, description, position, education, experience, timeDuration, employmentType, expireAt
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