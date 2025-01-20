const express = require("express");
const SubscriptionRouter = express.Router();
const { SubscriptionModel } = require("../model/ModelExport");

SubscriptionRouter.post("/create", async (req, res) => {
    try {
        const subscription = new SubscriptionModel(req.body);
        await subscription.save();
        res.json({ status: "success", message: "Subscription created successfully" });
    } catch (error) {
        res.json({ status: "error", message: `Failed To Create New Subscription${error}` });
    }
})

module.exports = { SubscriptionRouter };
