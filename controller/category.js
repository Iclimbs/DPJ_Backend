const express = require('express')
const { CategoryModel } = require("../model/ModelExport");
const { AdminAuthentication } = require('../middleware/Authorization');
const { UserAuthentication } = require('../middleware/Authentication');
const CategoryRouter = express.Router();

CategoryRouter.get('/listall/:category', UserAuthentication ,async (req, res) => {
    const { category } = req.params;
    try {

        const list = await CategoryModel.find({ accountType: category });
        if (list === 0) {
            return res.json({ 'status': 'error', message: 'No List Found Of This Category' })
        } else {
            return res.json({ 'status': 'success', data: list })
        }
    } catch (error) {
        return res.json({ status: 'error', message: `Failed To Fetch Category List ${error.message}` })
    }
})

CategoryRouter.get('/listall/admin', AdminAuthentication ,async (req, res) => {
    try {

        const list = await CategoryModel.find({});
        if (list === 0) {
            return res.json({ 'status': 'error', message: 'No List Found Of This Category' })
        } else {
            return res.json({ 'status': 'success', data: list })
        }
    } catch (error) {
        return res.json({ status: 'error', message: `Failed To Fetch Category List ${error.message}` })
    }
})


CategoryRouter.post('/add', AdminAuthentication, async (req, res) => {
    const { name, type } = req.body;
    try {

        const newCategory = new CategoryModel({ name: name, accountType: type })
        await newCategory.save();
        return res.json({ status: 'success', message: 'Successfully Added New Category' })
    } catch (error) {
        return res.json({ status: 'error', message: `Failed To Fetch Category List ${error.message}` })
    }
})


CategoryRouter.patch('/update/:id', AdminAuthentication, async (req, res) => {
    const { name, type } = req.body;
    const { id } = req.params
    try {
        const updateCategoryData = await CategoryModel.findByIdAndUpdate(id, { name: name, type: type })
        console.log(updateCategoryData);
        if (updateCategoryData === null) {
            return res.json({ status: 'error', message: 'No Category Found For This Id' })
        } else {
            return res.json({ status: 'success', message: 'Successfully Updated Category Details' })
        }

    } catch (error) {
        return res.json({ status: 'error', message: `Failed To Update Category Details ${error.message}` })
    }
})

module.exports = { CategoryRouter }

