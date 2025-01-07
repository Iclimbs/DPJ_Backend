// Basic Required Modules
const express = require("express");
const jwt = require("jsonwebtoken");

// Basic Model Imports
const { PostModel, CommentModel, BookMarkModel } = require("../model/ModelExport");

// Basic Middleware Imports
const { ArtistAuthentication, AdminAuthentication, uploadMiddleWare } = require("../middleware/MiddlewareExport");
const { default: mongoose } = require("mongoose");

const PostRouter = express.Router();

// Api's For Post 

// Api To Add New Post
PostRouter.post("/add", uploadMiddleWare.single("media"), ArtistAuthentication, async (req, res) => {
    if (!req?.file) {
        res.json({ status: "error", message: `Please Upload Image Or Video For Post` });
    }
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, "Authentication");
    const { description } = req.body;
    const post = new PostModel({
        media: req.file.location,
        description: description,
        createdBy: decoded._id,
        mediaType: req.file.mimetype.split("/")[0],
        isVideo: req.file.mimetype.split("/")[0] == "video" ? true : false,

    });
    try {
        await post.save();
        res.json({
            status: "success",
            message: `Post Created Successfully`,
        });
    } catch (error) {
        res.json({
            status: "error",
            message: `Failed To Add  ${error.message}`,
        });
    }
}
);

// Api To Get All Post List Created By User
PostRouter.get("/listall", ArtistAuthentication, async (req, res) => {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, "Authentication");
    try {
        const result = await PostModel.find({ createdBy: decoded._id });
        if (result.length == 0) {
            res.json({
                status: "error",
                message: "No Post Created By User",
            });
        } else {
            res.json({
                status: "success",
                data: result,
            });
        }
    } catch (error) {
        res.json({
            status: "error",
            message: `Failed To Get Post Detail's ${error.message}`,
        });
    }
}
);

// Api To Get All Detail Of A Particular Post Created By User

PostRouter.get("/details/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const post = await PostModel.aggregate([{ $match: { _id: new mongoose.Types.ObjectId(id) } }, { $lookup: { from: 'comments', localField: '_id', foreignField: 'postId', as: 'comments' } }])
        if (post.length == 0) {
            res.json({
                status: "error",
                message: "No Post Created By User",
            });
        } else {
            res.json({
                status: "success",
                data: post
            });
        }
    } catch (error) {
        res.json({
            status: "error",
            message: `Failed To Get Details Of A Particular Event ${error.message}`,
        });
    }
}
);

// Api To Edit Detail's Of A Particular Post Created By User

PostRouter.patch("/edit/:id", uploadMiddleWare.single("media"), async (req, res) => {
    const { id } = req.params;

    try {
        const post = await PostModel.find({ _id: id });
        if (post.length == 0) {
            res.json({
                status: "error",
                message: "No Post Created By User",
            });
        } else {
            let isVideovalue;
            if (req.file) {
                isVideovalue = req.file?.mimetype.split("/")[0] == "video" ? true : false
            } else {
                isVideovalue = post[0].isVideo;
            }
            console.log("isvideo value ", isVideovalue);

            const updatedPost = {
                ...req.body, description: req.body?.description || post[0].description, media: req.file?.location || post[0].media, mediaType: req.file?.mimetype.split("/")[0] || post[0].mimetype, isVideo: isVideovalue
            }
            const newpost = await PostModel.findByIdAndUpdate(id, updatedPost, {
                new: true, // Return the updated document
            });
            res.json({
                status: "success",
                message: "Post Updated Successfully",
            });
        }
    } catch (error) {
        res.json({
            status: "error",
            message: `Failed To Update Event Details ${error.message}`,
        });
    }
}
);

// Api To Get All Post List Created By All The USER

