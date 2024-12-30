require('dotenv').config()
const mongoose = require("mongoose")
const connection = mongoose.connect('mongodb+srv://iclimbsofficial:BCyPPFNSpJjimuOr@iclimbs.m1nlcjl.mongodb.net/DPJ?retryWrites=true&w=majority&appName=Iclimbs')
module.exports = connection