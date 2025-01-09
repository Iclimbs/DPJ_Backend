// Basic Required Modules
const express = require("express");
const jwt = require("jsonwebtoken");

// Basic Model Imports
const { EventModel, CollabModel } = require("../model/ModelExport");

// Basic MiddleWare Imports
const { ArtistAuthentication, uploadMiddleWare } = require("../middleware/MiddlewareExport");
const { default: mongoose } = require("mongoose");

const CollabRouter = express.Router();

CollabRouter.post("/add", uploadMiddleWare.single("banner"), ArtistAuthentication, async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "Authentication");
  if (!req?.file) {
    res.json({ status: "error", message: `Please Upload Banner Image` });
  }

  const { title, description, category, startDate, endDate, startTime, endTime } = req.body;
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
    res.json({
      status: "success",
      message: `Collaboration Created Successfully`,
    });
  } catch (error) {
    res.json({
      status: "error",
      message: `Failed To Create New Collaboration ${error.message}`,
    });
  }
}
);

CollabRouter.patch("/edit/basic/:id", uploadMiddleWare.single("banner"), ArtistAuthentication, async (req, res) => {
  const { id } = req.params;
  let location;
  if (req.file) {
    location = req.file?.location;
  }
  try {
    const details = await EventModel.find({ _id: id });
    if (!details) {
      return res.json({ status: "error", message: 'No Event found' });
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
    let addressdata;
    let link;

    if (eventType === "Physical") {
      addressdata.country = req.body?.country || details[0].address.country;
      addressdata.state = req.body?.state || details[0].address.state;
      addressdata.city = req.body?.city || details[0].address.city;
      addressdata.location = req.body?.location || details[0].address.location;
      link = null;
    }else if (eventType === "Virtual") {
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

    res.json({ status: "success", message: `Collaboration Successfully Updated` });
  } catch (error) {
    res.json({
      status: "error",
      message: `Failed To update Collaboration Details ${error.message}`,
    });
  }
}
);

CollabRouter.post("/add/collaborators/:id", ArtistAuthentication, async (req, res) => {
  const { id } = req.params;
  const { collaborators } = req.body;
  let addCollaborators = [];
  let alreadypresent = [];
  try {

    const collab = await CollabModel.aggregate([{ $match: { eventId: new mongoose.Types.ObjectId(id) } }]);
    if (collab.length > 0) {
      for (let index = 0; index < collaborators.length; index++) {
        const foundObject = collab.find(obj => obj.email === (collaborators[index].email));
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
      }
    }
    if (alreadypresent.length > 0) {
      return res.json({ status: "error", message: `Some Collaborators Already Present In This Event ${alreadypresent}` });
    } else {
      const result = await CollabModel.insertMany(addCollaborators);
      res.json({
        status: "success",
        message:
          "Successfully Sent Collaboration Request To Other User",
      });

    }
  } catch (error) {
    res.json({
      status: "error",
      message: `Failed To Sent Collaboration Request To Other User Message :- ${error.message}`,
    });
  }
}
);

// Counter Offer For Collaborators
CollabRouter.patch("/edit/collaborators/amount/:id", ArtistAuthentication, async (req, res) => {
  const { id } = req.params;
  const { amount } = req.body;
  try {
    const result = await CollabModel.findOne({ _id: id });
    if (result.status == "Accepted") {
      return res.json({ status: "error", message: "Collaborator Already Accepted The Request" });
    } else {
      result.amount = amount;
      result.status = "Pending";
      await result.save();
      res.json({
        status: "success",
        message:
          "Successfully Sent Collaboration Request To Other User",
      });
    }
  } catch (error) {
    res.json({
      status: "error",
      message: `Failed To Update Collaborator Amount Message :- ${error.message}`,
    });
  }
}
);

// Currently Not In Use
CollabRouter.post("/edit/collaborators/:id", ArtistAuthentication, async (req, res) => {
  const { id } = req.params;
  const token = req.headers.authorization.split(" ")[1];
  const { collaborators } = req.body;
  const decoded = jwt.verify(token, "Authentication");
  const fileName = req.file.filename;
  try {
    const details = await EventModel.find({ eventId: id });
    res.json({ status: "success", message: `Collaborators List Successfully Updated` });
  } catch (error) {
    res.json({
      status: "error",
      message: `Failed To Update Colalborators List ${error.message}`,
    });
  }
}
);

// Get All Collaboration Events Created By User
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

// Get All Collaboration Events Requests Sent To User
CollabRouter.get("/request/list", ArtistAuthentication, async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "Authentication");
  try {
    const list = await CollabModel.aggregate([{ $match: { userId: new mongoose.Types.ObjectId(decoded._id) } }, { $lookup: { from: 'events', localField: 'eventId', foreignField: '_id', as: 'event' } }])
    if (list.length == 0) {
      res.json({ status: "error", message: "No Collaboration Request Found" })
    } else {
      res.json({ status: "success", data: list })
    }
  } catch (error) {
    res.json({ status: "error", message: `Unable To Find Collaboration Events Requests ${error.message}` })
  }
});

// Get All Collaborator List Whom Request Sent For Collaboration
CollabRouter.get("/list/artists/:id", ArtistAuthentication, async (req, res) => {
  const { id } = req.params
  try {
    const list = await CollabModel.aggregate([{ $match: { eventId: new mongoose.Types.ObjectId(id), status: "Pending" } }, { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'userdetails' } }])
    if (list.length == 0) {
      res.json({ status: "error", message: "No Collaborators Added In This Event " })
    } else {
      res.json({ status: "success", data: list })
    }
  } catch (error) {
    res.json({ status: "error", message: `Unable To Find Collaborators List In This Events ${error.message}` })
  }
});

// Update Collaborator Status 
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
