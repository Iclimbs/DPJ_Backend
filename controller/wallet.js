const express = require("express");
const { json } = require("express")
const jwt = require("jsonwebtoken");
const { WalletModel } = require("../model/wallet.model")
const { TransactionModel } = require("../model/transaction.model");
const { UserModel } = require("../model/user.model");
const { default: mongoose } = require("mongoose");
const WalletRouter = express.Router();


// Handling User's  Wallet Transactions

const addAmountinWallet = async (props) => {
    const { amount, userId } = props
    const wallet = await WalletModel.find({ userId: userId })
    wallet[0].balance = wallet[0]?.balance + amount;

    try {
        await wallet[0].save()
        return json({ status: 'success', message: `Successfully Added Balance in Your Wallet` })
    } catch (error) {
        return json({ status: 'error', message: `Failed To Add Balance in the Wallet ${error.message}` })
    }
}

const subAmountinWallet = async (props) => {
    const { amount, userId } = props
    const wallet = await WalletModel.find({ userId: userId })
    wallet[0].balance = wallet[0].balance - amount;

    try {
        await wallet[0].save()
        return json({ status: 'success', message: `Successfully Deducted Balance From Your Wallet` })
    } catch (error) {
        return json({ status: 'error', message: `Failed To Add Balance in the Wallet ${error.message}` })
    }
}


WalletRouter.post("/create", async (req, res) => {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, "Authentication");
    try {
        const walletlist = await WalletModel.find({ userId: decoded._id })
        if (walletlist.length > 0) {
            return res.json({ status: 'error', message: `Wallet Already Exists` })
        }
        const wallet = new WalletModel({ balance: 0, userId: decoded._id })
        await wallet.save()
        res.json({ status: 'success', message: `Wallet Successfully Created For The User !!` })
    } catch (error) {
        res.json({ status: 'error', message: `Failed To Create Wallet ${error.message}` })
    }
})

// Handlint Admin's Wallet Transactions

const addAmountInAdminWallet = async (props) => {
    const { amount, userId, eventId } = props
    try {
        const user = await UserModel.find({ "accountType": "admin" });
        if (user.length <= 0) {
            res.json({ status: 'error', message: `Admin Not Found` })
        }
        const wallet = await WalletModel.find({ "userId": user[0]._id });
        wallet[0].balance = wallet[0].balance + amount

        await wallet[0].save()

        const transaction = new TransactionModel({
            amount: totalAmount,
            userId: user[0]._id,
            type: "Credit",
            status: "Success",
            method: "Wallet",
            from: userId,
            to: user[0]._id,
            eventId: eventId
        })
        
        await transaction.save()


        return json({ status: 'success', message: `Successfully Transfered Amount to Admin Account.` })
    } catch (error) {
        return json({ status: 'error', message: `Failed To Transfer Amount To Admin Account ${error.message}` })
    }
}

const subAmountInAdminWallet = async (props) => {
    const { amount } = props

    try {
        const user = await UserModel.find({ "accountType": "admin" });
        if (user.length <= 0) {
            res.json({ status: 'error', message: `Admin Not Found` })
        }

        const wallet = await WalletModel.find({ "userId": user[0]._id })
        console.log("admin wallet", wallet);

        wallet[0].balance = wallet[0].balance - amount

        await wallet[0].save()
        return json({ status: 'success', message: `Successfully Transfered Amount From Admin Account.` })

    } catch (error) {
        return json({ status: 'error', message: `Failed To Deduct Amount From Admin Account ${error.message}` })
    }
}

const createWallet = async (props) => {
    const { userId } = props
    try {
        const walletlist = await WalletModel.find({ userId: userId })
        if (walletlist.length > 0) {
            return json({ status: 'error', message: `Wallet Already Exists` })
        }
        const wallet = new WalletModel({ balance: 0, userId: userId })
        await wallet.save()
        return json({ status: 'success', message: `Wallet Successfully Created For The User !!` })
    } catch (error) {
        return json({ status: 'error', message: `Failed To Create Wallet ${error.message}` })
    }
}

module.exports = { addAmountinWallet,createWallet, WalletRouter, subAmountinWallet, addAmountInAdminWallet, subAmountInAdminWallet }