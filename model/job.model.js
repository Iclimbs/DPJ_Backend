const mongoose = require("mongoose");
const jobschema = mongoose.Schema({
    createdBy: { type: String, required: true }, // Save The Professional ID by whom this Job was ceated
    salary: { type: String, required: true }, // Save Salary in Range Link :- 40k - 50k
    role: { type: String, required: true }, // Save Role Link :-  Singer, Drummer 
    workType: { // Save Work Type Like WFH, WFO, HYBRID
        type: String, required: true,
        enum: ['WFH', 'WFO', 'HYBRID'],
        default: 'WFO'
    },
    address: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    benefits: {
        type: String,
        required: true
    },
    keyResponsibilities: {   // Save Key Responsibilities of the Job
        type: String,
        required: true
    },
    // Save Location of the Job
    description: { // Save Detailed Description of Job & basic detail about the job
        type: String,
        required: true
    },
    position: { // Save Job Postition Details Like :- Senior, Mid-level, Fresher
        type: String,
    },
    education: { // Save Minimum Qualification Needed To Apply For the Job
        type: String,
        required: true
    },
    companyOverview: {
        type: String,
        required: true
    },// Save Overview of the Job
    experience: { // Save Minimum Number of Experience a person should have to apply for the Job
        type: String,
        required: true
    },
    timeDuration: { // Time Period For Which Company is hiring anyone For This Position
        type: String,
    },
    employmentType: {
        type: String,
        required: true,
        enum: ["Full Time", "Internship"]
    },
    expireAt: { // Save Expiration Time Of the Job Post 
        type: Date,
    },
    status: { // Save Current Status of The Job whether the job is currently active or in hold or has expired
        type: String,
        required: true,
        enum: ['Active', 'Hold', 'Expired', 'Pending'],
        default: 'Pending'
    },
    CreatedAt: { type: Date, default: Date.now }, // Save The Time When the following Job was created 

});
const JobModel = mongoose.model("Jobs", jobschema);
module.exports = { JobModel };