const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;
const jobappliedschema = mongoose.Schema({
    appliedBy: { type: ObjectId, required: true }, // Save The Professional ID who has applied for the JOB
    jobId: { type: ObjectId, required: true }, // Save The Job ID for which the Professional has applied
    name: { type: String, required: true }, // Save Salary in Range Link :- 40k - 50k
    email: { type: String, required: true }, // Save Role Link :-  Singer, Drummer 
    profile: { type: String, required: true }, // Save Role Link :-  Singer, Drummer 
    coverLetter: { type: String, required: true },
    cv: { type: String, required: true },
    status: { // Save Current Status of The Job whether the job is currently active or in hold or has expired
        type: String,
        required: true,
        enum: ['Viewed', 'Hold', 'Rejected', "Accepted", "Pending"],
        default: "Pending"
    },
    CreatedAt: { type: Date, default: Date.now } // Save The Time When the following Job was created 
});
const JobAppliedModel = mongoose.model("Job_Application", jobappliedschema);
module.exports = { JobAppliedModel };