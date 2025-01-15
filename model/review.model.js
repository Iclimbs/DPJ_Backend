const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;
// Collab Artist Can Provide Review & Rating For The Event & Artist Who Has Created The Event
// Event Creator Artist Can Provide Review & Rating To The Collab Artist
// Artist's (Who Are Buying Ticket For The Event ) Can Provide Review & Rating To The Event
const reviewSchema = mongoose.Schema({
    eventId: {
        type: ObjectId,
    },
    userId: {
        type: ObjectId,
    },
    rating: {
        type: Number,
        required: true
    },
    review: {
        type: String,
        required: true
    },
    reviewedBy: {
        type: String,
        required: true,
        enum: ["eventCreator", "collabArtist", "artist"]
    },
    reviewedByUserId: {
        type: ObjectId,
        required: true
    },
    CreatedAt: { type: Date, default: Date.now }, // Save The Time When the following Job was created 
})

const ReviewModel = mongoose.model("reviews", reviewSchema)
module.exports = { ReviewModel }