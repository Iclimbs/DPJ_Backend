// Basic Required Modules
const express = require("express");
const jwt = require("jsonwebtoken");

// Basic Model Imports
const {
  EventModel,
  CollabModel,
  TransactionModel,
} = require("../model/ModelExport");

// Basic MiddleWare Imports
const {
  ArtistAuthentication,
  uploadMiddleWare,
  WalletChecker,
  AdminAuthentication,
  EventCollaborationChecker,
} = require("../middleware/MiddlewareExport");
const { default: mongoose } = require("mongoose");
const {
  addAmountinWallet,
  addAmountInAdminWallet,
  subAmountinWallet,
  subAmountInAdminWallet,
} = require("./wallet");

const CollabRouter = express.Router();

CollabRouter.post("/add", [EventCollaborationChecker, ArtistAuthentication, uploadMiddleWare.single("banner"),],
  async (req, res) => {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, "Authentication");
    if (!req?.file) {
      return res.json({
        status: "error",
        message: `Please Upload Banner Image`,
      });
    }

    const {
      title,
      description,
      category,
      startDate,
      endDate,
      startTime,
      endTime,
    } = req.body;
    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(`${endDate}T${endTime}`);

    let address;

    if (req.body?.eventType === "Physical") {
      address = {};
      address.country = req.body?.country;
      address.state = req.body?.state;
      address.city = req.body?.city;
      address.location = req.body?.location;
    }

    const collaboration = new EventModel({
      address: address || null,
      banner: req.file?.location,
      createdBy: decoded._id,
      category: category,
      description: description,
      eventType: req.body?.eventType,
      endTime: endTime,
      endDate: endDate,
      endDateTime: endDateTime,
      link: req.body?.link || null,
      startTime: startTime,
      startDate: startDate,
      startDateTime: startDateTime,
      title: title,
      type: "Collaboration",
    });
    try {
      savedDocument = await collaboration.save();
      return res.json({
        status: "success",
        message: `Collaboration Created Successfully`,
      });
    } catch (error) {
      return res.json({
        status: "error",
        message: `Failed To Create New Collaboration ${error.message}`,
      });
    }
  },
);

CollabRouter.patch(
  "/edit/basic/:id",
  [
    EventCollaborationChecker,
    ArtistAuthentication,
    uploadMiddleWare.single("banner"),
  ],
  ArtistAuthentication,
  async (req, res) => {
    const { id } = req.params;
    let location;
    if (req.file) {
      location = req.file?.location;
    }
    try {
      const details = await EventModel.find({ _id: id });
      if (!details) {
        return res.json({ status: "error", message: "No Event found" });
      }

      let startDateTime = new Date(
        `${details[0].startDate}T${details[0].startTime}`,
      );
      let endDateTime = new Date(`${details[0].endDate}T${details[0].endTime}`);

      if (req.body.startDate) {
        startDateTime = new Date(
          `${req.body.startDate}T${details[0].startTime}`,
        );
      }

      if (req.body.startTime) {
        startDateTime = new Date(
          `${details[0].startDate}T${req.body.startTime}`,
        );
      }

      if (req.body.endDate) {
        endDateTime = new Date(`${req.body.endDate}T${details[0].endTime}`);
      }

      if (req.body.endTime) {
        endDateTime = new Date(`${details[0].endDate}T${req.body.endTime}`);
      }
      let eventType = req.body?.eventType || details[0].eventType;
      let addressdata = {};
      let link;

      if (eventType === "Physical") {
        addressdata.country = req.body?.country || details[0].address?.country;
        addressdata.state = req.body?.state || details[0].address?.state;
        addressdata.city = req.body?.city || details[0].address?.city;
        addressdata.location =
          req.body?.location || details[0].address?.location;
        link = null;
      } else if (eventType === "Virtual") {
        link = req.body?.link || details[0].link;
        addressdata = null;
      }

      const updatedData = {
        ...req.body, // Update other fields if provided
        banner: req.file ? location : details[0].banner, // Use the new image if uploaded
        startDateTime: startDateTime,
        endDateTime: endDateTime,
        address: addressdata,
        link: link,
      };

      const updatedItem = await EventModel.findByIdAndUpdate(id, updatedData, {
        new: true, // Return the updated document
      });

      return res.json({
        status: "success",
        message: `Collaboration Successfully Updated`,
      });
    } catch (error) {
      return res.json({
        status: "error",
        message: `Failed To update Collaboration Details ${error.message}`,
      });
    }
  },
);

