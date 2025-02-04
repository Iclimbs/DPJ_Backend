const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;

const amountWithDrawalSchema = mongoose.Schema({
    userId: {
        type: ObjectId,
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    transactionId: {
        type: ObjectId,
        required: true,
    },
    CreatedAt: { type: Date, default: Date.now }, // Save The Time When the following Job was created
});
const WithDrawalModel = mongoose.model("WithDrawal", amountWithDrawalSchema);
module.exports = { WithDrawalModel };
