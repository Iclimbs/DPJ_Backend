const mongoose = require('mongoose')
const ObjectId = mongoose.Schema.Types.ObjectId
const subscriptionlogs = mongoose.Schema({
userId:{
  type:ObjectId,
  required:true
},
planId:{
  type:ObjectId,
  required:true
},
purchaseDate:{
  type:String,
  required:true
},
expireDate:{
  type:String,
  required:true
},
CreatedAt: { type: Date, default: Date.now }
})

const SubscriptionLogs = mongoose.model("subscriptionlogs",subscriptionlogs)

module.exports={SubscriptionLogs}
