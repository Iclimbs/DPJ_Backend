const jwt = require('jsonwebtoken')
const { currentDate, currentDateTimeISO } = require('../service/currentDate')
const { SubscriptionModel,UserModel } = require('../model/ModelExport')
const { default: mongoose } = require('mongoose')

const JobCreationChecker = async (req, res, next) => {
    if (req.headers.authorization) {
        const token = req.headers.authorization.split(" ")[1]
        const decoded = jwt.verify(token, 'Authentication')

        try {
            const user = await UserModel.findOne({ _id: decoded._id })
            if (!user) {
                return res.json({ status: "error", message: "User Not Found. Please Login Again" })
            }

            const plan = user.subscription;
            const expireAt = user.planExpireAt;
            if (expireAt < currentDateTimeISO) {
                return res.json({ status: "error", message: "Subscription Expired. Please Renew Subscription" })
            }

            const planDetails = await SubscriptionModel.aggregate([{ $match: { _id: new mongoose.Types.ObjectId(plan) } },
            { $unwind: "$featurelist" },
            { $lookup: { from: "features", localField: "featurelist", foreignField: "_id", pipeline: [{ $match: { name: "JobCreation" } }], as: "featurelist" } },
            { $match: { "featurelist.0": { $exists: true } } } // to remove empty array
            ]);
            if (planDetails.length == 0) {
                return res.json({ status: "error", message: "Feature Not Found in Subscription. Please Renew Subscription" })
            } else {
                next()
            }
        } catch (error) {
            return res.json({ status: "error", message: `Token Expired. Please Login Again ${error.message}`, redirect: "/user/login" })
        }
    } else {
        return res.json({ status: "error", message: "No Token Found in Headers." })
    }
}

module.exports = { JobCreationChecker }