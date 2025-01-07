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
        mediaType: req.file.mimetype.split("/")[0]
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
        const post = await PostModel.aggregate([{ $match: { _id: new mongoose.Types.ObjectId(id) } },{ $lookup: { from: 'comments', localField: '_id', foreignField: 'postId', as: 'comments' } }])
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

PostRouter.post("/edit/:id", uploadMiddleWare.single("media"), async (req, res) => {
    const { id } = req.params;
    try {
        const post = await PostModel.find({ _id: id });
        if (post.length == 0) {
            res.json({
                status: "error",
                message: "No Post Created By User",
            });
        } else {
            fs.unlink(`${uploadPath}/${post[0].media}`, (err) => {
                if (err) {
                    console.error('Error deleting old file:', err);
                } else {
                    console.log('Old file deleted successfully');
                }
            });
            post[0].description = req.body.description;
            post[0].media = req.file.filename;
            await post[0].save();
            res.json({
                status: "success",
                data: "Post Updated Successfully",
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

PostRouter.post("/edit/comment/:id", async (req, res) => {
    const { id } = req.params;
    const { description } = req.body;
    const comment = await CommentModel.findOne({ _id: id });
    if (comment.length == 0) {
        res.json({
            status: "error",
            message: "No Comment Found",
        });
    } else {
        comment.description = description;
        await comment.save();
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
        const comment = await CommentModel.find({ postId: id })
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
                    $match:
                    /**
                     * query: The query in MQL.
                     */
                    {
                        bookmarkedBy: "6752a004efaca432a3075c9c"
                    }
                },
                {
                    $lookup: {
                        from: "posts",
                        localField: "postId",
                        foreignField: "_id",
                        as: "result"
                    }
                }
            ])
        res.json({
            status: "success",
            data: bookmark,
        });


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
