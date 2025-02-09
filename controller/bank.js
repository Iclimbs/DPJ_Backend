const express = require('express');
const jwt = require('jsonwebtoken');
const BankRouter = express.Router();
const { BankAccountModel } = require('../model/ModelExport');
const { default: mongoose } = require('mongoose');
const { UserAuthentication } = require('../middleware/MiddlewareExport');


BankRouter.post("/add", UserAuthentication, async (req, res) => {
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
            return res.json({ status: 'error', message: 'You Cannot Add New Bank Details' })
        } else {
            const newBankDetails = new BankAccountModel({
                accountNo: accountNo,
                accountName: accountName,
                ifscCode: ifscCode,
                userId: decoded._id
            })

            await newBankDetails.save()
            return res.json({ status: 'success', message: 'Successfully Add Bank Account Details' })
        }
    } catch (error) {
        return res.json({
            status: 'error',
            message: `Failed To Add Bank Account Details Of User ${error?.message}`
        })
    }
})

BankRouter.get("/getdetails", UserAuthentication, async (req, res) => {
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
            return res.json({ status: 'error', message: 'No Bank Account Details Found For This User' })

        } else {
            return res.json({ status: 'success', data: bankDetails[0] })
        }
    } catch (error) {
        return res.json({
            status: 'error',
            message: `Failed To Get Bank Account Details Of User ${error?.message}`
        })
    }
})

BankRouter.patch("/updateDetails/:id", UserAuthentication, async (req, res) => {
    const { id } = req.params;
    try {
        const bankDetails = await BankAccountModel.findByIdAndUpdate(
            id,
            { accountNo: req.body?.accountNo, accountName: req.body?.accountName, ifscCode: req.body.ifscCode },
            { new: true },
        );
        return res.json({ status: 'success', message: 'Successfully Updated Bank Account Details' })
    } catch (error) {
        return res.json({
            status: 'error',
            message: `Failed To Update Bank Account Details Of User ${error?.message}`
        })
    }
})


module.exports = { BankRouter }