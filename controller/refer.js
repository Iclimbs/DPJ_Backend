const express = require('express')
const ReferRouter = express.Router();
const jwt = require('jsonwebtoken');
const { ReferModel } = require('../model/refer.model');
const { default: mongoose } = require('mongoose');
const generateUniqueId = require('generate-unique-id');


const generateReferenceId = async (props) => {
    try {
        const newid = new ReferModel({
            userId: props._id,
            referId: generateUniqueId({
                includeSymbols: ['@', '#', '|'],
                excludeSymbols: ['0'],
                length: 6,
                useLetters: true,
                useNumbers: true
            })
        })

        await newid.save()
        return { status: "success" }

    } catch (error) {
        return { status: 'error', message: `${error.message}` }
    }

}

ReferRouter.get("/getlist", async (req, res) => {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, "Authentication");
    try {
        const users = await ReferModel.aggregate([{ $match: { userId: new mongoose.Types.ObjectId(decoded._id) } }])
        console.log("users ",users)
        if (users.length !== 0) {
            return res.json({ status: "success", data: users[0] })
        } else {
            const newUser = await generateReferenceId({ _id: decoded._id })

            if (newUser.status === 'success') {
                const users = await ReferModel.aggregate([{ $match: new mongoose.Types.ObjectId(decoded._id) }])
                return res.json({ status: "success", data: users[0] })

            } else {
                return res.json({ status: "error", message: `Unable To Fetch Refer & Earn Details` })

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