require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("node:path");
const swaggerjsdoc = require("swagger-jsdoc");
const swaggerui = require("swagger-ui-express");
const connection = require("./connection/connection");
const app = express();

app.use(express.json());
app.use(cors());
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

app.use('/public/', express.static(path.join(__dirname, 'public')));
app.use("/api/v1/", require("./routes/routes"));

app.listen(process.env.Port, async () => {
  try {
    await connection;
    console.log(`Server is Up & Running At Port ${process.env.Port}`);
  } catch (error) {
    console.log(error);
  }
});