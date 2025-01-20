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

SubscriptionRouter.get("/all", async (req, res) => {
    try {
        const subscriptions = await SubscriptionModel.find();
        res.json({ status: "success", data: subscriptions });
    } catch (error) {
        res.json({ status: "error", message: `Failed To Fetch Subscriptions ${error}` });
    }
})

SubscriptionRouter.get("/:id", async (req, res) => {
    try {
        const subscription = await SubscriptionModel.findById(req.params.id);
        res.json({ status: "success", data: subscription });
    } catch (error) {
        res.json({ status: "error", message: `Failed To Fetch Subscription ${error}` });
    }
});

SubscriptionRouter.patch("/:id", async (req, res) => {
    try {
        await SubscriptionModel.findByIdAndUpdate(req.params.id, req.body);
        res.json({ status: "success", message: "Subscription updated successfully" });
    } catch (error) {
        res.json({ status: "error", message: `Failed To Update Subscription ${error}` });
    }
})

module.exports = { SubscriptionRouter };
