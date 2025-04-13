const { BookedTicketModel } = require("./bookedticket.model");
const { BookMarkModel } = require("./bookmark.model");
const { CollabModel } = require("./collaboration.model");
const { CommentModel } = require("./comment.model");
const { DocumentModel } = require("./document.model");
const { EventModel } = require("./event.model");
const { JobModel } = require("./job.model");
const { JobAppliedModel } = require("./jobapplied.model");
const { LikeModel } = require("./like.model");
const { PostModel } = require("./post.model");
const { TicketModel } = require("./ticket.model");
const { TransactionModel } = require("./transaction.model");
const { UserModel } = require("./user.model");
const { WalletModel } = require("./wallet.model");
const { ReviewModel } = require("./review.model");
const { FollowModel } = require("./follow.model");
const { FeaturesModel } = require("./feature.model");
const { SubscriptionModel } = require("./subscription.model");
const { ForgotPasswordModel } = require("./forgotPassword.model");
const { SubscriptionLogs } = require("./subscription.log.model")
const { ReferModel } = require("./refer.model")
const { BankAccountModel } = require("./bankdetails.model")
const { WithDrawalModel } = require("./withdrawl.model")
const { CategoryModel } = require("./category.model")
const { OtpModel } = require("./otp.model")
const { EnquiryModel } = require("./enquiry.model")
const {GroupModel} = require("./group.model");
const { PlatformCostModel } = require("./platformcost.model");

module.exports = {
  GroupModel,
  EnquiryModel,
  OtpModel,
  BookedTicketModel,
  BookMarkModel,
  BookMarkModel,
  CollabModel,
  CommentModel,
  DocumentModel,
  EventModel,
  JobModel,
  JobAppliedModel,
  LikeModel,
  PostModel,
  TicketModel,
  TransactionModel,
  UserModel,
  WalletModel,
  ReviewModel,
  FollowModel,
  FeaturesModel,
  SubscriptionModel,
  ForgotPasswordModel,
  SubscriptionLogs,
  ReferModel,
  BankAccountModel,
  WithDrawalModel,
  CategoryModel,
  PlatformCostModel
};
