const mongoose = require("mongoose")
const { ObjectId } = mongoose.Schema.Types;
const walletSchema = mongoose.Schema({
    balance: {
        type: Number,
        required: true,
    },
    userId: {
        type: ObjectId,
        required: true
    },
    CreatedAt: { type: Date, default: Date.now }
})

const WalletModel = mongoose.model("Wallet", walletSchema)
module.exports = { WalletModel }
