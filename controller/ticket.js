// Importing Required Libraries
const express = require("express");
const jwt = require("jsonwebtoken");
const mongoose = require('mongoose');

// Importing Required Models
const { TicketModel, TransactionModel, BookedTicketModel } = require("../model/ModelExport");

// Importing Required Middleware
const { ArtistAuthentication, WalletChecker } = require("../middleware/MiddlewareExport");

const TicketRouter = express.Router();

// Api For Tickets

// Api To Book Tickets In An Event
TicketRouter.post("/booking/:id", [ArtistAuthentication, WalletChecker], async (req, res) => {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, "Authentication");
    const { id } = req.params;
    const { amount, tickets } = req.body;

    let parsedTickets = [];
    if (tickets) {
        try {
            parsedTickets = JSON.parse(tickets);
            if (!Array.isArray(parsedTickets)) {
                return res.json({ status: "error", message: "Parsed tickets is not an array" })
            }
        } catch (err) {
            return res.json({
                status: "error",
                message: "Invalid tickets format. Tickets must be a JSON array.",
            });
        }
    }


    if (parsedTickets.length > 0) {
        try {

            const transaction = new TransactionModel({
                amount: amount,
                type: "Debit",
                userId: decoded._id,
                method: "Wallet",
                eventId: id,
            });

            const transactionData = await transaction.save();

            // Adding Booked Ticket Data
            const ticketData = tickets.map((ticket) => ({
                eventId: id,
                bookedBy: decoded._id,
                ticketId: ticket._id,
                price: ticket.price,
                name: ticket.name,
                quantity: ticket.quantity,
                trasactionId: transactionData._id
            }));

            await BookedTicketModel.insertMany(ticketData);

            res.json({
                status: "success",
                message: `Ticket Purchased Successfully`,
            });

        } catch (error) {
            res.json({
                status: "error",
                message: `Failed To Purchase Ticket For Event ${error.message}`,
            });
        }
    } else {
        res.json({
            status: "error",
            message: `Failed To Book Tickets`,
        });
    }

}
);

// Get List of Different Tickets Booked Tickets By User in all the Events
TicketRouter.get("/booked/event/list", ArtistAuthentication, async (req, res) => {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, "Authentication");

    try {
        const list = await BookedTicketModel.aggregate([
            {
                $match: {
                    bookedBy: new mongoose.Types.ObjectId(decoded._id), // Convert id to ObjectId using 'new'
                }
            },
            {
                $lookup: {
                    from: 'events',
                    localField: 'eventId',
                    foreignField: '_id',
                    as: 'eventdetails',
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                address: 1,
                                link: 1,
                                banner: 1,
                                category: 1,
                                title: 1,
                                description: 1,
                                startTime: 1,
                                startDate: 1,
                                endTime: 1,
                                endDate: 1,
                                endTime: 1
                            }
                        }
                    ]
                }
            },
        ]);
        if (list.length == 0) {
            res.json({ status: "error", message: "No Booked Ticket List Found" })
        } else {
            res.json({ status: "success", data: list });
        }
    } catch (error) {
        res.json({ status: "error", message: `Unable To Get Booked Ticket List ${error.message}` });
    }
});

// Get List of All the tickets booked in a particular Event     
TicketRouter.get("/booked/event/list/:id", ArtistAuthentication, async (req, res) => {
    const { id } = req.params;
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, "Authentication");
    try {
        const list = await BookedTicketModel.aggregate([
            {
                $match: {
                    eventId: new mongoose.Types.ObjectId(id), // Convert id to ObjectId using 'new'

                }
            }, {
                $lookup: {
                    from: 'users',
                    localField: 'bookedBy',
                    foreignField: '_id',
                    pipeline:[{
                        $project: {
                            _id: 1,
                            name: 1,
                            email: 1,
                            profile:1,
                            category:1,
                        }
                    }],
                    as: 'userdetails'
                },
            },
        ]);
        if (list.length == 0) {
            res.json({ status: "error", message: "No Booked Ticket List Found" })
        } else {
            res.json({ status: "success", data: list });
        }
    } catch (error) {
        res.json({ status: "error", message: `Unable To Get Booked Ticket List ${error.message}` });
    }
});

TicketRouter.get("/booked/events/details", ArtistAuthentication, async (req, res) => {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, "Authentication");

    try {
        const list = await BookedTicketModel.aggregate([
            {
                $match: {
                    bookedBy: new mongoose.Types.ObjectId(decoded._id), // Convert id to ObjectId using 'new'
                }
            },
            {
                $lookup: {
                    from: 'events',
                    localField: 'eventId',
                    foreignField: '_id',
                    as: 'eventdetails'
                }
            },
            {
                $unwind: '$eventdetails'
            },
            {
                $group: {
                    _id: '$eventdetails._id',
                    event: { $first: '$eventdetails' },
                    tickets: {
                        $push: {
                            ticketId: '$_id',
                            price: '$price',
                            name: '$name',
                            quantity: '$quantity',
                            bookedAt: '$createdAt'
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    event: 1,
                    tickets: 1
                }
            }
        ]);

        if (list.length === 0) {
            res.json({ status: "error", message: "No Booked Events Found" });
        } else {
            res.json({ status: "success", data: list });
        }
    } catch (error) {
        console.error(`Error finding booked events: ${error.message}`);
        res.json({ status: "error", message: `Unable To Find Booked Events ${error.message}` });
    }
});


module.exports = { TicketRouter }