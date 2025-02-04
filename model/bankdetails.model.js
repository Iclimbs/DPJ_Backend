const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;

const bankDetailSchema = mongoose.Schema({
  userId: {
    type: ObjectId,
    required: true,
  },
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
  },
  CreatedAt: { type: Date, default: Date.now }, // Save The Time When the following Job was created
});
const BankAccountModel = mongoose.model("BankAccountDetails", bankDetailSchema);
module.exports = { BankAccountModel };
