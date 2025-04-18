const router = require("express").Router();
const { CollabRouter } = require("../controller/collaboration");
const { EventRouter } = require("../controller/event");
const { JobRouter } = require("../controller/job");
const { PostRouter } = require("../controller/post");
const { TicketRouter } = require("../controller/ticket");
const { UserRouter } = require("../controller/user");
const { WalletRouter } = require("../controller/wallet");
const { ReviewRouter } = require("../controller/review");
const { SubscriptionRouter } = require("../controller/subscription");
const { FeatureRouter } = require("../controller/features");
const { PaymentRouter } = require("../controller/payment");
const ChatRouter = require("../controller/chat");
const { ReferRouter } = require("../controller/refer");
const { BankRouter } = require("../controller/bank");
const { WithDrawlRouter } = require("../controller/withdrawl");
const { CategoryRouter } = require("../controller/category");
const { GroupRouter } = require("../controller/group");
const { ProfessionalDetailsRouter } = require("../controller/professional");
const { PlatformCostRouter } = require("../controller/platformcost");

router
  .use("/user", UserRouter)
  .use("/job", JobRouter)
  .use("/collaborator", CollabRouter)
  .use("/post", PostRouter)
  .use("/event", EventRouter)
  .use("/wallet", WalletRouter)
  .use("/tickets", TicketRouter)
  .use("/review", ReviewRouter)
  .use("/subscription", SubscriptionRouter)
  .use("/features", FeatureRouter)
  .use("/payment", PaymentRouter)
  .use("/chat", ChatRouter)
  .use("/refer", ReferRouter)
  .use("/bank", BankRouter)
  .use("/withdrawl", WithDrawlRouter)
  .use("/category", CategoryRouter)
  .use("/group", GroupRouter)
  .use("/professional", ProfessionalDetailsRouter)
  .use("/ticketcost",PlatformCostRouter)


module.exports = router;
