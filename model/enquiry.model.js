
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;
const enquirySchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    userId: {
        type: ObjectId,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    profile: {
        type: String,
        required: true
    },
    accountType: {
        type: String,
        required: true
    },
    verified: {
        type: Boolean,
        default: false
    },
    phone: {
        type: Number,
        required: true
    },
    groupId: {
        type: ObjectId,
        required: true
    },
    CreatedAt: { type: Date, default: Date.now },
});
const EnquiryModel = mongoose.model("Enquiry", enquirySchema);
module.exports = { EnquiryModel };