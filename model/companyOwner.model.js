const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;

const companyOwnerDetailSchema = mongoose.Schema({
    userId: {
        type: ObjectId,
        required: true,
    },
    fname: {
        type: String,
        required: true,
    },
    lname: {
        type: String,
        required: true,
    },
    phoneno: {
        type: Number,
        required: true,
    },
    email: {
        type: String,
        required: true
    },
    dob: {
        type: String,
        required: true
    },
    webiste:{
        type:String
    },
    resume:{
        type:String
    },
    position: {
        type: String,
        required: true
    },
    industryCategory: {
        type: String,
        required: true
    },
    education: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    country: {
        type: String,
        required: true
    },
    CreatedAt: { type: Date, default: Date.now }, // Save The Time When the following Job was created
});
const CompanyOwnerDetailsModel = mongoose.model("CompanyOwnerDetails", companyOwnerDetailSchema);
module.exports = { CompanyOwnerDetailsModel };
