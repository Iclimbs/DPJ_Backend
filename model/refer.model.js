const mongoose = require("mongoose");
const objectId = mongoose.Schema.Types.ObjectId;
const referschema = mongoose.Schema({
    userId: {
        type: objectId,
        required: true
    },
    referId: {
        type: String,
        required: true
    },
    registeredBy: {
        type: [objectId]
    },
    CreatedAt: { type: Date, default: Date.now }, // Save The Time When the following Job was created 

});
const ReferModel = mongoose.model("refer", referschema);
module.exports = { ReferModel };