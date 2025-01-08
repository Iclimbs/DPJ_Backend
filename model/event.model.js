const mongoose = require("mongoose")
const { ObjectId } = mongoose.Schema.Types;
const { Schema } = mongoose;
const addressSchema = new Schema({
    country: {
        type: String,
    },
    state: {
        type: String,
    },
    city: {
        type: String,
    },
    location: {
        type: String,
    }
})
const eventschema = mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    banner: {
        type: String,
        required: true
    },
    startDateTime: {
        type: String,
        required: true
    },
    startTime: {
        type: String,
        required: true
    },
    startDate: {
        type: String,
        required: true
    },
    endDateTime: {
        type: String,
        required: true
    },
    endTime: {
        type: String,
        required: true
    },
    endDate: {
        type: String,
        required: true
    },
    createdBy: {
        type: ObjectId,
        required: true
    },
    link: String,
    address: addressSchema,
    type: {
        type: String,
        required: true,
        enum: ["Event", "Collaboration"]

    },
    eventType: {
        type: String,
        required: true,
        enum: ["Physical", "Virtual"]
    },
    CreatedAt: { type: Date, default: Date.now } // Save The Time When the following Job was created 
})

const EventModel = mongoose.model("Events", eventschema);
module.exports = { EventModel };