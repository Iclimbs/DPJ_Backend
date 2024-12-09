const express = require("express");
const multer = require("multer");
const path = require("node:path");
const jwt = require('jsonwebtoken');
const { EventModel } = require("../model/event.model");
const { ArtistAuthentication } = require("../middleware/Authentication");
const { CollabModel } = require("../model/collaboration.model");
const CollabRouter = express.Router();
const uploadPath = path.join(__dirname, "../public/collaborations");

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

CollabRouter.post("/add", upload.single("banner"), ArtistAuthentication, async (req, res) => {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, 'Authentication');
    const fileName = req.file.filename;
    const { title, description, address, eventType, category, startDate, endDate, startTime, endTime, collaborators } = req.body
    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(`${endDate}T${endTime}`);
    const collaboration = new EventModel({
        address: address, title: title, banner: fileName, description: description, category: category, startDateTime: startDateTime, endDateTime: endDateTime, eventType: eventType, type: "Collaboration", createdBy: decoded._id
    })
    try {
        savedDocument = await collaboration.save()
        res.json({ status: "success", message: `Collaboration Created Successfully` })
    } catch (error) {
        res.json({ status: 'error', message: `Failed To Add New Event ${error.message}` })
    }
})

CollabRouter.post("/edit/basic/:id", ArtistAuthentication, upload.single("banner"), async (req, res) => {
    const { id } = req.params;
    const token = req.headers.authorization.split(" ")[1];
    const { title, description, category, banner, startDate, endDate, startTime, endTime } = req.body
    const decoded = jwt.verify(token, 'Authentication');
    const fileName = req.file.filename;
    try {
        const details = await EventModel.find({ _id: id })
        details[0].title = title;
        details[0].description = description;
        details[0].category = category;
        details[0].startDate = startDate;
        details[0].endDate = endDate;
        details[0].startTime = startTime;
        details[0].endTime = endTime;
        details[0].banner = fileName;

        await details[0].save()
        res.json({ status: 'status', message: `Event Successfully Updatec` })
    } catch (error) {
        res.json({ status: 'error', message: `Failed To Add New Event ${error.message}` })
    }
})


CollabRouter.post("/edit/collaborators/:id", ArtistAuthentication, async (req, res) => {
    const { id } = req.params;
    const token = req.headers.authorization.split(" ")[1];
    const { collaborators } = req.body
    const decoded = jwt.verify(token, 'Authentication');
    const fileName = req.file.filename;
    try {
        const details = await EventModel.find({ eventId: id })
        res.json({ status: 'status', message: `Event Successfully Updated` })
    } catch (error) {
        res.json({ status: 'error', message: `Failed To Add New Event ${error.message}` })
    }
})



module.exports = { CollabRouter }