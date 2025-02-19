const express = require('express');
const jwt = require('jsonwebtoken');
const GroupRouter = express.Router();
const { GroupModel } = require('../model/group.model');
const { UserAuthentication, uploadMiddleWare } = require('../middleware/MiddlewareExport');

// Create Group
GroupRouter.post("/create", uploadMiddleWare.fields([
    { name: "profile", maxCount: 1 },
    { name: "banner", maxCount: 1 },
]), UserAuthentication, async (req, res) => {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, "Authentication");

    if (!req.files.profile) {
        return res.json({ status: 'error', message: 'Profile Image Is Required To Create Group' })
    }
    if (!req.files.banner) {
        return res.json({ status: 'error', message: 'Banner Image Is Required To Create Group' })
    }
    try {

        const { name, description, country, state, city, location } = req.body

        const addressdata = {
            country: country,
            state: state,
            city: city,
            location: location
        }

        const newGroup = new GroupModel({
            name: name,
            description: description,
            ownerId: decoded._id,
            profile: req.files.profile[0]?.location,
            banner: req.files.banner[0]?.location,
            address: addressdata
        })
        await newGroup.save()
        return res.json({ status: 'success', message: 'Group Created Successfully' })
    } catch (error) {
        return res.json({ status: 'error', message: `Failed To Create A New Group ${error.message}` })
    }


})

// Edit Group Details
GroupRouter.patch("/edit/:id", uploadMiddleWare.fields([
    { name: "profile", maxCount: 1 },
    { name: "banner", maxCount: 1 },
]), UserAuthentication, async (req, res) => {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, "Authentication");
    const { id } = req.params;

    try {
        const groupExists = await GroupModel.find({ _id: id, ownerId: decoded._id });
        if (groupExists.length === 0) {
            return res.json({ status: 'error', message: 'No Group Found' })
        }

        let profile;
        if (!!req?.files.profile) {
            profile = req.files.profile[0]?.location || groupExists[0]?.profile;
        }
        let banner;
        if (!!req?.files.banner) {
            banner = req.files.banner[0]?.location || groupExists[0]?.banner;
        }
        const addressdata = {
            country: req.body?.country || groupExists[0].address.country,
            state: req.body?.state || groupExists[0].address.state,
            city: req.body?.city || groupExists[0].address.city,
            location: req.body?.location || groupExists[0].address.location
        }

        const updatedData = {
            name: req.body?.name || groupExists[0].name,
            description: req.body?.description || groupExists[0].description,
            profile: profile,
            banner: banner,
            address: addressdata
        }
        const updateGroup = await GroupModel.findByIdAndUpdate(id, updatedData, { new: true })
        if (updateGroup === null) {
            return res.json({ status: 'error', message: 'Failed To Update Group Details' })

        } else {
            return res.json({ status: 'success', message: 'Group Details Updated Successfully' })
        }
    } catch (error) {
        return res.json({ status: 'error', message: `Failed To Update Group Details ${error.message}` })
    }


})

// Add New Members in Group

// Remove Members From Group

// Get Active Group List 
GroupRouter.get("/listall", UserAuthentication, async (req, res) => {
    try {
        const groupList = await GroupModel.find({ disabled: false })
        if (groupList.length === 0) {
            return res.json({ status: 'error', message: 'No Group Found' })
        } else {
            return res.json({ status: 'success', data: groupList })
        }
    } catch (error) {
        return res.json({ status: 'error', message: `Failed To Fetch All Groups List ${error.message}` })
    }
})

// Get Group List Created By Me

// Get Group List Admin

// Disable Group Admin

module.exports = { GroupRouter }