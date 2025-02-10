const express = require("express");
const jwt = require("jsonwebtoken");
const { ReviewModel, EventModel } = require("../model/ModelExport");
const { UserAuthentication, AdminAuthentication } = require("../middleware/MiddlewareExport");
const { default: mongoose } = require("mongoose");
const ReviewRouter = express.Router();
const ObjectId = require('mongodb').ObjectId;


// Collab Artist Review the Event In Which He/She Has Participated
ReviewRouter.post("/add/collabArtist/:event", UserAuthentication, async (req, res) => {
  const { event } = req.params;
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "Authentication");

  const dateObj = new Date();
  // Creating Date
  const month =
    dateObj.getUTCMonth() + 1 < 10
      ? String(dateObj.getUTCMonth() + 1).padStart(2, "0")
      : dateObj.getUTCMonth() + 1; // months from 1-12
  const day =
    dateObj.getUTCDate() < 10
      ? String(dateObj.getUTCDate()).padStart(2, "0")
      : dateObj.getUTCDate();
  const year = dateObj.getUTCFullYear();
  const date = year + "-" + month + "-" + day;

  try {
    const reviewExists = await ReviewModel.aggregate([
      {
        $match: {
          eventId: new mongoose.Types.ObjectId(event),
          reviewedByUserId: new mongoose.Types.ObjectId(decoded._id),
          userId: null
        },
      },
    ]);

    // Checking If Review Already Exists For The Event
    if (reviewExists.length > 0) {
      return res.json({ status: "error", message: `Review Already Exists` });
    }

    // Checking Event Details Create Review Only For The Event Which Has Expired
    const eventDetails = await EventModel.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(event),
          endDate: { $lte: date },
        },
      },
    ]);

    if (eventDetails.length === 0) {
      return res.json({
        status: "error",
        message: `Either No Event is Present with This Id Or Event Has Not Expired Till Now`,
      });
    }
    const eventReview = new ReviewModel({
      eventId: event,
      reviewedByUserId: decoded._id,
      reviewedBy: "collabArtist",
      rating: req.body.rating,
      review: req.body.review,
    });
    await eventReview.save();
    return res.json({
      status: "success",
      message: `Review Successfully Created`,
    });
  } catch (error) {
    return res.json({
      status: "error",
      message: `Failed To Create Review For Event, Error :- ${error.message}`,
    });
  }
},
);

// Collab Artist Review Event Creator Artist For The Particular Event in This API
ReviewRouter.post("/add/eventCreator", UserAuthentication, async (req, res) => {
  const { userId, eventId } = req.query;
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "Authentication");

  // Seach For Event Creator Artist Review

  try {
    const reviewExists = await ReviewModel.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          eventId: new mongoose.Types.ObjectId(eventId),
          reviewedByUserId: new mongoose.Types.ObjectId(decoded._id),
        },
      },
    ]);

    // Checking If Review Already Exists For The Event
    if (reviewExists.length > 0) {
      return res.json({ status: "error", message: `Review Already Exists` });
    }
    //Create New Review
    const eventReview = new ReviewModel({
      userId: userId,
      reviewedByUserId: decoded._id,
      eventId: eventId,
      reviewedBy: "collabArtist",
      rating: req.body.rating,
      review: req.body.review,
    });
    await eventReview.save();
    return res.json({
      status: "success",
      message: `Review Successfully Created`,
    });
  } catch (error) {
    return res.json({
      status: "error",
      message: `Failed To Create Review For Event Creator Artist, Error :-  ${error.message}`,
    });
  }
});

// Event Creator Artist Review Other Collab Artist For The Particular Event in This API
ReviewRouter.post("/add/otherArtist", UserAuthentication, async (req, res) => {
  const { userId, eventId } = req.query;
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "Authentication");
  // Seach For Event Creator Artist Review

  try {
    const reviewExists = await ReviewModel.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          eventId: new mongoose.Types.ObjectId(eventId),
          reviewedByUserId: new mongoose.Types.ObjectId(decoded._id),
          reviewedBy: "eventCreator",
        },
      },
    ]);

    // Checking If Review Already Exists For The Event
    if (reviewExists.length > 0) {
      return res.json({ status: "error", message: `Review Already Exists` });
    }
    //Create New Review
    const eventReview = new ReviewModel({
      userId: userId,
      eventId: eventId,
      reviewedByUserId: decoded._id,
      reviewedBy: "eventCreator",
      rating: req.body.rating,
      review: req.body.review,
    });
    await eventReview.save();
    return res.json({
      status: "success",
      message: `Review Successfully Created`,
    });
  } catch (error) {
    return res.json({
      status: "error",
      message: `Failed To Create Review For Other Artist, Error :- ${error.message}`,
    });
  }
});

ReviewRouter.patch("/edit/:id", UserAuthentication, async (req, res) => {
  const { id } = req.params;
  try {
    const reviewExists = await ReviewModel.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
    ]);

    // Checking If Review Already Exists For The Event
    if (reviewExists.length == 0) {
      return res.json({ status: "error", message: `No Review Found` });
    }
    //Edit Review
    await ReviewModel.findByIdAndUpdate(id, {
      rating: req.body?.rating,
      review: req.body?.review,
    });
    return res.json({ status: "success", message: `Review Successfully Updated` });
  } catch (error) {
    return res.json({
      status: "error",
      message: `Failed To Edit Review, Error:- ${error.message}`,
    });
  }
});

ReviewRouter.patch("/edit/admin/:id", AdminAuthentication, async (req, res) => {
  const { id } = req.params;
  try {
    const reviewExists = await ReviewModel.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
    ]);

    // Checking If Review Already Exists For The Event
    if (reviewExists.length == 0) {
      return res.json({ status: "error", message: `No Review Found` });
    }
    //Edit Review
    await ReviewModel.findByIdAndUpdate(id, {
      rating: req.body?.rating,
      review: req.body?.review,
    });
    return res.json({ status: "success", message: `Review Successfully Updated` });
  } catch (error) {
    return res.json({
      status: "error",
      message: `Failed To Edit Review, Error:- ${error.message}`,
    });
  }
});


// Review & Rating For User 

ReviewRouter.get("/list/:id", UserAuthentication, async (req, res) => {
  const { id } = req.params;
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "Authentication");
  try {
    const reviewList = await ReviewModel.aggregate([{ $match: { userId: new mongoose.Types.ObjectId(id) } }, {
      $addFields: {
        reviewstatus: { $eq: [new ObjectId(decoded._id), "$reviewedByUserId"] }
      }
    }])
    if (reviewList.length === 0) {
      return res.json({ status: 'error', message: 'No Review Found For This User' })
    } else {
      return res.json({ status: 'success', data: reviewList })
    }
  } catch (error) {
    return res.json({ status: 'error', message: `Failed To Fetch Rating Status ${error.message}` })
  }
})

ReviewRouter.post("/add/:id", UserAuthentication, async (req, res) => {
  const { id } = req.params;
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "Authentication");
  const { review, rating } = req.body;
  if (!review || !rating) {
    return res.json({ status: 'error', message: 'Review & Rating Both Are Required' })
  }
  try {
    const reviewList = await new ReviewModel({ userId: id, rating: rating, review: review })
    if (reviewList.length === 0) {
      return res.json({ status: 'error', message: 'No Review Found For This User' })
    } else {
      return res.json({ status: 'success', data: reviewList })
    }
  } catch (error) {
    return res.json({ status: 'error', message: `Failed To Fetch Rating Status ${error.message}` })
  }
})
module.exports = { ReviewRouter };
