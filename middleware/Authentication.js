const jwt = require('jsonwebtoken')
const UserAuthentication = (req, res, next) => {
    if (req.headers.authorization) {
        try {
            const token = req.headers.authorization.split(" ")[1]
            const decoded = jwt.verify(token, 'Authentication')
            next()
        } catch (error) {
            return res.json({ status: "error", message: "Token Expired. Please Login Again", redirect: "/user/login" })
        }
    } else {
        return res.json({ status: "error", message: "No Token Found in Headers." })
    }
}

const ArtistAuthentication = (req, res, next) => {
    if (req.headers.authorization) {
        try {
            const token = req.headers.authorization.split(" ")[1]
            const decoded = jwt.verify(token, 'Authentication')
            if (decoded.accountType === 'artist') {
                next()
            } else {
                return res.json({ status: "error", message: "You Don't have required Permissions !!", redirect: "/user/login" })
            }
        } catch (error) {
            return res.json({ status: "error", message: "Token Expired. Please Login Again", redirect: "/user/login" })
        }
    } else {
        return res.json({ status: "error", message: "No Token Found in Headers." })
    }
}

const ProfessionalAuthentication = (req, res, next) => {
    if (req.headers.authorization) {
        try {
            const token = req.headers.authorization.split(" ")[1]
            const decoded = jwt.verify(token, 'Authentication')
            if (decoded.accountType === 'professional') {
                next()
            } else {
                return res.json({ status: "error", message: "You Don't have required Permissions !!", redirect: "/user/login" })
            }
        } catch (error) {
            return res.json({ status: "error", message: "Token Expired. Please Login Again", redirect: "/user/login" })
        }
    } else {
        return res.json({ status: "error", message: "No Token Found in Headers." })
    }
}

const GuestAuthentication = (req, res, next) => {
    if (req.headers.authorization) {
        try {
            const token = req.headers.authorization.split(" ")[1]
            const decoded = jwt.verify(token, 'Authentication')
            if (decoded.accountType === 'guest') {
                next()
            } else {
                return res.json({ status: "error", message: "You Don't have required Permissions !!", redirect: "/user/login" })
            }
        } catch (error) {
            return res.json({ status: "error", message: "Token Expired. Please Login Again", redirect: "/user/login" })
        }
    } else {
        return res.json({ status: "error", message: "No Token Found in Headers." })
    }
}



module.exports = {
    UserAuthentication,
    ArtistAuthentication,
    ProfessionalAuthentication,
    GuestAuthentication
}