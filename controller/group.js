const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const GroupRouter = express.Router();
const { GroupModel } = require('../model/group.model');
const { UserAuthentication, uploadMiddleWare, AdminAuthentication } = require('../middleware/MiddlewareExport');

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

GroupRouter.post("/add/members/:id", UserAuthentication, async (req, res) => {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, "Authentication");
    const { id } = req.params;
    const { userId } = req.body;
    if (decoded._id === userId) {
        return res.json({ status: 'error', message: 'You Cannot Add Yourself As an Member' })
    }
    try {
        const groupMemberList = await GroupModel.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(id),
                    memebers: {
                        $elemMatch: { $eq: new mongoose.Types.ObjectId(userId) },
                    },
                },
            },
        ]);
        if (groupMemberList.length === 0) {

            const group = await GroupModel.updateOne(
                { _id: new mongoose.Types.ObjectId(id) },
                { $push: { memebers: new mongoose.Types.ObjectId(userId) } }, // Add ObjectId to the array
            );
            console.log("group", group);

            return res.json({ status: 'success', message: 'New Member Added In The Group' })
        } else {
            return res.json({ status: 'error', message: 'Member Already Present In The Group' })
        }
    } catch (error) {
        return res.json({ status: 'error', message: `Failed To Add Member in the Group ${error.message}` })
    }
})

// Remove Members From Group

GroupRouter.post("/remove/members/:id", UserAuthentication, async (req, res) => {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, "Authentication");
    const { id } = req.params;
    const { userId } = req.body;
    try {
        const groupMemberList = await GroupModel.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(id),
                    memebers: {
                        $elemMatch: { $eq: new mongoose.Types.ObjectId(userId) },
                    },
                },
            },
        ]);
        if (groupMemberList.length !== 0) {
            const group = await GroupModel.updateOne(
                { _id: new mongoose.Types.ObjectId(id) },
                { $pull: { memebers: new mongoose.Types.ObjectId(userId) } }, // Add ObjectId to the array
            );
            return res.json({ status: 'success', message: 'Member Removed From Group' })
        } else {
            return res.json({ status: 'error', message: 'No Such Member Present In The Group' })
        }
    } catch (error) {
        return res.json({ status: 'error', message: `Failed To Remove Member From Group ${error.message}` })
    }
})

// Exit From Group

GroupRouter.post("/exit/:id", UserAuthentication, async (req, res) => {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, "Authentication");
    const { id } = req.params;
    try {
        const groupMemberList = await GroupModel.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(id),
                    memebers: {
                        $elemMatch: { $eq: new mongoose.Types.ObjectId(decoded._id) },
                    },
                },
            },
        ]);
        if (groupMemberList.length !== 0) {
            const group = await GroupModel.updateOne(
                { _id: new mongoose.Types.ObjectId(id) },
                { $pull: { memebers: new mongoose.Types.ObjectId(decoded._id) } }, // Add ObjectId to the array
            );
            return res.json({ status: 'success', message: 'Exit From Group Successful' })
        } else {
            return res.json({ status: 'error', message: 'Group Not Found' })
        }
    } catch (error) {
        return res.json({ status: 'error', message: `Failed To Exit From Group`, error: error.message })
    }
})

// Get Active Group List 

GroupRouter.get("/listall", UserAuthentication, async (req, res) => {
    try {
        const groupList = await GroupModel.aggregate([{ $match: { disabled: false } },
        { $lookup: { from: 'users', localField: "ownerId", foreignField: "_id", pipeline: [{ $project: { _id: 1, name: 1, email: 1, profile: 1, verified: 1, category: 1 } }], as: "OwnerDetails" } },
        { $lookup: { from: 'users', localField: "memebers", foreignField: "_id", pipeline: [{ $project: { _id: 1, name: 1, email: 1, profile: 1, verified: 1, category: 1 } }], as: "MemberDetails" } }, { $project: { disabled: 0 } }])
        if (groupList.length === 0) {
            return res.json({ status: 'error', message: 'No Group Found' })
        } else {
            return res.json({ status: 'success', data: groupList })
        }
    } catch (error) {
        return res.json({ status: 'error', message: `Failed To Fetch All Groups List ${error.message}` })
    }
})

// Get List Of All Groups in which you are a member

GroupRouter.get("/listall/members", UserAuthentication, async (req, res) => {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, "Authentication");
    try {
        const groupMembership = await GroupModel.aggregate([
            {
                $match: {
                    memebers: {
                        $elemMatch: { $eq: new mongoose.Types.ObjectId(decoded._id) },
                    },
                },
            },
            { $project: { disabled: 0 } }
        ]);
        if (groupMembership.length === 0) {
            return res.json({ status: 'error', message: 'No Group Found' })
        } else {
            return res.json({ status: 'success', data: groupMembership })
        }
    } catch (error) {
        return res.json({ status: 'error', message: `Failed To Fetch All Groups List ${error.message}` })
    }
})