PostRouter.get("/listall/admin", AdminAuthentication, async (req, res) => {
    try {
        const result = await PostModel.find({}).sort({ createdAt: -1 });
        if (result.length == 0) {
            res.json({
                status: "error",
                message: "No Post Created By User",
            });
        } else {
            res.json({
                status: "success",
                data: result,
            });
        }
    } catch (error) {
        res.json({
            status: "error",
            message: `Failed To Get Post Detail's ${error.message}`,
        });
    }
}
);


// Api's For Comment 

// Api To Add New Comment In a Particular Post

PostRouter.post("/add/comment/:id", ArtistAuthentication, async (req, res) => {
    const { id } = req.params;
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, "Authentication");
    const { description } = req.body;
    const comment = new CommentModel({
        commentedBy: decoded._id,
        description: description,
        postId: id,
        name: decoded.name,
        profile: decoded.profile,
        accountType: decoded.accountType,
        email: decoded.email,
    });
    try {
        await comment.save();
        res.json({
            status: "success",
            message: `Added Comment Successfully`,
        });
    } catch (error) {
        res.json({
            status: "error",
            message: `Failed To Add New Comment ${error.message}`,
        });
    }
}
);

// Api To Edit A particular Comment

PostRouter.patch("/edit/comment/:id", async (req, res) => {

    const { id } = req.params;
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, "Authentication");
    const commentDetails = await CommentModel.find({ _id: id, commentedBy: decoded._id });
    if (commentDetails.length == 0) {
        res.json({
            status: "error",
            message: "No Comment Found",
        });
    } else {
        const updatedData = { ...req.body, description: req.body?.description || comment[0].description };
        const updatedComment = await CommentModel.findByIdAndUpdate(id, updatedData, { new: true });
        res.json({
            status: "success",
            message: `Comment Updated Successfully`,
        });
    }
}
);

// Api To Get List Of All Comment in An Post

PostRouter.get("/list/comments/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const comment = await CommentModel.aggregate([{ $match: { postId: new mongoose.Types.ObjectId(id) } }]);
        if (comment.length == 0) {
            res.json({
                status: "error",
                message: "No Comment Found",
            });
        } else {
            res.json({
                status: "success",
                data: comment,
            });
        }
    } catch (error) {
        res.json({
            status: "error",
            message: `Failed To Add New Comment ${error.message}`,
        });
    }
}
);



// Api's For Bookmark

// Api To Add OR Remove Bookmark

PostRouter.post("/add/bookmark/:id", async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, "Authentication");
    try {
        const bookmark = await BookMarkModel.find({ postId: id })
        if (bookmark.length == 0) {
            if (status == true) {
                const bookmark = new BookMarkModel({
                    bookmarkedBy: decoded._id,
                    postId: id,
                });

                await bookmark.save();
                res.json({
                    status: "success",
                    message: `Added Bookmark Successfully`,
                })
            }
        } else {
            if (status == false) {
                const bookmark = await BookMarkModel.deleteOne({
                    postId: id,
                });
                res.json({
                    status: "success",
                    message: `Bookmark Successfully Removed`,
                })
            }
        }
    } catch (error) {
        res.json({
            status: "error",
            message: `Failed To Add New Comment ${error.message}`,
        });
    }
}
);


// Api To Get List Of All Bookmark List Of A Particular User

PostRouter.get("/listall/bookmark", async (req, res) => {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, "Authentication");
    try {
        const bookmark = await BookMarkModel.aggregate(
            [
                {
                    $match: { bookmarkedBy: new mongoose.Types.ObjectId(decoded._id) }
                },
                {
                    $lookup: {
                        from: "posts",
                        localField: "postId",
                        foreignField: "_id",
                        as: "post"
                    }
                }
            ])
        if (bookmark.length == 0) {
            res.json({
                status: "error",
                message: "No Bookmark Found",
            });
        } else {
            res.json({
                status: "success",
                data: bookmark,
            });
        }
    } catch (error) {
        res.json({
            status: "error",
            message: `Failed To Get List Of All Bookmarks ${error.message}`,
        });
    }
}
);


// Api's For Like






module.exports = { PostRouter };
