const mongoose = require("mongoose")
const objectId = mongoose.Schema.Types.ObjectId
const CollabSchema = mongoose.Schema({
    userId: {
        type: objectId,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ["Pending", "Accepted", "Rejected"],
        default: "Pending"
    },
    eventId: { type: objectId, required: true },
    CreatedAt: { type: Date, default: Date.now } // Save The Time When the following Job was created 
})
const CollabModel = mongoose.model("Collab", CollabSchema)
module.exports = { CollabModel }