CollabRouter.post(
  "/add/collaborators/:id",
  [EventCollaborationChecker, ArtistAuthentication, WalletChecker],
  async (req, res) => {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, "Authentication");
    const { id } = req.params;
    const { collaborators, amount } = req.body;
    let addCollaborators = [];
    let alreadypresent = [];
    // Amount Deduction From Wallet Of User Who Has Created The Collaboration Event
    let totalAmount = amount;
    let transactionData = [];

    try {
      const collab = await CollabModel.aggregate([
        { $match: { eventId: new mongoose.Types.ObjectId(id) } },
      ]);
      if (collab.length > 0) {
        for (let index = 0; index < collaborators.length; index++) {
          const foundObject = collab.find(
            (obj) => obj.email === collaborators[index].email,
          );
          const exists = !!foundObject;
          if (exists) {
            alreadypresent.push(collaborators[index].name);
          }
          addCollaborators.push({
            userId: collaborators[index]._id,
            email: collaborators[index].email,
            name: collaborators[index].name,
            amount: collaborators[index].amount,
            profile: collaborators[index].profile,
            eventId: id,
          });
          transactionData.push({
            amount: collaborators[index].amount,
            userId: collaborators[index]._id,
            type: "Credit",
            status: "In Process",
            method: "Wallet",
            message: "Amount Credit In Process",
            from: decoded._id,
            to: collaborators[index]._id,
            eventId: id,
          });
        }
      } else {
        for (let index = 0; index < collaborators.length; index++) {
          addCollaborators.push({
            userId: collaborators[index]._id,
            email: collaborators[index].email,
            name: collaborators[index].name,
            amount: collaborators[index].amount,
            profile: collaborators[index].profile,
            eventId: id,
          });
          transactionData.push({
            amount: collaborators[index].amount,
            userId: collaborators[index]._id,
            type: "Credit",
            status: "In Process",
            method: "Wallet",
            message: "Amount Credit In Process",
            from: decoded._id,
            to: collaborators[index]._id,
            eventId: id,
          });
        }
      }
      if (alreadypresent.length > 0) {
        return res.json({
          status: "error",
          message: `Some Collaborators Already Present In This Event ${alreadypresent}`,
        });
      } else {
        const result = await CollabModel.insertMany(addCollaborators);
        const adminWalletTransaction = addAmountInAdminWallet({
          amount: totalAmount,
          userId: decoded._id,
          eventId: id,
        });
        if (adminWalletTransaction.status === "error") {
          return res.json({
            status: "error",
            message: `Failed To Add Amount in Admin Wallet`,
          });
        }
        const userWalletTransaction = subAmountinWallet({
          amount: totalAmount,
          userId: decoded._id,
        });
        if (userWalletTransaction.status === "error") {
          return res.json({
            status: "error",
            message: `Failed To Deduct Amount From User Wallet`,
          });
        }
        transactionData.push({
          amount: amount,
          userId: decoded._id,
          type: "Debit",
          message: "Amount Deduction From Wallet Due to Event Collaboration",
          status: "Success",
          method: "Wallet",
          eventId: id,
          display:decoded._id
        });

        const transaction = await TransactionModel.insertMany(transactionData);

        return res.json({
          status: "success",
          message: "Successfully Sent Collaboration Request To Other User",
        });
      }
    } catch (error) {
      return res.json({
        status: "error",
        message: `Failed To Sent Collaboration Request To Other User Message :- ${error.message}`,
      });
    }
  },
);

// Counter Offer For Collaborators || Not In Use
CollabRouter.patch(
  "/edit/collaborators/amount/:id",
  ArtistAuthentication,
  async (req, res) => {
    const { id } = req.params;
    const { amount } = req.body;
    try {
      const result = await CollabModel.findOne({ _id: id });
      if (result.status == "Accepted") {
        return res.json({
          status: "error",
          message: "Collaborator Already Accepted The Request",
        });
      } else {
        result.amount = amount;
        result.status = "Pending";
        await result.save();
        return res.json({
          status: "success",
          message: "Successfully Sent Collaboration Request To Other User",
        });
      }
    } catch (error) {
      return res.json({
        status: "error",
        message: `Failed To Update Collaborator Amount Message :- ${error.message}`,
      });
    }
  },
);

