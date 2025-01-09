// Basic Required Modules
const express = require("express");
const mongoose = require('mongoose');
const jwt = require("jsonwebtoken");

// Basic Model Imports
const { EventModel, TicketModel } = require("../model/ModelExport");

// Basic MiddleWare Imports
const { ArtistAuthentication, ProfessionalAuthentication, uploadMiddleWare } = require("../middleware/MiddlewareExport");
const { pipeline } = require("nodemailer/lib/xoauth2");

const EventRouter = express.Router();

// Api's For Event

// Api To Add New Event
EventRouter.post("/add", uploadMiddleWare.single("banner"), async (req, res) => {
  if (!req?.file) {
    res.json({ status: "error", message: `Please Upload Banner Image` });
  }

  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "Authentication");

  const { title, description, eventType, category, startDate, endDate, startTime, endTime, tickets, } = req.body;

  const startDateTime = new Date(`${startDate}T${startTime}`);
  const endDateTime = new Date(`${endDate}T${endTime}`);

  // Parse tickets if it exists
  let parsedTickets = [];
  if (tickets) {
    try {
      parsedTickets = JSON.parse(tickets);
      if (!Array.isArray(parsedTickets)) {
        return res.json({ status: "error", message: "Parsed tickets is not an array" })
        // throw new Error("Parsed tickets is not an array");
      }
    } catch (err) {
      return res.json({
        status: "error",
        message: "Invalid tickets format. Tickets must be a JSON array.",
      });
    }
  }

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
    banner: req?.file?.location,
    category: category,
    createdBy: decoded._id,
    description: description,
    eventType: eventType,
    endDateTime: endDateTime,
    endTime: endTime,
    endDate: endDate,
    link: req.body?.link || null,
    startDateTime: startDateTime,
    startTime: startTime,
    startDate: startDate,
    title: title,
    type: "Event",
  });

  try {
    const eventDetails = await collaboration.save();

    if (parsedTickets.length > 0) {
      const ticketData = parsedTickets.map((ticket) => ({
        eventId: eventDetails._id,
        createdBy: decoded._id,
        price: ticket.price,
        name: ticket.name,
      }));
      await TicketModel.insertMany(ticketData);
    }
    res.json({
      status: "success",
      message: `Event Created Successfully`,
    });
  } catch (error) {
    res.json({
      status: "error",
      message: `Failed To Add New Event ${error.message}`,
    });
  }
}
);

// Api To Edit Event Details

EventRouter.patch("/edit/basic/:id", uploadMiddleWare.single("banner"), async (req, res) => {
  const { id } = req.params;
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "Authentication");
  try {
    const details = await EventModel.aggregate([{ $match: { _id: new mongoose.Types.ObjectId(id) } }])
    if (!details) {
      return res.json({ status: "error", message: 'No Event found' });
    }

    console.log(typeof (req.body.tickets));

    // Parse tickets if it exists
    let parsedTickets = [];
    if (req.body.tickets) {
      if (typeof (req.body.tickets) == 'object') {
        parsedTickets = req.body.tickets;
      } else {
        try {
          parsedTickets = JSON.parse(req.body.tickets);
          if (!Array.isArray(parsedTickets)) {
            return res.json({ status: "error", message: "Parsed tickets is not an array" })
            // throw new Error("Parsed tickets is not an array");
          }
        } catch (err) {
          return res.json({
            status: "error",
            message: "Invalid tickets format. Tickets must be a JSON array.",
          });
        }
      }
    }




    let startDateTime = new Date(`${details[0].startDate}T${details[0].startTime}`);
    let endDateTime = new Date(`${details[0].endDate}T${details[0].endTime}`);

    if (req.body.startDate) {
      startDateTime = new Date(`${req.body.startDate}T${details[0].startTime}`);
    }

    if (req.body.startTime) {
      startDateTime = new Date(`${details[0].startDate}T${req.body.startTime}`);
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
      addressdata.location = req.body?.location || details[0].address?.location;
      link = null;
    } else if (eventType === "Virtual") {
      link = req.body?.link || details[0].link;
      addressdata = null;
    }


    const updatedData = {
      ...req.body, // Update other fields if provided
      banner: req.file ? req.file?.location : details[0].banner, // Use the new image if uploaded
      startDateTime: startDateTime,
      endDateTime: endDateTime,
      address: addressdata,
      link: link,
    };
    delete updatedData.tickets;  // or delete person["age"];

    const updatedItem = await EventModel.findByIdAndUpdate(id, updatedData, {
      new: true, // Return the updated document
    });


    if (parsedTickets.length > 0) {
      const ticketData = parsedTickets.map((ticket) => ({
        eventId: id,
        createdBy: decoded._id,
        price: ticket.price,
        name: ticket.name,
      }));
      await TicketModel.insertMany(ticketData);
    }


    res.json({ status: "success", message: `Event Successfully Updated` });
  } catch (error) {
    res.json({
      status: "error",
      message: `Failed To Edit Event Details ${error.message}`,
    });
  }
}
);

// Api To Add New Tickets In An Event

