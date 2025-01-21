const mongoose = require("mongoose")
const ObjectId = mongoose.Schema.Types.ObjectId;
const transactionSchema = mongoose.Schema({
    amount: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ["Credit", "Debit"], // Credit Means Amount is being Added To Your Account & Debit Means Amount is being Deducted From Your Account. 
        default: "Credit"
    },
    status: {
        type: String,
        required: true,
        enum: ["Success", "Failed", "In Process"], // Success Means Transaction is Successful & Failed Means Transaction is Failed. 
        default: "Success"
    },
    userId: {
        type: ObjectId,
        required: true
    },
    method: String,
    paymentId: String,
    orderId:String,
    from: {
        type: ObjectId,
    },
    to: {
        type: ObjectId,
    },
    eventId: {
        type: ObjectId,
    },
    CreatedAt: { type: Date, default: Date.now }, // Save The Time When the following Job was created 
})

const TransactionModel = mongoose.model("Transactions", transactionSchema)
module.exports = { TransactionModel }