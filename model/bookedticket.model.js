const mongoose = require("mongoose")
const { ObjectId } = mongoose.Schema.Types;

const bookedTicketSchema = mongoose.Schema({
    eventId: {
        type: ObjectId,
        required: true
    },
    bookedBy: {
        type: ObjectId,
        required: true
    },
    ticketId: {
        type: ObjectId,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    trasactionId: {
        type: ObjectId,
        required: true
    },
    CreatedAt: { type: Date, default: Date.now }, // Save The Time When the following Job was created 
})
const BookedTicketModel = mongoose.model("BookedTickets", bookedTicketSchema)
module.exports = { BookedTicketModel }