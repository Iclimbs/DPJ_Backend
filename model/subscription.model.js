const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;
const subscriptionSchema = mongoose.Schema({
  featurelist: {
    type: [ObjectId],
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  accountType: {
    type: String,
    required: true,
    enum: ["artist", "professional"],
  },
  amount:{
    type: Number,
    required: true
  },
  CreatedAt: { type: Date, default: Date.now },
});

const SubscriptionModel = mongoose.model("plan", subscriptionSchema);
module.exports = { SubscriptionModel };
