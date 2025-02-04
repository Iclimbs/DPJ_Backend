const express = require('express');
const jwt = require('jsonwebtoken');
const WithDrawlRouter = express.Router();
const { default: mongoose } = require('mongoose');
const { WithDrawalModel, TransactionModel } = require('../model/ModelExport');
const { AdminAuthentication, UserAuthentication, WalletChecker } = require('../middleware/MiddlewareExport');
const { subAmountinWallet } = require('./wallet');


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
                        },
                        {
                            $lookup: {
                                from: 'bankaccountdetails',
                                localField: '_id',
                                foreignField: 'userId',
                                as: 'bankDetails'
                            }
                        },

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
        ]);
        if (list.length === 0) {
            return res.json({ status: 'error', message: 'No WithDrawal Request Found For This User' })
        } else {
            res.json({ status: 'success', data: list })
        }
        res.json({ status: 'success', data: bankDetails, message: 'Successfully Add Bank Account Details' })
    } catch (error) {
        res.json({
            status: 'error',
            message: `Failed To Add Bank Account Details Of User ${error?.message}`
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
            transactionId: transactionData._id
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
            }, {
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
                        },
                        {
                            $lookup: {
                                from: 'bankaccountdetails',
                                localField: '_id',
                                foreignField: 'userId',
                                as: 'bankDetails'
                            }
                        },

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
        ]);
        if (list.length === 0) {
            return res.json({ status: 'error', message: 'No WithDrawal Request Found For This User' })
        } else {
            res.json({ status: 'success', data: list })
        }
    } catch (error) {
        res.json({
            status: 'error',
            message: `Failed To Add Bank Account Details Of User ${error?.message}`
        })
    }
})


module.exports = { WithDrawlRouter }