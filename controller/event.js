// Basic Required Modules
const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

// Basic Model Imports
const { EventModel, TicketModel } = require("../model/ModelExport");

// Basic MiddleWare Imports
const {
  ProfessionalAuthentication,
  uploadMiddleWare,
  AdminAuthentication,
  EventCreationChecker,
  UserAuthentication,
} = require("../middleware/MiddlewareExport");
const { currentDate } = require("../service/currentDate");

const EventRouter = express.Router();

// Api's For Event

// Api To Add New Event
EventRouter.post(
  "/add",
  [
    ProfessionalAuthentication,
    EventCreationChecker,
    uploadMiddleWare.single("banner"),
  ],
  async (req, res) => {
    if (!req?.file) {
      return res.json({
        status: "error",
        message: `Please Upload Banner Image`,
      });
    }

    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, "Authentication");

    const {
      title,
      description,
      eventType,
      category,
      startDate,
      endDate,
      startTime,
      endTime,
      tickets,
    } = req.body;

    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(`${endDate}T${endTime}`);

    // Parse tickets if it exists
    let parsedTickets = [];
    if (tickets) {
      try {
        parsedTickets = JSON.parse(tickets);
        if (!Array.isArray(parsedTickets)) {
          return res.json({
            status: "error",
            message: "Parsed tickets is not an array",
          });
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
      return res.json({
        status: "success",
        message: `Event Created Successfully`,
      });
    } catch (error) {
      return res.json({
        status: "error",
        message: `Failed To Add New Event ${error.message}`,
      });
    }
  },
);

// Api To Edit Event Details

EventRouter.patch(
  "/edit/basic/:id",
  [
    ProfessionalAuthentication,
    EventCreationChecker,
    uploadMiddleWare.single("banner"),
  ],
  async (req, res) => {
    const { id } = req.params;
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, "Authentication");
    try {
      const details = await EventModel.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(id) } },
      ]);
      if (!details) {
        return res.json({ status: "error", message: "No Event found" });
      }

      // Parse tickets if it exists
      let parsedTickets = [];
      if (req.body.tickets) {
        if (typeof req.body.tickets == "object") {
          parsedTickets = req.body.tickets;
        } else {
          try {
            parsedTickets = JSON.parse(req.body.tickets);
            if (!Array.isArray(parsedTickets)) {
              return res.json({
                status: "error",
                message: "Parsed tickets is not an array",
              });
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
        banner: req.file ? req.file?.location : details[0].banner, // Use the new image if uploaded
        startDateTime: startDateTime,
        endDateTime: endDateTime,
        address: addressdata,
        link: link,
      };
      delete updatedData.tickets; // or delete person["age"];

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

      return res.json({
        status: "success",
        message: `Event Successfully Updated`,
      });
    } catch (error) {
      return res.json({
        status: "error",
        message: `Failed To Edit Event Details ${error.message}`,
      });
    }
  },
);

// Api To Add New Tickets In An Event

EventRouter.post(
  "/add/tickets/:id",
  [ProfessionalAuthentication, EventCreationChecker],
  async (req, res) => {
    const { id } = req.params;
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, "Authentication");
    const { tickets } = req.body;
    try {
      // Check if the event exists & is created by the user
      const event = await EventModel.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(id),
            createdBy: new mongoose.Types.ObjectId(decoded._id),
          },
        },
      ]);
      if (event.length === 0) {
        return res.json({
          status: "error",
          message: "Event Not Found Or You Don't have required Permissions.",
        });
      }
      const ticketData = tickets.map((ticket) => {
        return {
          eventId: id,
          createdBy: decoded._id,
          price: ticket.price,
          name: ticket.name,
        };
      });
      await TicketModel.insertMany(ticketData);
      return res.json({
        status: "success",
        message: `Successfully Added New Ticket Category`,
      });
    } catch (error) {
      return res.json({
        status: "error",
        message: `Failed To Add New Tickets ${error.message}`,
      });
    }
  },
);

// Get List of Events Created By Profiessional User