EventRouter.post("/add/tickets/:id", async (req, res) => {
  const { id } = req.params;
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "Authentication");
  const { tickets } = req.body;
  try {
    // Check if the event exists & is created by the user
    const event = await EventModel.aggregate([{ $match: { _id: new mongoose.Types.ObjectId(id), createdBy: new mongoose.Types.ObjectId(decoded._id) } }]);
    if (event.length === 0) {
      return res.json({ status: "error", message: "Event Not Found Or You Don't have required Permissions." });
    }
    const ticketData = tickets.map((ticket) => {
      return {
        eventId: id,
        createdBy: decoded._id,
        price: ticket.price,
        name: ticket.name,
      }
    });
    await TicketModel.insertMany(ticketData);
    res.json({ status: "success", message: `Successfully Added New Ticket Category` });
  } catch (error) {
    res.json({
      status: "error",
      message: `Failed To Add New Tickets ${error.message}`,
    });
  }
}
);

// Get List of Events Created By Profiessional User

EventRouter.get("/lists", async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "Authentication");
  try {

    const list = await EventModel.aggregate([
      {
        $match: { createdBy: new mongoose.Types.ObjectId(decoded._id), type: "Event" }
      },
      {
        $lookup: {
          from: 'tickets',
          localField: '_id',
          foreignField: 'eventId',
          as: 'tickets'
        }
      },
      {
        $sort: { CreatedAt: -1 } // Sort by CreatedAt field in descending order
      }
    ]);

    if (list.length == 0) {
      res.json({ status: "error", message: "No Event List Found" })
    } else {
      res.json({ status: "success", data: list })
    }
  } catch (error) {
    res.json({ status: "error", message: `Unable To Find Events Lists ${error.message}` })
  }
});

// Get Detail of an Particular Events

EventRouter.get("/lists/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const list = await EventModel.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(id), // Convert id to ObjectId using 'new'
          type: "Event"
        }
      }, {
        $lookup: {
          from: 'tickets',
          localField: '_id',
          foreignField: 'eventId',
          as: 'tickets'
        }
      }
    ]);

    // const list = await EventModel.find({ createdBy: decoded._id, type: "Event" })
    if (list.length == 0) {
      res.json({ status: "error", message: "No Event List Found" })
    } else {
      res.json({ status: "success", data: list })
    }
  } catch (error) {
    res.json({ status: "error", message: `Unable To Find Events Details ${error.message}` })
  }
});

EventRouter.get("/detail/:id", async (req, res) => {
  const { id } = req.params;
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "Authentication");
  try {
    const list = await EventModel.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(id),
          createdBy: new mongoose.Types.ObjectId(decoded._id),
          type: "Event"
        }
      },
      {
        $lookup: {
          from: 'users', localField: 'createdBy', foreignField: '_id',
          pipeline: [
            { $project: { _id: 1, name: 1, email: 1, category: 1, profile: 1 } }
          ],
          as: 'userdetails'
        }
      },
      {
        $lookup: {
          from: 'tickets',
          localField: '_id',
          foreignField: 'eventId',
          pipeline: [{
            $lookup: {
              from: 'bookedtickets', localField: '_id', foreignField: 'ticketId', pipeline: [{
                $lookup: {
                  from: 'users', localField: 'bookedBy', foreignField: '_id', pipeline: [{ $project: { _id: 1, name: 1, email: 1, category: 1, profile: 1 } }
                  ], as: 'userdetails'
                }
              }], as: 'bookedTickets'
            }
          }],
          as: 'tickets'
        }
      },
      {
        $sort: { CreatedAt: -1 } // Sort by CreatedAt field in descending order
      }
    ]);

    if (list.length == 0) {
      res.json({ status: "error", message: "No Event List Found" })
    } else {
      res.json({ status: "success", data: list })
    }
  } catch (error) {
    res.json({ status: "error", message: `Unable To Find Events Lists ${error.message}` })
  }
});

// Get List of Events which are Active

EventRouter.get("/active/list", async (req, res) => {
  try {
    const dateObj = new Date();
    // Creating Date
    const month = (dateObj.getUTCMonth() + 1) < 10 ? String(dateObj.getUTCMonth() + 1).padStart(2, '0') : dateObj.getUTCMonth() + 1 // months from 1-12
    const day = dateObj.getUTCDate() < 10 ? String(dateObj.getUTCDate()).padStart(2, '0') : dateObj.getUTCDate()
    const year = dateObj.getUTCFullYear();
    const currentDate = year + "-" + month + "-" + day;

    const list = await EventModel.aggregate([
      {
        $match: {
          type: "Event",
          endDate: { $gte: currentDate },
        }
      },
      {
        $lookup: {
          from: 'users', localField: 'createdBy', foreignField: '_id',
          pipeline: [
            { $project: { _id: 1, name: 1, email: 1, category: 1, profile: 1 } }
          ],
          as: 'userdetails'
        }
      },
      {
        $lookup: {
          from: 'tickets',
          localField: '_id',
          foreignField: 'eventId',
          as: 'tickets'
        }
      },
      {
        $sort: { CreatedAt: -1 } // Sort by CreatedAt field in descending order
      }
    ]);

    if (list.length == 0) {
      res.json({ status: "error", message: "No Active Event List Found" })
    } else {
      res.json({ status: "success", data: list })
    }
  } catch (error) {
    res.json({ status: "error", message: `Unable To Find Available Events ${error.message}` })
  }
});




module.exports = { EventRouter };
