const express = require("express");
const multer = require("multer");
const path = require("node:path");
const fs = require('fs');
const jwt = require("jsonwebtoken");
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
  const decoded = jwt.verify(token, "Authentication");
  const fileName = req.file.filename;
  const { title, description, address, eventType, category, startDate, endDate, startTime, endTime, } = req.body;
  const startDateTime = new Date(`${startDate}T${startTime}`);
  const endDateTime = new Date(`${endDate}T${endTime}`);
  const collaboration = new EventModel({
    address: address,
    title: title,
    banner: fileName,
    description: description,
    category: category,
    startDateTime: startDateTime,
    endDateTime: endDateTime,
    eventType: eventType,
    type: "Collaboration",
    createdBy: decoded._id,
  });
  try {
    savedDocument = await collaboration.save();
    res.json({
      status: "success",
      message: `Collaboration Created Successfully`,
    });
  } catch (error) {
    res.json({
      status: "error",
      message: `Failed To Add New Event ${error.message}`,
    });
  }
}
);

CollabRouter.post("/add/collaborators/:id", ArtistAuthentication, async (req, res) => {
  const { id } = req.params;
  const { collaborators } = req.body;
  let addCollaborators = [];
  for (let index = 0; index < collaborators.length; index++) {
    addCollaborators.push({
      userId: collaborators[index]._id,
      email: collaborators[index].email,
      name: collaborators[index].name,
      amount: collaborators[index].amount,
      eventId: id,
    });
  }
  try {
    const result = await CollabModel.insertMany(addCollaborators);
    res.json({
      status: "success",
      message:
        "Successfully Added Collaborators in The Following Collaboration Event",
    });
  } catch (error) {
    res.json({
      status: "error",
      message: `Failed To Add New Event ${error.message}`,
    });
  }
}
);

CollabRouter.post("/edit/basic/:id", ArtistAuthentication, upload.single("banner"), async (req, res) => {
  const { id } = req.params;
  const { title, description, address, category, startDate, endDate, startTime, endTime, } = req.body;
  const startDateTime = new Date(`${startDate}T${startTime}`);
  const endDateTime = new Date(`${endDate}T${endTime}`);
  const fileName = req.file.filename;
  try {
    const details = await EventModel.find({ _id: id });
    fs.unlink(`${uploadPath}/${details[0].banner}`, (err) => {
      if (err) {
        console.error('Error deleting old file:', err);
      } else {
        console.log('Old file deleted successfully');
      }
    });
    details[0].title = title;
    details[0].description = description;
    details[0].category = category;
    details[0].startDateTime = startDateTime;
    details[0].endDateTime = endDateTime;
    details[0].banner = fileName;
    details[0].category = category;
    details[0].address = address;
    await details[0].save();
    res.json({ status: "success", message: `Event Successfully Updatec` });
  } catch (error) {
    res.json({
      status: "error",
      message: `Failed To Edit Event Details ${error.message}`,
    });
  }
}
);

CollabRouter.post("/edit/collaborators/:id", ArtistAuthentication, async (req, res) => {
  const { id } = req.params;
  const token = req.headers.authorization.split(" ")[1];
  const { collaborators } = req.body;
  const decoded = jwt.verify(token, "Authentication");
  const fileName = req.file.filename;
  try {
    const details = await EventModel.find({ eventId: id });
    res.json({ status: "success", message: `Event Successfully Updated` });
  } catch (error) {
    res.json({
      status: "error",
      message: `Failed To Add New Event ${error.message}`,
    });
  }
}
);


CollabRouter.get("/list", ArtistAuthentication, async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "Authentication");

  try {
    const list = await EventModel.find({ createdBy: decoded._id, type: "Collaboration" })
    if (list.length == 0) {
      res.json({ status: "error", message: "No Collaboration Event Found" })
    } else {
      res.json({ status: "success", data: list })
    }
  } catch (error) {
    res.json({ status: "error", message: `Unable To Find Collaboration Events ${error.message}` })
  }
});


CollabRouter.get("/request/list", ArtistAuthentication, async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "Authentication");
  try {
    const list = await CollabModel.find({ userId: decoded._id})
    if (list.length == 0) {
      res.json({ status: "error", message: "No Collaboration Request Found" })
    } else {
      res.json({ status: "success", data: list })
    }
  } catch (error) {
    res.json({ status: "error", message: `Unable To Find Collaboration Events Requests ${error.message}` })
  }
});


CollabRouter.get("/list/artists/:id", ArtistAuthentication, async (req, res) => {
  const { id } = req.params
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "Authentication");
  try {
    const list = await CollabModel.find({ eventId: id, userId: decoded._id })
    if (list.length == 0) {
      res.json({ status: "error", message: "No Collaborators Added In This Event " })
    } else {
      res.json({ status: "success", data: list })
    }
  } catch (error) {
    res.json({ status: "error", message: `Unable To Find Collaborators List In This Events ${error.message}` })
  }
});


CollabRouter.post("/update/collab/status/:id", ArtistAuthentication, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "Authentication");
  try {
    const list = await CollabModel.find({ _id: id, userId: decoded._id })
    if (list.length == 0) {
      res.json({ status: "error", message: "No Collaborators Added In This Event " })
    } else {
      list[0].status = status
      await list[0].save()
      res.json({ status: "success", message: "Updated Collaborator Status" })
    }
  } catch (error) {
    res.json({ status: "error", message: `Unable To Update Collaborators Status In This Events ${error.message}` })
  }
});


module.exports = { CollabRouter };
