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

app.use(session({ secret: 'cats', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());
app.use(
  cors({
    origin: `${process.env.CLIENT_URL}`,
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