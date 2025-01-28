// const express = require("express");

// import { StreamChat } from "stream-chat"

// const streamChat = StreamChat.getInstance(
//   process.env.STREAM_API_KEY!,
//   process.env.STREAM_PRIVATE_API_KEY!
// )

// const TOKEN_USER_ID_MAP = new Map<string, string>()

// export async function userRoutes(app: FastifyInstance) {
//   app.post<{ Body: { id: string; name: string; image?: string } }>(
//     "/signup",
//     async (req, res) => {
//       const { id, name, image } = req.body
//       if (id == null || id === "" || name == null || name === "") {
//         return res.status(400).send
//       }

//       const existingUsers = await streamChat.queryUsers({ id })
//       if (existingUsers.users.length > 0) {
//         return res.status(400).send("User ID taken")
//       }

//       await streamChat.upsertUser({ id, name, image })
//     }
//   )

//   app.post<{ Body: { id: string } }>("/login", async (req, res) => {
//     const { id } = req.body
//     if (id == null || id === "") {
//       return res.status(400).send
//     }

//     const {
//       users: [user],
//     } = await streamChat.queryUsers({ id })
//     if (user == null) return res.status(401).send()

//     const token = streamChat.createToken(id)
//     TOKEN_USER_ID_MAP.set(token, user.id)

//     return {
//       token,
//       user: { name: user.name, id: user.id, image: user.image },
//     }
//   })

//   app.post<{ Body: { token: string } }>("/logout", async (req, res) => {
//     const token = req.body.token
//     if (token == null || token === "") return res.status(400).send()

//     const id = TOKEN_USER_ID_MAP.get(token)
//     if (id == null) return res.status(400).send()

//     await streamChat.revokeUserToken(id, new Date())
//     TOKEN_USER_ID_MAP.delete(token)
//   })
// }

const express = require("express");
const jwt = require("jsonwebtoken");
const ChatRouter = express.Router();
const { StreamChat } = require("stream-chat"); // Replace with your actual Stream Chat initialization

const streamChat = StreamChat.getInstance(
  process.env.STREAM_API_KEY,
  process.env.STREAM_PRIVATE_API_KEY,
);
console.log("stream ", streamChat);

const TOKEN_USER_ID_MAP = new Map();

// Assuming streamChat is properly initialized

ChatRouter.use(express.json());

ChatRouter.post("/signup", async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "Authentication");
  // const { id name, profile } = decoded;
  const id = decoded._id;
  const name = decoded.name;
  const image = decoded.profile;
  console.log("decoded", decoded);
  // const { id, name, image } = req.body;

  if (!id || !name) {
    return res.status(400).send("Missing required fields");
  }

  try {
    const existingUsers = await streamChat.queryUsers({ id });

    if (existingUsers.users.length > 0) {
      return res.status(400).send("User ID taken");
    }

    await streamChat.upsertUser({ id, name, image });

    res.status(201).send(); // Added success response
  } catch (error) {
    console.error(error);

    res.status(500).send("Internal server error");
  }
});

ChatRouter.post("/login", async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "Authentication");
  // const { id: _id, name, image: profile } = decoded;
  const id = decoded._id;
  const name = decoded.name;
  const image = decoded.profile;

  // const { id } = req.body;

  if (!id) {
    return res.status(400).send("Missing user ID");
  }

  try {
    const { users } = await streamChat.queryUsers({ id });

    const user = users[0];

    if (!user) {
      return res.status(401).send("Unauthorized");
    }

    const token = streamChat.createToken(id);

    TOKEN_USER_ID_MAP.set(token, user.id);

    res.json({
      token,

      user: { name: user.name, id: user.id, image: user.image },
    });
  } catch (error) {
    console.error(error);

    res.status(500).send("Internal server error");
  }
});

ChatRouter.post("/logout", async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).send("Missing token");
  }

  try {
    const id = TOKEN_USER_ID_MAP.get(token);

    if (!id) {
      return res.status(400).send("Invalid token");
    }

    await streamChat.revokeUserToken(id, new Date());

    TOKEN_USER_ID_MAP.delete(token);

    res.status(200).send("Logged out successfully");
  } catch (error) {
    console.error(error);

    res.status(500).send("Internal server error");
  }
});

module.exports = ChatRouter;
