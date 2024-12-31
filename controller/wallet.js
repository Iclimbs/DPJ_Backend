const express = require("express");
const { json } = require("express")
const jwt = require("jsonwebtoken");
const { WalletModel } = require("../model/wallet.model")
const { TransactionModel } = require("../model/transaction.model")
const WalletRouter = express.Router();


const addAmountinWallet = async (props) => {
    const { amount, userId, refNo, method } = props
    const wallet = await WalletModel.find({ userId: userId })
    wallet[0].balance = wallet[0].balance + amount

    try {
        await wallet[0].save()
    } catch (error) {
        return json({ status: 'error', message: `Failed To Add Balance in the Wallet ${error.message}` })
    }

    const transaction = new TransactionModel({ amount: amount, type: "Credit", userId: userId, refNo: refNo, method: method })

    try {
        await transaction.save()
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











module.exports = { addAmountinWallet, WalletRouter }