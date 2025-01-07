const mongoose = require("mongoose");
const objectId = mongoose.Schema.Types.ObjectId;
const commentschema = mongoose.Schema({
    commentedBy: { // Save Detailed Description of Job & basic detail about the job
        type: objectId,
        required: true
    },
    description:{
        type: String,
        required: true
    },
    postId: { type: objectId, required: true }, // Save The Post ID for which this Post was Liked
    CreatedAt: { type: Date, default: Date.now }, // Save The Time When the following Job was created 

});
const CommentModel = mongoose.model("comment", commentschema);
module.exports = { CommentModel };