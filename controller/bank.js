const express = require('express');
const jwt = require('jsonwebtoken');
const BankRouter = express.Router();
const { BankAccountModel } = require('../model/ModelExport');
const { default: mongoose } = require('mongoose');


BankRouter.post("/add", async (req, res) => {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, "Authentication");
    const { accountNo, accountName, ifscCode } = req.body
    try {
        const bankDetails = await BankAccountModel.aggregate([
            {
                $match: {
                    userId: new mongoose.Types.ObjectId(decoded._id),
                },
            },
        ]);
        if (bankDetails.length != 0) {
            res.json({ status: 'error', message: 'You Cannot Add New Bank Details' })
        } else {
            const newBankDetails = new BankAccountModel({
                accountNo: accountNo,
                accountName: accountName,
                ifscCode: ifscCode,
                userId: decoded._id
            })

            await newBankDetails.save()
            res.json({ status: 'success', message: 'Successfully Add Bank Account Details' })
        }
    } catch (error) {
        res.json({
            status: 'error',
            message: `Failed To Add Bank Account Details Of User ${error?.message}`
        })
    }
})



BankRouter.get("/getdetails", async (req, res) => {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, "Authentication");
    try {
        const bankDetails = await BankAccountModel.aggregate([
            {
                $match: {
                    userId: new mongoose.Types.ObjectId(decoded._id),
                },
            },
        ]);
        if (bankDetails.length == 0) {
            res.json({ status: 'error', message: 'No Bank Account Details Found For This User' })

        } else {
            res.json({ status: 'success', data: bankDetails[0] })
        }
    } catch (error) {
        res.json({
            status: 'error',
            message: `Failed To Get Bank Account Details Of User ${error?.message}`
        })
    }
})


BankRouter.patch("/updateDetails/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const bankDetails = await BankAccountModel.findByIdAndUpdate(
            id,
            { accountNo: req.body?.accountNo, accountName: req.body?.accountName, ifscCode: req.body.ifscCode },
            { new: true },
        );
        res.json({ status: 'success', message: 'Successfully Updated Bank Account Details' })
    } catch (error) {
        res.json({
            status: 'error',
            message: `Failed To Update Bank Account Details Of User ${error?.message}`
        })
    }
})


module.exports = { BankRouter }