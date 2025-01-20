const jwt = require('jsonwebtoken')
const { currentDate, currentDateTimeISO } = require('../service/currentDate')
const { SubscriptionModel } = require('../model/subscription.model')
const { default: mongoose } = require('mongoose')

const PostCreationChecker = async (req, res, next) => {
    if (req.headers.authorization) {
        const token = req.headers.authorization.split(" ")[1]
        const decoded = jwt.verify(token, 'Authentication')
        const plan = decoded.subscription;
        const expireAt = decoded.planExpireAt;

        try {
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

module.exports = { PostCreationChecker }