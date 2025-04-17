const mongoose = require("mongoose")
const { ObjectId } = mongoose.Schema.Types;

const ticketSchema = mongoose.Schema({
    eventId: {
        type: ObjectId,
        
        required: true
    },
    createdBy: {
        type: ObjectId,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    CreatedAt: { type: Date, default: Date.now }, // Save The Time When the following Job was created 
})
const TicketModel = mongoose.model("tickets",ticketSchema)
module.exports = {TicketModel}