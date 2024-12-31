const express = require("express");
const multer = require("multer");
const path = require("node:path");
const fs = require('fs');
const jwt = require("jsonwebtoken");
const { EventModel } = require("../model/event.model");
const { ArtistAuthentication, ProfessionalAuthentication } = require("../middleware/Authentication");
const { CollabModel } = require("../model/collaboration.model");
const { TicketModel } = require("../model/ticket.model");
const mongoose = require('mongoose');

const EventRouter = express.Router();
const uploadPath = path.join(__dirname, "../public/events");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    let uniqueSuffix = Date.now();
    cb(null, uniqueSuffix + file.originalname);
  },
});

const upload = multer({ storage: storage });

EventRouter.post("/add", upload.single("banner"), async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "Authentication");
  const fileName = req.file.filename;
  const { title, description, eventType, category, startDate, endDate, startTime, endTime, tickets, country, state, city } = req.body;
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

  const collaboration = new EventModel({
    address: req.body?.address,
    link: req.body?.link,
    title: title,
    banner: fileName,
    eventType: eventType,
    description: description,
    category: category,
    type: "Event",
    createdBy: decoded._id,
    startDateTime: startDateTime,
    endDateTime: endDateTime,
    startTime: startTime,
    startDate: startDate,
    endTime: endTime,
    endDate: endDate,
    country: country,
    state: state,
    city: city
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


EventRouter.patch("/edit/basic/:id", ArtistAuthentication, upload.single("banner"), async (req, res) => {
  const { id } = req.params;
  const fileName = req.file?.filename;
  try {
    const details = await EventModel.find({ _id: id });
    if (!details) {
      return res.json({ status: "error", message: 'No Event found' });
    }

    if (req.file && details[0].banner) {
      fs.unlink(`${uploadPath}/${details[0].banner}`, (err) => {
        if (err) {
          console.error('Error deleting old file:', err);
        } else {
          console.log('Old file deleted successfully');
        }
      });
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

    const updatedData = {
      ...req.body, // Update other fields if provided
      banner: req.file ? fileName : details[0].banner, // Use the new image if uploaded
      startDateTime: startDateTime,
      endDateTime: endDateTime
    };

    const updatedItem = await EventModel.findByIdAndUpdate(id, updatedData, {
      new: true, // Return the updated document
    });

    res.json({ status: "success", message: `Event Successfully Updatec` });
  } catch (error) {
    res.json({
      status: "error",
      message: `Failed To Edit Event Details ${error.message}`,
    });
  }
}
);

EventRouter.post("/add/tickets/:id", ArtistAuthentication, async (req, res) => {
  const { id } = req.params;
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "Authentication");
  const { tickets } = req.body;
  try {
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

// Get List of Events Created By User
EventRouter.get("/lists", ArtistAuthentication, async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "Authentication");
  try {

    const list = await EventModel.aggregate([
      {
        $match: { createdBy: decoded._id, type: "Event" }
      },
      {
        $lookup: {
          from: 'tickets',
          localField: '_id',
          foreignField: 'eventId',
          as: 'tickets'
        }
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

EventRouter.get("/lists/:id", ArtistAuthentication, async (req, res) => {
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

// Get List of Events which User Can Book
EventRouter.get("/active/list", ArtistAuthentication, async (req, res) => {  
  try {
    const list = await EventModel.aggregate([
      {
        $match: {
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
    res.json({ status: "error", message: `Unable To Find Available Events ${error.message}` })
  }
});

EventRouter.post("/ticket/booking/:id", ArtistAuthentication, async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "Authentication");
  const { eventId, message } = req.body;
  const collaboration = new CollabModel({
    eventId: eventId,
    message: message,
    createdBy: decoded._id,
  });
  try {
    await collaboration.save();
    res.json({
      status: "success",
      message: `Collaboration Request Sent Successfully`,
    });
  } catch (error) {
    res.json({
      status: "error",
      message: `Failed To Send Collaboration Request ${error.message}`,
    });
  }
}
);



module.exports = { EventRouter };
