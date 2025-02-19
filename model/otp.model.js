const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;
const otpSchema = mongoose.Schema({
    userId: {
        type: ObjectId,
        required: true
    },
    otp: {
        type: Number,
        required: true,
        unique: true
    },
    expireAt: {
        type: Date,
        default: null, // This will be populated only if `shouldExpire` is true
    },
    CreatedAt: { type: Date, default: Date.now },
})
otpSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

const OtpModel = mongoose.model("EmailVerificationOtp", otpSchema)
module.exports = { OtpModel }
