require("dotenv").config();
const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
  host: "smtp-mail.outlook.com",
  port: 587,
  // secure: true, // true for port 465, false for other ports
  auth: {
    user:process.env.emailuser,
    pass:process.env.emailpassword,
  }
});

// For Gmail
const gmailtransporter = nodemailer.createTransport({
  service: "gmail",
  secure: true,
  port: 465,
  auth: {
    user: process.env.user,
    pass: process.env.pass,
  },
});

module.exports = { transporter,gmailtransporter };