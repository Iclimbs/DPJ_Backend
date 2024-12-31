const mongoose = require("mongoose")
const speakerSchema = mongoose.Schema({
    eventId: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    bio: {
        type: String,
        required: true
    },
    CreatedAt: { type: Date, default: Date.now }, // Save The Time When the following Job was created 
})
const SpearkerModel = mongoose.model("speakers", speakerSchema)
module.exports = { SpearkerModel }