EventRouter.get("/lists", [ProfessionalAuthentication], async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "Authentication");
  try {
    const list = await EventModel.aggregate([
      {
        $match: {
          createdBy: new mongoose.Types.ObjectId(decoded._id),
          type: "Event",
        },
      },
      {
        $lookup: {
          from: "tickets",
          localField: "_id",
          foreignField: "eventId",
          as: "tickets",
        },
      },
      {
        $sort: { CreatedAt: -1 }, // Sort by CreatedAt field in descending order
      },
    ]);

    if (list.length == 0) {
      return res.json({ status: "error", message: "No Event List Found" });
    } else {
      return res.json({ status: "success", data: list });
    }
  } catch (error) {
    return res.json({
      status: "error",
      message: `Unable To Find Events Lists ${error.message}`,
    });
  }
});

// Get Detail of an Particular Events

EventRouter.get("/lists/:id", UserAuthentication, async (req, res) => {
  const { id } = req.params;
  try {
    const list = await EventModel.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(id), // Convert id to ObjectId using 'new'
          type: "Event",
        },
      },
      {
        $lookup: {
          from: "tickets",
          localField: "_id",
          foreignField: "eventId",
          as: "tickets",
        },
      },
    ]);

    // const list = await EventModel.find({ createdBy: decoded._id, type: "Event" })
    if (list.length == 0) {
      return res.json({ status: "error", message: "No Event List Found" });
    } else {
      return res.json({ status: "success", data: list });
    }
  } catch (error) {
    return res.json({
      status: "error",
      message: `Unable To Find Events Details ${error.message}`,
    });
  }
});

// Get Detail of an Particular Events For Professional User Only

EventRouter.get("/detail/:id", ProfessionalAuthentication, async (req, res) => {
  const { id } = req.params;
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "Authentication");
  try {
    const list = await EventModel.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(id),
          createdBy: new mongoose.Types.ObjectId(decoded._id),
          type: "Event",
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
                category: 1,
                profile: 1,
              },
            },
          ],
          as: "userdetails",
        },
      },
      {
        $lookup: {
          from: "tickets",
          localField: "_id",
          foreignField: "eventId",
          pipeline: [
            {
              $lookup: {
                from: "bookedtickets",
                localField: "_id",
                foreignField: "ticketId",
                pipeline: [
                  {
                    $lookup: {
                      from: "users",
                      localField: "bookedBy",
                      foreignField: "_id",
                      pipeline: [
                        {
                          $project: {
                            _id: 1,
                            name: 1,
                            email: 1,
                            category: 1,
                            profile: 1,
                          },
                        },
                      ],
                      as: "userdetails",
                    },
                  },
                ],
                as: "bookedTickets",
              },
            },
          ],
          as: "tickets",
        },
      },
      {
        $sort: { CreatedAt: -1 }, // Sort by CreatedAt field in descending order
      },
    ]);

    if (list.length == 0) {
      return res.json({ status: "error", message: "No Event List Found" });
    } else {
      return res.json({ status: "success", data: list });
    }
  } catch (error) {
    return res.json({
      status: "error",
      message: `Unable To Find Events Lists ${error.message}`,
    });
  }
});

// Get List of Events which are Active

EventRouter.get("/active/list", UserAuthentication, async (req, res) => {
  try {

    const list = await EventModel.aggregate([
      {
        $match: {
          type: "Event",
          endDate: { $gte: currentDate },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          pipeline: [
            {
              $project: { _id: 1, name: 1, email: 1, category: 1, profile: 1 },
            },
          ],
          as: "userdetails",
        },
      },
      {
        $lookup: {
          from: "tickets",
          localField: "_id",
          foreignField: "eventId",
          as: "tickets",
        },
      },
      {
        $sort: { CreatedAt: -1 }, // Sort by CreatedAt field in descending order
      },
    ]);

    if (list.length == 0) {
      return res.json({
        status: "error",
        message: "No Active Event List Found",
      });
    } else {
      return res.json({ status: "success", data: list });
    }
  } catch (error) {
    return res.json({
      status: "error",
      message: `Unable To Find Available Events ${error.message}`,
    });
  }
});

// Get List of Events For Admin