// Currently Not In Use
CollabRouter.post(
  "/edit/collaborators/:id",
  ArtistAuthentication,
  async (req, res) => {
    const { id } = req.params;
    const token = req.headers.authorization.split(" ")[1];
    const { collaborators } = req.body;
    const decoded = jwt.verify(token, "Authentication");
    const fileName = req.file.filename;
    try {
      const details = await EventModel.find({ eventId: id });
      return res.json({
        status: "success",
        message: `Collaborators List Successfully Updated`,
      });
    } catch (error) {
      return res.json({
        status: "error",
        message: `Failed To Update Colalborators List ${error.message}`,
      });
    }
  },
);

// Get All Collaboration Events Created By User
CollabRouter.get("/list", ArtistAuthentication, async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "Authentication");
  try {
    const list = await EventModel.find({
      createdBy: decoded._id,
      type: "Collaboration",
    }).sort({ createdBy: -1 })
    if (list.length == 0) {
      return res.json({
        status: "error",
        message: "No Collaboration Event Found",
      });
    } else {
      return res.json({ status: "success", data: list });
    }
  } catch (error) {
    return res.json({
      status: "error",
      message: `Unable To Find Collaboration Events ${error.message}`,
    });
  }
});

// Get All Collaboration Events list For Admin
CollabRouter.get("/listall/admin", AdminAuthentication, async (req, res) => {
  try {
    const list = await EventModel.aggregate([
      { $match: { type: "Collaboration" } },
      { $sort: { CreatedAt: -1 } },
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                _id: 1,
                name: 1,
                email: 1,
                profile: 1,
                description: 1,
              },
            },
          ],
          as: "users",
        },
      },
    ]);
    if (list.length == 0) {
      return res.json({
        status: "error",
        message: "No Collaboration Event Found",
      });
    } else {
      return res.json({ status: "success", data: list });
    }
  } catch (error) {
    return res.json({
      status: "error",
      message: `Unable To Find Collaboration Events ${error.message}`,
    });
  }
});

// Get Collaboration Events Complete Details Created By User
CollabRouter.get(
  "/list/detailone/:id",
  ArtistAuthentication,
  async (req, res) => {
    const { id } = req.params;
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, "Authentication");
    try {
      const list = await EventModel.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(id),
            createdBy: new mongoose.Types.ObjectId(decoded._id),
            type: "Collaboration",
          },
        },
        {
          $lookup: {
            from: "collabs",
            localField: "_id",
            foreignField: "eventId",
            pipeline: [
              {
                $lookup: {
                  from: "reviews",
                  localField: "userId",
                  foreignField: "userId",
                  pipeline: [
                    { $match: { eventId: new mongoose.Types.ObjectId(id) } },
                  ],
                  as: "reviews",
                },
              },
            ],
            as: "collaborators",
          },
        },
      ]);
      if (list.length == 0) {
        return res.json({
          status: "error",
          message: "No Collaboration Event Found",
        });
      } else {
        return res.json({ status: "success", data: list });
      }
    } catch (error) {
      return res.json({
        status: "error",
        message: `Unable To Find Collaboration Events ${error.message}`,
      });
    }
  },
);

// Get Collaboration Events Complete Details For Admin
CollabRouter.get(
  "/listall/detailone/admin/:id",
  AdminAuthentication,
  async (req, res) => {
    const { id } = req.params;
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, "Authentication");
    try {
      const list = await EventModel.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(id),
            type: "Collaboration",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "createdBy",
            foreignField: "_id",
            pipeline: [
              {
                $project: {
                  _id: 1,
                  name: 1,
                  email: 1,
                  profile: 1,
                  description: 1,
                },
              },
            ],
            as: "userdetails",
          },
        },
        {
          $lookup: {
            from: "collabs",
            localField: "_id",
            foreignField: "eventId",
            pipeline: [
              {
                $lookup: {
                  from: "reviews",
                  localField: "userId",
                  foreignField: "userId",
                  pipeline: [
                    {
                      $match: {
                        eventId: new mongoose.Types.ObjectId(id),
                        reviewedBy: "eventCreator",
                      },
                    },
                  ],
                  as: "reviewsByEventCreator",
                },
              },
              {
                $lookup: {
                  from: "reviews",
                  localField: "userId",
                  foreignField: "reviewedByUserId",
                  pipeline: [
                    {
                      $match: {
                        eventId: new mongoose.Types.ObjectId(id),
                        reviewedBy: "collabArtist",
                      },
                    },
                  ],
                  as: "reviewsByCollabArtists",
                },
              },
              {
                $lookup: {
                  from: "transactions",
                  localField: "userId",
                  foreignField: "userId",
                  pipeline: [
                    { $match: { eventId: new mongoose.Types.ObjectId(id) } },
                  ],
                  as: "transactions",
                },
              },
            ],
            as: "collaborators",
          },
        },
      ]);
      if (list.length == 0) {
        return res.json({
          status: "error",
          message: "No Collaboration Event Found",
        });
      } else {
        return res.json({ status: "success", data: list });
      }
    } catch (error) {
      return res.json({
        status: "error",
        message: `Unable To Find Collaboration Events ${error.message}`,
      });
    }
  },
);

