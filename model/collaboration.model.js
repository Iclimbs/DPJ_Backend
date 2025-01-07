const mongoose = require("mongoose")
const objectId = mongoose.Schema.Types.ObjectId
const CollabSchema = mongoose.Schema({
    userId: objectId,
    email: String,
    name: String,
    amount: Number,
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