EventRouter.get("/listall/admin", AdminAuthentication, async (req, res) => {
  try {
    const list = await EventModel.aggregate([
      {
        $match: { type: "Event" },
      },
      {
        $lookup: {
          from: "tickets",
          localField: "_id",
          foreignField: "eventId",
          as: "tickets",
        },
      },
      {
        $sort: { CreatedAt: -1 }, // Sort by CreatedAt field in descending order
      },
    ]);

    if (list.length == 0) {
      return res.json({ status: "error", message: "No Event List Found" });
    } else {
      return res.json({ status: "success", data: list });
    }
  } catch (error) {
    return res.json({
      status: "error",
      message: `Unable To Find Events Lists ${error.message}`,
    });
  }
});

// Get Detail of an Particular Events

EventRouter.get("/listall/admin/:id", AdminAuthentication, async (req, res) => {
  const { id } = req.params;
  try {
    const list = await EventModel.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(id), // Convert id to ObjectId using 'new'
          type: "Event",
        },
      },
      {
        $lookup: {
          from: "tickets",
          localField: "_id",
          foreignField: "eventId",
          pipeline: [
            {
              $lookup: {
                from: "bookedtickets",
                localField: "_id",
                foreignField: "ticketId",
                pipeline: [
                  {
                    $lookup: {
                      from: "users",
                      localField: "bookedBy",
                      foreignField: "_id",
                      pipeline: [
                        {
                          $project: {
                            _id: 1,
                            name: 1,
                            email: 1,
                            category: 1,
                            profile: 1,
                          },
                        },
                      ],
                      as: "userdetails",
                    },
                  },
                ],
                as: "bookedTickets",
              },
            },
          ],
          as: "tickets",
        },
      },
    ]);

    // const list = await EventModel.find({ createdBy: decoded._id, type: "Event" })
    if (list.length == 0) {
      return res.json({ status: "error", message: "No Event List Found" });
    } else {
      return res.json({ status: "success", data: list });
    }
  } catch (error) {
    return res.json({
      status: "error",
      message: `Unable To Find Events Details ${error.message}`,
    });
  }
});

// Filtering Event Based Upon City & Category
EventRouter.post("/filter", UserAuthentication, async (req, res) => {
  try {
    const { category, city } = req.body;

    // Validate input
    if (!category && !city) {
      return res.status(400).json({ message: "Please provide at least one search parameter (category or city)." });
    }

    const today = new Date().toISOString().split("T")[0];

    // Build the query dynamically
    const query = {
      endDate: { $gte: today } // Filter events where endDate is greater than or equal to today
    };
    if (category) {
      query.category = { $regex: category, $options: "i" }; // Case-insensitive partial match for category
    }
    if (city) {
      query["address.city"] = { $regex: city, $options: "i" }; // Case-insensitive partial match for city
    }

    // Fetch matching events
    const events = await EventModel.find(query);


    // Return results
    if (events.length == 0) {
      return res.json({ status: "error", message: "No Event Found" });
    } else {
      return res.json({ status: "success", data: events });
    }
  } catch (error) {
    return res.json({
      status: "error",
      message: `Unable To Find Events Details ${error.message}`,
    });
  }
});

// Find Event By Search

EventRouter.get("/find", UserAuthentication, async (req, res) => {
  const { search } = req.query;
  const regex = new RegExp(search, "i");
  try {
    const results = await EventModel.aggregate([
      {
        $match: {
          $or: [
            { eventType: { $regex: regex } },
            { category: { $regex: regex } },
            { "address.location": { $regex: regex } },
            { "address.state": { $regex: regex } },
            { "address.city": { $regex: regex } },
          ],
          type:{ $ne: 'Collaboration' },
          endDate: { $gte: currentDate },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          pipeline: [
            {
              $project: { _id: 1, name: 1, email: 1, profile: 1, category: 1 },
            },
          ],
          as: "professionaldetails",
        },
      },
    ]);
    if (results.length === 0) {
      return res.json({
        status: "error",
        message: "No matching records found",
      });
    }

    return res.json({ status: "success", data: results });
  } catch (error) {
    return res.json({
      status: "error",
      message: `Failed to Fetch Job Detail's ${error.message}`,
    });
  }
});



module.exports = { EventRouter };
