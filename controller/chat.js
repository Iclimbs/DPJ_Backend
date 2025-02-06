const express = require("express");
const jwt = require("jsonwebtoken");
const ChatRouter = express.Router();
const { StreamChat } = require("stream-chat"); // Replace with your actual Stream Chat initialization
const { UserModel } = require("../model/user.model");

const streamChat = StreamChat.getInstance(
  process.env.STREAM_API_KEY,
  process.env.STREAM_PRIVATE_API_KEY,
);

const TOKEN_USER_ID_MAP = new Map();

// Assuming streamChat is properly initialized

ChatRouter.use(express.json());

ChatRouter.post("/signup", async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "Authentication");
  const id = decoded._id;
  const name = decoded.name;
  const image = decoded.profile;

  if (!id || !name) {
    return res.json({
      status: "error",
      message: "User Id Required For SignUp",
    });
  }

  try {
    const existingUsers = await streamChat.queryUsers({ id });

    if (existingUsers.users.length > 0) {
      return res.json({
        status: "error",
        message: "You have already Registered With This User Id",
      });
      // return res.status(400).send("User ID taken");
    }

    await streamChat.upsertUser({ id, name, image });
    return res.json({ status: "success" });
  } catch (error) {
    return res.json({
      status: "error",
      message: `Stream SignUp Failed  error.message`,
    });
  }
});

ChatRouter.post("/login", async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "Authentication");
  const id = decoded._id;

  if (!id) {
    return res.json({
      status: "error",
      message: "User Id is Required For Login",
    });
  }

  try {
    const { users } = await streamChat.queryUsers({ id });

    const user = users[0];

    if (!user) {
      return res.json({
        status: "error",
        message: "You are Unauthorized to access this feature",
      });
    }

    const token = streamChat.createToken(id);

    TOKEN_USER_ID_MAP.set(token, user.id);
    return res.json({
      status: "success",
      data: { token: token, user: user.name, id: user.id, image: user.image },
    });

  } catch (error) {
    return res.json({
      status: "error",
      message: `Internal Server Error ${error.message}`,
    });

    // res.status(500).send("Internal server error");
  }
});

ChatRouter.post("/logout", async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.json({
      status: "error",
      message: `Token Required`,
    });

    // return res.status(400).send("Missing token");
  }

  try {
    const id = TOKEN_USER_ID_MAP.get(token);

    if (!id) {
      return res.json({
        status: "error",
        message: `Invalid Token`,
      });

      // return res.status(400).send("Invalid token");
    }

    await streamChat.revokeUserToken(id, new Date());

    TOKEN_USER_ID_MAP.delete(token);
    return res.json({
      status: "success",
      message: `Logged out successfully`,
    });

    // res.status(200).send("Logged out successfully");
  } catch (error) {
    console.error(error);
    return res.json({
      status: "error",
      message: `Internal Server Error ${error.message}`,
    });

    // res.status(500).send("Internal server error");
  }
});

ChatRouter.post("/startchat", async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "Authentication");
  const id = decoded._id;
  const name = decoded.name;
  const image = decoded.profile;

  if (!id || !name) {
    return res.json({
      status: "error",
      message: "User Id Required For SignUp",
    });
  }

  try {
    const existingUsers = await streamChat.queryUsers({ id });

    if (existingUsers.users.length > 0) {
      const token = streamChat.createToken(id);
      const user = existingUsers.users[0];

      TOKEN_USER_ID_MAP.set(token, user.id);
      return res.json({
        status: "success",
        data: { token: token, user: user.name, id: user.id, image: user.image },
      });
    }

    await streamChat.upsertUser({ id, name, image });

    const newUsers = await streamChat.queryUsers({ id });

    if (newUsers.users.length > 0) {
      const token = streamChat.createToken(id);
      const user = newUsers.users[0];

      TOKEN_USER_ID_MAP.set(token, user.id);
      return res.json({
        status: "success",
        data: { token: token, user: user.name, id: user.id, image: user.image },
      });
    }
  } catch (error) {
    return res.json({
      status: "error",
      message: `Stream SignUp Failed  error.message`,
    });
  }
});

ChatRouter.get("/details", async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "Authentication");
  const id = decoded._id;
  const name = decoded.name;
  const image = decoded.profile;

  if (!id || !name) {
    return res.json({
      status: "error",
      message: "User Id Required For SignUp",
    });
  }

  try {
    const existingUsers = await streamChat.queryUsers({ id });

    if (existingUsers.users.length > 0) {
      const token = streamChat.createToken(id);
      const user = existingUsers.users[0];

      TOKEN_USER_ID_MAP.set(token, user.id);
      return res.json({
        status: "success",
        data: { token: token, user: user.name, id: user.id, image: user.image },
      });
    }

    await streamChat.upsertUser({ id, name, image });

    const newUsers = await streamChat.queryUsers({ id });

    if (newUsers.users.length > 0) {
      const token = streamChat.createToken(id);
      const user = newUsers.users[0];

      TOKEN_USER_ID_MAP.set(token, user.id);
      return res.json({
        status: "success",
        data: { token: token, user: user.name, id: user.id, image: user.image },
      });
    }
  } catch (error) {
    return res.json({
      status: "error",
      message: `Stream SignUp Failed  error.message`,
    });
  }
});

ChatRouter.get("/start/messaging/:userId", async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "Authentication");
  const { userId } = req.params;
  const client = StreamChat.getInstance(`${process.env.STREAM_API_KEY}`, `${process.env.STREAM_PRIVATE_API_KEY}`);

  const user2Details = await UserModel.find({ _id: userId })

  if (user2Details.length === 0) {
    return res.json({ status: 'error', message: 'No User Found With This UserId', redirct: '/profile/message' })
  }

  const id = decoded._id;
  const name = decoded.name;
  const image = decoded.profile;

  if (!id || !name || !image || !userId) {
    return res.json({
      status: "error",
      message: "User Id Required For SignUp",
    });
  }
  try {
    // Second User Is the Person Whose Id is passed in Query
    const secondUser = await streamChat.queryUsers({ id: userId });

    // First User Is the Person Whose Id is passed in Headers
    const firstUser = await streamChat.queryUsers({ id });

    if (secondUser.users.length === 0) {
      await streamChat.upsertUser({ id: user2Details[0]._id, name: user2Details[0].name, image: user2Details[0].profile });

    }

    if (firstUser.users.length === 0) {
      await streamChat.upsertUser({ id, name, image });

    }

    // Creating New Channel With Both User's
    const channelType = 'messaging';
    const channelId = `${user2Details[0]._id}`; // Unique identifier for the channel

    // Define the user IDs of the members to add to the channel
    const memberIds = [`${id}`, `${userId}`];

    // Create the channel
    const channel = client.channel(channelType, channelId, {
      members: memberIds, // Add members to the channel
      created_by_id: `${id}`, // The user who creates the channel
    });

    // Create the channel on the server
    const channelData = await channel.create();
    
    return res.json({ status: 'success', message: 'Channel Creted', redirct: "/profile/message" })

  } catch (error) {
    return res.json({
      status: "error",
      message: `Stream Chat Failed  ${error.message}`,
    });
  }
});


module.exports = ChatRouter;
