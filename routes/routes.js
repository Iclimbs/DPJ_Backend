const router = require("express").Router();
const { CollabRouter } = require("../controller/collaboration");
const { EventRouter } = require("../controller/event");
const { JobRouter } = require("../controller/job");
const { PostRouter } = require("../controller/post");
const { UserRouter } = require("../controller/user");

router
    .use("/user", UserRouter)
    .use("/job", JobRouter)
    .use("/collaborator", CollabRouter)
    .use("/post", PostRouter)
    .use("event", EventRouter)


module.exports = router;