const mongoose = require("mongoose");
const ObjectId  = mongoose.Schema.Types.ObjectId;
const bookmarkschema = mongoose.Schema({
    bookmarkedBy: { // Save Detailed Description of Job & basic detail about the job
        type: ObjectId,
        required: true
    },
    postId: { type: ObjectId, required: true }, // Save The Post ID for which this Post was Liked
    CreatedAt: { type: Date, default: Date.now }, // Save The Time When the following Job was created 
});
const BookMarkModel = mongoose.model("bookmark", bookmarkschema);
module.exports = { BookMarkModel };