const { UserAuthentication } = require("../middleware/Authentication");

const express = require("express");
const PaymentRouter = express.Router();
const Razorpay = require("razorpay");
const crypto = require("crypto");
const uniqid = require('uniqid');
const jwt = require("jsonwebtoken");
const { TransactionModel } = require("../model/transaction.model");


const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_SECRET,
});
console.log(process.env.RAZORPAY_KEY_ID, process.env.RAZORPAY_SECRET);


PaymentRouter.post("/checkout", UserAuthentication, async (req, res) => {
    const toke = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(toke, "Authentication");
    const { amount } = req.body;

    try {
        const options = {
            amount: Number(amount * 100),
            currency: "INR",
            receipt: crypto.randomBytes(10).toString("hex"),
        }

        razorpayInstance.orders.create(options, (error, order) => {
            if (error) {
                console.log(error);
                return res.json({ status: "error", message: "Something Went Wrong!" });
            }
            res.json({ status: "success", data: order });
            console.log(order)
        });
    } catch (error) {
        console.log(error);
        res.json({ status: "error", message: "Internal Server Error!" });
    }
})

PaymentRouter.post("/verification", async (req, res) => {

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    console.log("req.body", req.body);

    try {
        // Create Sign
        const sign = razorpay_order_id + "|" + razorpay_payment_id;

        // Create ExpectedSign
        const expectedSign = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET)
            .update(sign.toString())
            .digest("hex");

        // console.log(razorpay_signature === expectedSign);

        // Create isAuthentic
        const isAuthentic = expectedSign === razorpay_signature;

        // Condition 
        if (isAuthentic) {
            // const payment = new TransactionModel({
            //     type: "Credit",
            //     status: "Success",
            //     userId:razorpay_order_id,
            //     refNo:razorpay_payment_id,
            //     razorpay_signature,
            //     amount: 500,
            // });

            // // Save Payment 
            // await payment.save();

            // Send Message 
            res.json({
                message: "Payement Successfully"
            });
        }
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error!" });
        console.log(error);
    }

})

module.exports = { PaymentRouter };