const express = require('express');
const jwt = require('jsonwebtoken');
const { ReviewModel, EventModel } = require('../model/ModelExport');
const { UserAuthentication } = require('../middleware/MiddlewareExport');
const { default: mongoose } = require('mongoose');
const ReviewRouter = express.Router();

// Collab Artist Review Event In Which He/She Has Participated
ReviewRouter.post("/add/collabArtist/:event", UserAuthentication, async (req, res) => {
    const { event } = req.params;
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, "Authentication");

    const dateObj = new Date();
    // Creating Date
    const month = (dateObj.getUTCMonth() + 1) < 10 ? String(dateObj.getUTCMonth() + 1).padStart(2, '0') : dateObj.getUTCMonth() + 1 // months from 1-12
    const day = dateObj.getUTCDate() < 10 ? String(dateObj.getUTCDate()).padStart(2, '0') : dateObj.getUTCDate()
    const year = dateObj.getUTCFullYear();
    const date = year + "-" + month + "-" + day;

    try {
        const reviewExists = await ReviewModel.aggregate([{ $match: { eventId: new mongoose.Types.ObjectId(event), reviewedByUserId: new mongoose.Types.ObjectId(decoded._id) } }])

        // Checking If Review Already Exists For The Event
        if (reviewExists.length > 0) {
            res.json({ status: 'error', message: `Review Already Exists` })
        }

        // Checking Event Details Create Review Only For The Event Which Has Expired
        const eventDetails = await EventModel.aggregate([{ $match: { _id: new mongoose.Types.ObjectId(event), endtime: { $lte: date } } }])

        if (eventDetails.length == 0) {
            res.json({ status: 'error', message: `Either No Event is Present with This Id Or Event Has Not Expired Till Now` })
        }

        const eventReview = new ReviewModel({ eventId: event, reviewedByUserId: decoded._id, reviewedBy: "collabArtist", rating: req.body.rating, review: req.body.review })
        await eventReview.save()
        res.json({ status: 'success', message: `Review Successfully Created` })
    } catch (error) {
        res.json({ status: 'error', message: `Failed To Create Review For Event, Error :- ${error.message}` })
    }
})

// Collab Artist Review Event Creator Artist
ReviewRouter.post("/add/eventCreator/:userId", UserAuthentication, async (req, res) => {
    const { userId } = req.params;
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, "Authentication");

    // Seach For Event Creator Artist Review

    try {
        const reviewExists = await ReviewModel.aggregate([{ $match: { userId: new mongoose.Types.ObjectId(userId), reviewedByUserId: new mongoose.Types.ObjectId(decoded._id) } }])

        // Checking If Review Already Exists For The Event
        if (reviewExists.length > 0) {
            res.json({ status: 'error', message: `Review Already Exists` })
        }
        //Create New Review
        const eventReview = new ReviewModel({ userId: userId, reviewedByUserId: decoded._id, reviewedBy: "eventCreator", rating: req.body.rating, review: req.body.review })
        await eventReview.save()
        res.json({ status: 'success', message: `Review Successfully Created` })
    } catch (error) {
        res.json({ status: 'error', message: `Failed To Create Review For Event Creator Artist, Error :-  ${error.message}` })
    }
})

// Event Creator Artist Review Other Collab Artist in This API
ReviewRouter.post("/add/otherArtist/:userId", UserAuthentication, async (req, res) => {
    const { userId } = req.params;
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, "Authentication");

    // Seach For Event Creator Artist Review

    try {
        const reviewExists = await ReviewModel.aggregate([{ $match: { userId: new mongoose.Types.ObjectId(userId), reviewedByUserId: new mongoose.Types.ObjectId(decoded._id) } }])

        // Checking If Review Already Exists For The Event
        if (reviewExists.length > 0) {
            res.json({ status: 'error', message: `Review Already Exists` })
        }
        //Create New Review
        const eventReview = new ReviewModel({ userId: userId, reviewedByUserId: decoded._id, reviewedBy: "artist", rating: req.body.rating, review: req.body.review })
        await eventReview.save()
         res.json({ status: 'success', message: `Review Successfully Created` });
    } catch (error) {
         res.json({ status: 'error', message: `Failed To Create Review For Other Artist, Error :- ${error.message}` })
    }
})


ReviewRouter.post("/edit/:id", UserAuthentication, async (req, res) => {
    const { id } = req.params;
    try {
        const reviewExists = await ReviewModel.aggregate([{ $match: { _id: new mongoose.Types.ObjectId(id) } }])

        // Checking If Review Already Exists For The Event
        if (reviewExists.length == 0) {
            res.json({ status: 'error', message: `No Review Found` })
        }
        //Edit Review
        await ReviewModel.findByIdAndUpdate(id, { rating: req.body?.rating, review: req.body?.review })
        res.json({ status: 'success', message: `Review Successfully Updated` })
    } catch (error) {
        res.json({ status: 'error', message: `Failed To Edit Review, Error:- ${error.message}` })
    }
})
module.exports = { ReviewRouter }