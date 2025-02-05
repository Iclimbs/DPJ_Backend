require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("node:path");
const swaggerjsdoc = require("swagger-jsdoc");
const swaggerui = require("swagger-ui-express");
const connection = require("./connection/connection");
const bodyParser = require('body-parser');
const passport = require("passport");
const session = require('express-session');
const passportStrategy = require("./service/googleAuth");
const authRoute = require("./controller/googlelogin");
const app = express();
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.json());
// app.use(cors({
//   origin: ['http://localhost:5173',], // Allow requests from this origin
//   credentials: true, // Allow credentials (if needed)
// }));
// const allowedOrigins = [
//   "http://localhost:5173",
//   "http://dpjhub.com.s3-website.ap-south-1.amazonaws.com",
// ];

// CORS configuration
// app.use(
//   cors({
//     origin: function (origin, callback) {
//       // Allow requests with no origin (e.g., mobile apps, curl requests)
//       if (!origin) return callback(null, true);

//       // Check if the origin is in the allowed list
//       if (allowedOrigins.indexOf(origin) !== -1) {
//         callback(null, true);
//       } else {
//         callback(new Error("Not allowed by CORS"));
//       }
//     },
//     credentials: true, // Allow cookies and credentials
//     methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Allowed HTTP methods
//     allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
//   })
// );



app.use(session({ secret: 'cats', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: "GET,POST,PUT,PATCH,DELETE",
    credentials: true,
  })
);


const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "DPJ API'S",
      version: "0.1.0",
      description:
        "This is a DJP Hub API application Book made with Express and documented with Swagger",
      license: {
        name: "MIT",
        url: "https://spdx.org/licenses/MIT.html",
      },
      contact: {
        name: "Uttam Kumar Shaw",
        url: "https://iclimbs.com/",
        email: "uttamkrshaw@iclimbs.com",
      },
    },
    servers: [
      {
        url: "http://localhost:4500/api/v1/",
        description: 'Development Server Routes'
      },
    ],
  },
  apis: ["./controller/*.js"],
};

const openapiSpecification = swaggerjsdoc(options);
app.use(
  "/api-docs",
  swaggerui.serve,
  swaggerui.setup(openapiSpecification)
);

app.use("/api/v1/", require("./routes/routes"));
app.use('/', express.static(path.join(__dirname, 'public')));
app.use("/auth", authRoute);


app.listen(process.env.Port, async () => {
  try {
    await connection;
    console.log(`Server is Up & Running At Port ${process.env.Port}`);
  } catch (error) {
    res.json({ status: 'error', message: `${error.message}` })
  }
});