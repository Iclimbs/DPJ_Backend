const router = require("express").Router();
const { CollabRouter } = require("../controller/collaboration");
const { EventRouter } = require("../controller/event");
const { JobRouter } = require("../controller/job");
const { PostRouter } = require("../controller/post");
const { TicketRouter } = require("../controller/ticket");
const { UserRouter } = require("../controller/user");
const { WalletRouter } = require("../controller/wallet");

router
    .use("/user", UserRouter)
    .use("/job", JobRouter)
    .use("/collaborator", CollabRouter)
    .use("/post", PostRouter)
    .use("/event", EventRouter)
    .use("/wallet", WalletRouter)
    .use("/tickets", TicketRouter)


module.exports = router;