// Get A Particular Group Details

GroupRouter.get("/listall/:id", UserAuthentication, async (req, res) => {
    const { id } = req.params
    try {
        const groupList = await GroupModel.aggregate([{ $match: { disabled: false, _id: new mongoose.Types.ObjectId(id) } },
        { $lookup: { from: 'users', localField: "ownerId", foreignField: "_id", pipeline: [{ $project: { _id: 1, name: 1, email: 1, profile: 1, verified: 1, category: 1 } }], as: "OwnerDetails" } },
        { $lookup: { from: 'users', localField: "memebers", foreignField: "_id", pipeline: [{ $project: { _id: 1, name: 1, email: 1, profile: 1, verified: 1, category: 1 } }], as: "MemberDetails" } }, { $project: { disabled: 0 } }])
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

GroupRouter.get("/listall/me", UserAuthentication, async (req, res) => {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, "Authentication");
    try {
        const groupList = await GroupModel.aggregate([{ $match: { disabled: false, ownerId: new mongoose.Types.ObjectId(decoded._id) } },
        { $lookup: { from: 'users', localField: "ownerId", foreignField: "_id", pipeline: [{ $project: { _id: 1, name: 1, email: 1, profile: 1, verified: 1, category: 1 } }], as: "OwnerDetails" } },
        { $lookup: { from: 'users', localField: "memebers", foreignField: "_id", pipeline: [{ $project: { _id: 1, name: 1, email: 1, profile: 1, verified: 1, category: 1 } }], as: "MemberDetails" } }, { $project: { disabled: 0 } }])
        if (groupList.length === 0) {
            return res.json({ status: 'error', message: 'No Group Found' })
        } else {
            return res.json({ status: 'success', data: groupList })
        }
    } catch (error) {
        return res.json({ status: 'error', message: `Failed To Fetch All Groups List ${error.message}` })
    }
})

// Get Group List Admin

GroupRouter.get("/listall/admin", AdminAuthentication, async (req, res) => {
    try {
        const groupList = await GroupModel.aggregate([
            { $lookup: { from: 'users', localField: "ownerId", foreignField: "_id", pipeline: [{ $project: { _id: 1, name: 1, email: 1, profile: 1, verified: 1, category: 1 } }], as: "OwnerDetails" } },
            { $lookup: { from: 'users', localField: "memebers", foreignField: "_id", pipeline: [{ $project: { _id: 1, name: 1, email: 1, profile: 1, verified: 1, category: 1 } }], as: "MemberDetails" } }])
        if (groupList.length === 0) {
            return res.json({ status: 'error', message: 'No Group Found' })
        } else {
            return res.json({ status: 'success', data: groupList })
        }
    } catch (error) {
        return res.json({ status: 'error', message: `Failed To Fetch All Groups List ${error.message}` })
    }
})

// Disable Group Admin

GroupRouter.patch("/disable/admin/:id", AdminAuthentication, async (req, res) => {
    const { id } = req.params;
    try {
        const disalbeGroup = await GroupModel.findByIdAndUpdate(id, { disabled: true }, { new: true })
        if (disalbeGroup === null) {
            return res.json({ status: 'error', message: 'Failed To Disable Group' })
        } else {
            return res.json({ status: 'success', message: 'Successfully Disabled A Group' })
        }
    } catch (error) {
        return res.json({ status: 'error', message: `Failed To Disable A Groups  ${error.message}` })
    }
})

// Search Groups
GroupRouter.get("/filter", UserAuthentication, async (req, res) => {
    const { search } = req.query;
    try {
        const regex = new RegExp(search, "i");

        const results = await GroupModel.aggregate([
            {
                $match: {
                    $or: [
                        { name: { $regex: regex } },
                        { "address.location": { $regex: regex } },
                        { "address.state": { $regex: regex } },
                        { "address.city": { $regex: regex } },
                    ],
                    disabled: false
                },
            },
            { $lookup: { from: 'users', localField: "ownerId", foreignField: "_id", pipeline: [{ $project: { _id: 1, name: 1, email: 1, profile: 1, verified: 1, category: 1 } }], as: "OwnerDetails" } },
            { $lookup: { from: 'users', localField: "memebers", foreignField: "_id", pipeline: [{ $project: { _id: 1, name: 1, email: 1, profile: 1, verified: 1, category: 1 } }], as: "MemberDetails" } },
            { $project: { disabled: 0 } }])

        if (results.length === 0) {
            return res.json({
                status: "error",
                message: "No matching records found",
            });
        } else {
            return res.json({
                status: 'success',
                data: results
            })
        }
    } catch (error) {
        return res.json({ status: 'error', message: `Failed To Find Group ${error.message}` })
    }

})

module.exports = { GroupRouter }