// Get All Collaboration Events Requests Received By User (User Indicate Artist Who will Participate In The Event)
CollabRouter.get("/request/list", ArtistAuthentication, async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "Authentication");
  try {
    const list = await CollabModel.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(decoded._id) } },
      {
        $lookup: {
          from: "events",
          localField: "eventId",
          foreignField: "_id",
          as: "event",
        },
      },
    ]);
    if (list.length == 0) {
      return res.json({
        status: "error",
        message: "No Collaboration Request Found",
      });
    } else {
      return res.json({ status: "success", data: list });
    }
  } catch (error) {
    return res.json({
      status: "error",
      message: `Unable To Find Collaboration Events Requests ${error.message}`,
    });
  }
});

// Get All Collaboration Events Requests Received By User (User Indicate Artist Who will Participate In The Event)
CollabRouter.get(
  "/request/upcoming",
  ArtistAuthentication,
  async (req, res) => {
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
    const currentDate = year + "-" + month + "-" + day;

    try {
      const list = await CollabModel.aggregate([
        {
          $match: { userId: new mongoose.Types.ObjectId(decoded._id) },
        },
        {
          $lookup: {
            from: "events",
            localField: "eventId",
            foreignField: "_id",
            pipeline: [{ $match: { endDate: { $gte: currentDate } } }],
            as: "event",
          },
        },
        {
          $match: {
            $expr: { $gt: [{ $size: "$event" }, 0] },
          },
        },
      ]);
      if (list.length == 0) {
        return res.json({
          status: "error",
          message: "No Collaboration Request Found",
        });
      } else {
        return res.json({ status: "success", data: list });
      }
    } catch (error) {
      return res.json({
        status: "error",
        message: `Unable To Find Collaboration Events Requests ${error.message}`,
      });
    }
  },
);

// Get All Collaboration Events Requests Received By User (User Indicate Artist Who will Participate In The Event)
CollabRouter.get(
  "/request/previous",
  ArtistAuthentication,
  async (req, res) => {
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
    const currentDate = year + "-" + month + "-" + day;

    try {
      const list = await CollabModel.aggregate([
        {
          $match: { userId: new mongoose.Types.ObjectId(decoded._id) },
        },
        {
          $lookup: {
            from: "events",
            localField: "eventId",
            foreignField: "_id",
            pipeline: [{ $match: { endDate: { $lte: currentDate } } }],
            as: "event",
          },
        },
        {
          $match: {
            $expr: { $gt: [{ $size: "$event" }, 0] },
          },
        },
      ]);

      if (list.length == 0) {
        return res.json({
          status: "error",
          message: "No Collaboration Request Found",
        });
      } else {
        return res.json({ status: "success", data: list });
      }
    } catch (error) {
      return res.json({
        status: "error",
        message: `Unable To Find Collaboration Events Requests ${error.message}`,
      });
    }
  },
);

// Get Collaboration Event Details
CollabRouter.get(
  "/request/details/:id",
  ArtistAuthentication,
  async (req, res) => {
    const { id } = req.params;
    try {
      const list = await EventModel.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(id) } },
        {
          $lookup: {
            from: "reviews",
            localField: "_id",
            foreignField: "eventId",
            pipeline: [
              {
                $match: {
                  reviewedBy: "collabArtist",
                  userId: null,
                },
              },
            ],
            as: "eventreview",
          },
        },
        {
          $lookup: {
            from: "reviews",
            localField: "createdBy",
            foreignField: "userId",
            as: "eventCreatorReview",
          },
        },
      ]);

      if (list.length == 0) {
        return res.json({
          status: "error",
          message: "No Collaboration Request Found",
        });
      } else {
        return res.json({ status: "success", data: list });
      }
    } catch (error) {
      return res.json({
        status: "error",
        message: `Unable To Find Collaboration Events Requests ${error.message}`,
      });
    }
  },
);
// Get All Collaborator List Whom Request Sent For Collaboration
CollabRouter.get(
  "/list/artists/:id",
  [ArtistAuthentication, EventCollaborationChecker],
  async (req, res) => {
    const { id } = req.params;
    try {
      const list = await CollabModel.aggregate([
        { $match: { eventId: new mongoose.Types.ObjectId(id) } },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            pipeline: [{ $project: { profile: 1 } }],
            as: "userdetails",
          },
        },
      ]);
      if (list.length == 0) {
        return res.json({
          status: "error",
          message: "No Collaborators Added In This Event ",
        });
      } else {
        return res.json({ status: "success", data: list });
      }
    } catch (error) {
      return res.json({
        status: "error",
        message: `Unable To Find Collaborators List In This Events ${error.message}`,
      });
    }
  },
);

