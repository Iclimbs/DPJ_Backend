const express = require('express');
const jwt = require('jsonwebtoken');
const WithDrawlRouter = express.Router();
const { default: mongoose, mongo } = require('mongoose');
const { WithDrawalModel, TransactionModel, BankAccountModel } = require('../model/ModelExport');
const { AdminAuthentication, UserAuthentication, WalletChecker } = require('../middleware/MiddlewareExport');
const { subAmountinWallet, addAmountinWallet } = require('./wallet');


WithDrawlRouter.get("/list/admin", AdminAuthentication, async (req, res) => {
    try {
        const list = await WithDrawalModel.aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                name: 1,
                                email: 1,
                                verified: 1,
                                profile: 1,
                                accountType: 1
                            }
                        }
                    ],
                    as: "userDetails"

                }
            },
            {
                $lookup: {
                    from: "transactions",
                    localField: "transactionId",
                    foreignField: "_id",
                    as: "transactionDetails"

                }
            },
            { $sort: { CreatedAt: -1 } }

        ]);
        if (list.length === 0) {
            return res.json({ status: 'error', message: 'No WithDrawal Request Found' })
        } else {
            return res.json({ status: 'success', data: list })
        }
    } catch (error) {
        return res.json({
            status: 'error',
            message: `Failed To Fetch WithDrawal Request List Of User's ${error?.message}`
        })
    }
})

WithDrawlRouter.post("/add/request", [UserAuthentication, WalletChecker], async (req, res) => {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, "Authentication");
    const { amount } = req.body;
    if (!Number(amount)) {
        return res.json({ status: 'error', message: 'Amount Is Required' })
    }

    try {

        const bankDetails = await BankAccountModel.aggregate([{ $match: { userId: new mongoose.Types.ObjectId(decoded._id) } }])

        if (bankDetails.length === 0) {
            return res.json({
                status: 'error',
                message: 'No Bank Details Found For This User'
            })
        }
        const bankData = {
            accountNo: bankDetails[0]?.accountNo,
            accountName: bankDetails[0]?.accountName,
            ifscCode: bankDetails[0]?.ifscCode
        }

        const amountDeduction = await subAmountinWallet({ amount: req.body?.amount, userId: decoded._id })
        if (amountDeduction.status === 'error') {
            return res.json({ status: 'error', message: amountDeduction?.message })
        }
        const amountDeductionTransaction = new TransactionModel({
            amount: Number(amount),
            userId: decoded._id,
            type: 'Debit',
            status: "In Process",
            method: "Wallet",
            message: "Amount WithDrawal Request Created By User",
            from: decoded?._id,
        });

        const transactionData = await amountDeductionTransaction.save();

        const newRequest = new WithDrawalModel({
            userId: decoded._id,
            amount: Number(amount),
            transactionId: transactionData._id,
            bankDetails: bankData
        })
        await newRequest.save();
        return res.json({ status: 'success', message: 'You Have Successfully Submitted Amount WithDrawal Request. Please Wait For Verification From Admin Panel' })

    } catch (error) {
        return res.json({
            status: 'error',
            message: `Failed To Create New WithDrawl Request For User ${error?.message}`
        })
    }
})

WithDrawlRouter.get("/list", UserAuthentication, async (req, res) => {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, "Authentication");
    try {
        const list = await WithDrawalModel.aggregate([
            {
                $match: {
                    userId: new mongoose.Types.ObjectId(decoded._id)
                }
            },
            {
                $lookup: {
                    from: "transactions",
                    localField: "transactionId",
                    foreignField: "_id",
                    as: "transactionDetails"

                }
            },
            { $sort: { CreatedAt: -1 } }
        ]);
        if (list.length === 0) {
            return res.json({ status: 'error', message: 'No WithDrawal Request Found For This User' })
        } else {
            return res.json({ status: 'success', data: list })
        }
    } catch (error) {
        return res.json({
            status: 'error',
            message: `Failed To Fetch WithDrawal Requests Created By User ${error?.message}`
        })
    }
})


WithDrawlRouter.get("/accept/request/:id", AdminAuthentication, async (req, res) => {
    const { id } = req.params
    try {
        const list = await WithDrawalModel.aggregate([{ $match: { _id: new mongoose.Types.ObjectId(id) } }])
        if (list.length === 0) {
            return res.json({
                status: 'error',
                message: `No WithDrawal Request Found With This Id`
            })
        }
        const transactionData = await TransactionModel.findByIdAndUpdate(list[0].transactionId, { status: 'Success' }, { new: true },)
        return res.json({
            status: 'success',
            message: `Successfully Updated Request Status`
        })
    } catch (error) {
        return res.json({
            status: 'error',
            message: `Failed To Update WithDrawl Request For User ${error?.message}`
        })
    }
})

WithDrawlRouter.get("/reject/request", AdminAuthentication, async (req, res) => {
    const { id, message } = req.query;
    console.log("req", req.query);
    console.log("code", new mongoose.Types.ObjectId(req.query.id));


    try {
        const list = await WithDrawalModel.aggregate([{ $match: { _id: new mongoose.Types.ObjectId(id) } }])

        if (list.length === 0) {
            return res.json({
                status: 'error',
                message: `No WithDrawal Request Found With This Id`
            })
        }
        const amountReturn = await addAmountinWallet({ amount: list[0]?.amount, userId: list[0]?.userId })
        if (amountReturn.status === 'error') {
            return res.json({ status: 'error', message: amountReturn?.message })
        }

        const transactionData = await TransactionModel.findByIdAndUpdate(list[0].transactionId, { status: 'Declined', declineReason: message }, { new: true })

        return res.json({
            status: 'success',
            message: `Successfully Updated Request Status`
        })
    } catch (error) {
        return res.json({
            status: 'error',
            message: `Failed To Update WithDrawl Request For User ${error?.message}`
        })
    }
})


module.exports = { WithDrawlRouter }