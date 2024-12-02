require('dotenv').config()
const ejs = require("ejs")
const jwt = require('jsonwebtoken');
const path = require("node:path");
const crypt = require("crypto");
const multer = require("multer");
const uploadPath = path.join(__dirname, "../public/documents");
const express = require("express");
const { ProfessionalAuthentication } = require('../middleware/Authentication');
const { JobModel } = require('../model/job.model');
const { AdminAuthentication } = require('../middleware/Authorization');
const jobRouter = express.Router()
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        let uniqueSuffix = Date.now();
        cb(null, uniqueSuffix + file.originalname);
    },
});

const upload = multer({ storage: storage });

// Creating A Job Post

jobRouter.post("/add", ProfessionalAuthentication, async (req, res) => {
    const token = req.headers.authorization.split(" ")[1]
    const decoded = jwt.verify(token, 'Authentication')
    const { salary, role, workType, description, position, education, experience, timeDuration, employmentType, expireAt } = req.body;

    const newJobPosting = new JobModel({
        createdBy: decoded._id,
        salary, role, workType, description, position, education, experience, timeDuration, employmentType, expireAt
    })
    try {
        await newJobPosting.save();
        res.json({ status: "status", message: `Job Creation Successful. Please Wait Till Admin Verify This Job !!` })

    } catch (error) {
        res.json({ status: "error", message: `Failed To Create New Job Posting ${error.message}` })
    }
})


// Editing Job Post Details

jobRouter.patch("/edit/:id", ProfessionalAuthentication, async (req, res) => {
    const { id } = req.params;
    const JobDetails = await JobModel.findByIdAndUpdate({ _id: id }, req.body)
    try {
        await JobDetails.save();
        res.json({ status: "status", message: `Job Details Updated Successfully !!` })
    } catch (error) {
        res.json({ status: "error", message: `Failed To Update Job Details ${error.message}` })
    }
})



// Disable Job Details

jobRouter.patch("/disable/:id", AdminAuthentication, async (req, res) => {
    const { id } = req.params;
    const JobDetails = await JobModel.find({ _id: id })
    try {
        JobDetails[0].status = 'Hold'
        await JobDetails[0].save();
        res.json({ status: "status", message: `Job Post Disabled Successfully !!` })
    } catch (error) {
        res.json({ status: "error", message: `Failed To Disable Job Details ${error.message}` })
    }
})



// Get Job Details 


// Get All Job List


// 



module.exports = { jobRouter }