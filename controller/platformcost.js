// Basic Required Modules
require("dotenv").config();
const jwt = require("jsonwebtoken");
const express = require("express");

// Basic Model Imports
const { PlatformCostModel } = require("../model/ModelExport");

// Basic Middleware Imports
const {
    ProfessionalAuthentication,
    UserAuthentication,
    AdminAuthentication,
    uploadMiddleWare,
    JobCreationChecker,
    ArtistAuthentication,
    JobApplyChecker,
} = require("../middleware/MiddlewareExport");

const PlatformCostRouter = express.Router();

// Add Platform Fees

PlatformCostRouter.post("/add",AdminAuthentication, async (req, res) => {
    try {
        const { amount } = req.body;
        if (!amount) {
            return res.json({ status: 'error', message: 'Amount is Required!' })
        }
        const cost = new PlatformCostModel({
            const: amount
        })
        await cost.save();
        return res.json({ status: 'success', message: 'Platform Cost Added Successfully!' })
    } catch (error) {
        return res.json({ status: 'error', message: `Failed To Add Platform Fees :- ${error.message}` })
    }
})

// Get platform Fees

PlatformCostRouter.get("/list",UserAuthentication, async (req, res) => {
    try {
        const list = await PlatformCostModel.find()
        if (list.length !== 0) {
            return res.json({ status: 'success', data: list })
        } else {
            return res.json({ status: 'error', message: 'No Platform Fees Found!' })
        }
    } catch (error) {
        return res.json({ status: 'error', message: `Failed To Fetch Platform Fees Detail's :- ${error.message}` })
    }
})


// Get platform Fees

PlatformCostRouter.get("/list/admin",AdminAuthentication, async (req, res) => {
    try {
        const list = await PlatformCostModel.find()
        if (list.length !== 0) {
            return res.json({ status: 'success', data: list })
        } else {
            return res.json({ status: 'error', message: 'No Platform Fees Found!' })
        }
    } catch (error) {
        return res.json({ status: 'error', message: `Failed To Fetch Platform Fees Detail's :- ${error.message}` })
    }
})

// Update platform Fees

PlatformCostRouter.patch("/edit/:id",AdminAuthentication, async (req, res) => {
    try {
        const { id } = req.params;
        const { amount } = req.body
        if (!id || !amount) {
            return res.json({ status: 'error', message: 'Id & Amount is required!' })
        }
        const data = {
            cost: amount
        }
        const list = await PlatformCostModel.findByIdAndUpdate(id, data, { new: true })
        if (list !== null) {
            return res.json({ status: 'success', data:'Platform Fees Cost Updated Successfully!' })
        } else {
            return res.json({ status: 'error', message: 'No Platform Fees Found!' })
        }
    } catch (error) {
        return res.json({ status: 'error', message: `Failed To Update Platform Fees Detail's :- ${error.message}` })
    }
})


module.exports = { PlatformCostRouter }