import { UserAuthentication } from "../middleware/Authentication";

const express = require("express");
const PaymentRouter = express.Router();
const Razorpay = require("razorpay");
const crypto = require("crypto");
const uniqid = require('uniqid');


const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

PaymentRouter.post("/checkout",UserAuthentication, async (req, res) => {
    const toke = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(toke, "Authentication");
    const { name, amount } = req.body;

    try {
        // Create an entry for razorpay
        const order = await razorpay.orders.create({
            amount: Number(amount*100),
            currency: "INR",
        });

        await orderModel.create({
            order_id: order.id,
            name: name,
            amount: amount,
        });

        return res.status(200).json({ order, message: `${amount} received` });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "something went wrong" });
    }
})

PaymentRouter.post("/verification", async (req, res) => { 

    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
    const body_data = razorpay_order_id + "|" + razorpay_payment_id;
    const expect = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(body_data).digest("hex");
    const isValid = expect === razorpay_signature;

    if (isValid) {
        await orderModel.findOneAndUpdate({ order_id: razorpay_order_id }, { $set: { razorpay_payment_id, razorpay_order_id, razorpay_signature } });
        res.redirect(`http://localhost:3000/success?payemnt_id=${razorpay_order_id}`);
        return;
    } else {
        res.redirect(`http://localhost:3000/failure?payemnt_id=${razorpay_order_id}`);
        return;
    }

 })

module.exports = { PaymentRouter };