const { UserAuthentication } = require("../middleware/Authentication");

const express = require("express");
const PaymentRouter = express.Router();
const Razorpay = require("razorpay");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { TransactionModel } = require("../model/transaction.model");
const { addAmountinWallet } = require("./wallet");


const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_SECRET,
});

PaymentRouter.post("/checkout", UserAuthentication, async (req, res) => {
    const { amount } = req.body;

    try {
        const options = {
            amount: Number(amount * 100),
            currency: "INR",
            receipt: crypto.randomBytes(10).toString("hex"),
        }

        razorpayInstance.orders.create(options, (error, order) => {
            if (error) {
                return res.json({ status: "error", message: `Something Went Wrong ${error}` });
            }
            res.json({ status: "success", data: order });
        });
    } catch (error) {
        res.json({ status: "error", message: `Internal Server Error ${error.message}` });
    }
})

PaymentRouter.post("/verification",UserAuthentication, async (req, res) => {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, "Authentication");

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;

    try {
        // Create Sign
        const sign = razorpay_order_id + "|" + razorpay_payment_id;

        // Create ExpectedSign
        const expectedSign = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET)
            .update(sign.toString())
            .digest("hex");

        // Create isAuthentic
        const isAuthentic = expectedSign === razorpay_signature;

        // Condition 
        if (isAuthentic) {
            const payment = new TransactionModel({
                type: "Credit",
                status: "Success",
                userId: decoded._id,
                paymentId: razorpay_payment_id,
                orderId: razorpay_order_id,
                amount: Math.floor(Number(amount / 100)),
            });
            try {
                await payment.save();

               const upateWalletBalance = addAmountinWallet({ amount: Math.floor(Number(amount / 100)), userId: decoded._id });
                // Send Message 
                if (upateWalletBalance.status === "error") {
                    return res.json({ status: 'error', message: `Internal Server Error ${upateWalletBalance.message}` });
                } else {
                    return res.json({
                        message: "Payement Successfully"
                    });       
                }
            } catch (error) {
                res.json({ status: 'error', message: `Internal Server Error ${error.message}` });
            }
            // Save Payment 
        } else {
            const payment = new TransactionModel({
                type: "Credit",
                status: "Failed",
                userId: decoded._id,
                paymentId: razorpay_payment_id,
                orderId: razorpay_order_id,
                amount: amount,
            });

            // Save Payment 
            await payment.save();

            return res.json({
                message: "Payement Failed"
            });
        }
    } catch (error) {
        res.json({ status: 'error', message: `Internal Server Error ${error.message}` });
    }

})

module.exports = { PaymentRouter };