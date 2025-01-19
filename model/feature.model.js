const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const featureSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  status: {
    type: Boolean,
    required: true,
    default:true
  }
});
const FeaturesModel = mongoose.model('features', featureSchema);
module.exports = { FeaturesModel };