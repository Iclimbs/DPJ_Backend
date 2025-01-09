const jwt = require('jsonwebtoken')
const { WalletModel } = require('../model/ModelExport')
const WalletChecker = async (req, res, next) => {
    if (req.headers.authorization) {
        try {
            const token = req.headers.authorization.split(" ")[1]
            const decoded = jwt.verify(token, 'Authentication')
            const wallet = await WalletModel.find({ userId: decoded._id });            

            if (wallet.length == 0) {
                return res.json({ status: "error", message: "Wallet Not Found. Please Create Wallet First", redirect: "/wallet/create" })
            } else {
                if (wallet[0].balance < req.body.amount) {
                    return res.json({ status: "error", message: "Insufficient Balance in Wallet", redirect: "/wallet/add" })
                } else {
                    next()
                }
            }

        } catch (error) {
            return res.json({ status: "error", message: "Token Expired. Please Login Again", redirect: "/user/login" })
        }
    } else {
        return res.json({ status: "error", message: "No Token Found in Headers." })
    }
}

module.exports = { WalletChecker }