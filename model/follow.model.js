const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;
const Followchema = mongoose.Schema({
  followedBy: {
    // Save Detailed Description of Users Who Follow a Particular User
    type: [ObjectId],
    required: true,
  },
  userId: { type: ObjectId, required: true }, // Save The Post ID for which this Post was Liked
  CreatedAt: { type: Date, default: Date.now }, // Save The Time When the following Job was created
});
const FollowModel = mongoose.model("followers", Followchema);
module.exports = { FollowModel };
