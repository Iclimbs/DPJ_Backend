const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;
const { Schema } = mongoose;

const bankDetailsSchema = new Schema({
    accountNo: {
        type: String,
        required: true,
    },
    accountName: {
        type: String,
        required: true,
    },
    ifscCode: {
        type: String,
        required: true,
    }
});

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
    bankDetails: bankDetailsSchema,
    CreatedAt: { type: Date, default: Date.now }, // Save The Time When the following Job was created
});
const WithDrawalModel = mongoose.model("WithDrawal", amountWithDrawalSchema);
module.exports = { WithDrawalModel };
