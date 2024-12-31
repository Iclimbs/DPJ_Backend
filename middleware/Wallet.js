const jwt = require('jsonwebtoken')
const { WalletModel } = require('../model/wallet.model')
const WalletChecker = async(req, res, next) => {
    if (req.headers.authorization) {
        try {
            const token = req.headers.authorization.split(" ")[1]
            const decoded = jwt.verify(token, 'Authentication')

            const wallet = await WalletModel.find({ userId: decoded._id })

            next()
        } catch (error) {
            res.json({ status: "error", message: "Token Expired. Please Login Again", redirect: "/user/login" })
        }
    } else {
        res.json({ status: "error", message: "No Token Found in Headers." })
    }
}

module.exports = { WalletChecker }