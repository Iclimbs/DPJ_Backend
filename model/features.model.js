const mongoose = require("mongoose");
const featureSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  status: {
    type: Boolean,
    required: true,
    default: true,
  },
});
const FeatureModel = mongoose.model("FeaturedList", featureSchema);
module.exports = { FeatureModel };
