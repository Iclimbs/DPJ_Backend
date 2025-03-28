const express = require('express');
const mongoose = require('mongoose');
const categorySchema = mongoose.Schema({
    category: {
        type: String,
        required: true,
    },
    subCategory: {
        type: String,
        required:true
    }
})

const CategoryModel = mongoose.model("category", categorySchema);
module.exports = { CategoryModel }