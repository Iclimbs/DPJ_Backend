const jwt = require('jsonwebtoken')
const AdminAuthentication = (req, res, next) => {
    if (req.headers.authorization) {
        try {
            const token = req.headers.authorization.split(" ")[1]
            const decoded = jwt.verify(token, 'Authentication')
            if (decoded.accountType === "admin") {
                next()
            } else {
                return res.json({ status: "error", message: "Admin Permission Not Found In Your Account" })
            }
        } catch (error) {
            return res.json({ status: "error", message: "Token Expired. Please Login Again" })
        }
    } else {
        return res.json({ status: "error", message: "No Token Found in Headers." })
    }
}


module.exports = {
    AdminAuthentication
}