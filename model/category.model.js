const express = require('express');
const mongoose = require('mongoose');
const categorySchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    accountType: {
        type: String,
    }
})

const CategoryModel = mongoose.model("category", categorySchema);
module.exports = { CategoryModel }