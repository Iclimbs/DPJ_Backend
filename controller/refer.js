const express = require('express')
const ReferRouter = express.Router();
const jwt = require('jsonwebtoken');
const { ReferModel } = require('../model/refer.model');
const { default: mongoose } = require('mongoose');
const generateUniqueId = require('generate-unique-id');


const generateReferenceId = async (props) => {
    try {
        const newid = new ReferModel({
            userId: props.userId,
            referId: generateUniqueId({
                length: 6,
                useLetters: true,
                useNumbers: true
            }).toUpperCase()
        })
        const user = await newid.save()
        return { status: "success", data: user }
    } catch (error) {
        return { status: 'error', message: `${error.message}` }
    }

}

ReferRouter.get("/getlist", async (req, res) => {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, "Authentication");
    try {
        const users = await ReferModel.aggregate([{ $match: { userId: new mongoose.Types.ObjectId(decoded._id) } },
        { $lookup: { from: "users", localField: 'registeredBy', foreignField: '_id', pipeline: [{ $project: { _id: 1, name: 1, email: 1, category: 1, profile: 1 } }], as: 'registeredUserDetails' } }])
        if (users.length !== 0) {
            return res.json({ status: "success", data: users[0] })
        } else {
            const newUser = await generateReferenceId({ userId: decoded._id })
            if (newUser.status === 'success') {
                return res.json({ status: "success", data: newUser.data })
            } else {
                return res.json({ status: "error", message: `Unable To Fetch Refer & Earn Details ${newUser.message}` })
            }
        }
    } catch (error) {
        return res.json({
            status: "error",
            message: `Unable To Fetch Refer Details ${error.message}`
        })
    }
})


module.exports = { ReferRouter }