// Update Collaborator Status
CollabRouter.post(
  "/update/collab/status/:id",
  [ArtistAuthentication, EventCollaborationChecker],
  async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, "Authentication");
    try {
      const list = await CollabModel.find({ _id: id, userId: decoded._id });
      if (list.length == 0) {
        return res.json({
          status: "error",
          message: "No Collaborators Added In This Event ",
        });
      } else {
        list[0].status = status;
        await list[0].save();
        return res.json({
          status: "success",
          message: "Updated Collaborator Status",
        });
      }
    } catch (error) {
      return res.json({
        status: "error",
        message: `Unable To Update Collaborators Status In This Events ${error.message}`,
      });
    }
  },
);

// Update Transaction Status
// Accept Pending Transaction Request
CollabRouter.post(
  "/success/transaction/status/admin/:id",
  AdminAuthentication,
  async (req, res) => {
    const { id } = req.params;
    try {
      const list = await TransactionModel.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(id),
            status: "In Process",
          },
        },
      ]);
      if (list.length == 0) {
        return res.json({
          status: "error",
          message: "No Transaction Found",
        });
      }
      const amount = list[0]?.amount;
      const userId = list[0]?.userId;
      const eventId = list[0]?.eventId;

      const userWalletTransaction = await addAmountinWallet({
        amount: amount,
        userId: userId,
      });

      const adminWalletTransaction = await subAmountInAdminWallet({
        amount: amount,
        userId: userId,
        eventId: eventId,
      });

      if (adminWalletTransaction.status === "error") {
        return res.json({
          status: "error",
          message: `Failed To Deduct Amount From Admin Wallet`,
        });
      }

      if (userWalletTransaction.status === "error") {
        return res.json({
          status: "error",
          message: `Failed To Add Amount in User Wallet`,
        });
      }

      const transaction = await TransactionModel.findByIdAndUpdate(
        id,
        { status: "Success", message: "Event Collaboration Amount Credited" },
        { new: true },
      );
      return res.json({
        status: "success",
        message: "Updated Collaborator Status",
      });
    } catch (error) {
      return res.json({
        status: "error",
        message: `Unable To Settle Transaction Amount Of This Event ${error.message}`,
      });
    }
  },
);

// Reject Pending Transaction Request
CollabRouter.post(
  "/decline/transaction/status/admin/:id",
  AdminAuthentication,
  async (req, res) => {
    const { id } = req.params;
    try {
      const list = await TransactionModel.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(id),
            status: "In Process",
          },
        },
      ]);
      if (list.length == 0) {
        return res.json({
          status: "error",
          message: "No Transaction Found",
        });
      }
      const amount = list[0]?.amount;
      const userId = list[0]?.from;
      const eventId = list[0]?.eventId;

      const userWalletTransaction = await addAmountinWallet({
        amount: amount,
        userId: userId,
      });

      const adminWalletTransaction = await subAmountInAdminWallet({
        amount: amount,
        userId: userId,
        eventId: eventId,
      });

      if (adminWalletTransaction.status === "error") {
        return res.json({
          status: "error",
          message: `Failed To Deduct Amount From Admin Wallet`,
        });
      }

      if (userWalletTransaction.status === "error") {
        return res.json({
          status: "error",
          message: `Failed To Add Amount in User Wallet`,
        });
      }

      const transaction = await TransactionModel.findByIdAndUpdate(
        id,
        {
          status: "Declined",
          message: "Admin Declined Transaction For Event Collaboration",
        },
        { new: true },
      );
      return res.json({
        status: "success",
        message: "Updated Collaborator Status",
      });
    } catch (error) {
      return res.json({
        status: "error",
        message: `Unable To Settle Transaction Amount Of This Event ${error.message}`,
      });
    }
  },
);

module.exports = { CollabRouter };
