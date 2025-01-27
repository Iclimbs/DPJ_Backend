const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;
const passwordSchema = mongoose.Schema({
    userId: {
        type: ObjectId,
        required: true
    },
    token: {
        type: String,
        required: true,
    },
    otp: {
        type: Number,
        required: true
    },
    expireAt: {
        type: Date,
        default: null, // This will be populated only if `shouldExpire` is true
        index: { expires: '0' } // TTL index based on this field; expires if not null
    },
    CreatedAt: { type: Date, default: Date.now },
})

const ForgotPasswordModel = mongoose.model("ResetPassword", passwordSchema)
module.exports = { ForgotPasswordModel }
