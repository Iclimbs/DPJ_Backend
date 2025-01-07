const mongoose = require("mongoose");
const objectId = mongoose.Schema.Types.ObjectId;
const postschema = mongoose.Schema({
    createdBy: { type: objectId, required: true }, // Save The Professional ID by whom this Job was ceated
    description: { // Save Detailed Description of Job & basic detail about the job
        type: String,
        required: true
    },
    media: { type: String, required: true },
    mediaType: { type: String, required: false },
    isVideo: { type: Boolean, default: false },
    CreatedAt: { type: Date, default: Date.now }, // Save The Time When the following Job was created 

});
const PostModel = mongoose.model("post", postschema);
module.exports = { PostModel };