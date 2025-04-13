const mongoose = require("mongoose");

const platformcostschema = mongoose.Schema({
    cost:{
        type:Number,
        required:true
    },
    CreatedAt: { type: Date, default: Date.now }, // Save The Time When the following Job was created 

});
const PlatformCostModel = mongoose.model("PlatformCost", platformcostschema);
module.exports = { PlatformCostModel };