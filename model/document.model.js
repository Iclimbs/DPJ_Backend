const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;
const documentschema = mongoose.Schema({
  document:{
    type:String,
    required:true
  },
  userId :{
    type:ObjectId,
    required:true
  },
  status:{
    type:String,
    default: "Pending",
    enum:["Pending","Approved","Rejected"]
  },
  message:{
    type:String,
    default:""
  },
  CreatedAt: { type: Date, default: Date.now },
});
const DocumentModel = mongoose.model("Documents", documentschema);
module.exports = { DocumentModel };