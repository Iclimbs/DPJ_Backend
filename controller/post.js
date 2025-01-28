// Basic Required Modules
const express = require("express");
const jwt = require("jsonwebtoken");

// Basic Model Imports
const {
  PostModel,
  CommentModel,
  BookMarkModel,
  UserModel,
  LikeModel,
} = require("../model/ModelExport");

// Basic Middleware Imports
const {
  AdminAuthentication,
  uploadMiddleWare,
  UserAuthentication,
  PostCreationChecker,
} = require("../middleware/MiddlewareExport");
const { default: mongoose } = require("mongoose");

const PostRouter = express.Router();

// Api's For Post

// Api To Add New Post
PostRouter.post(
  "/add",
  [PostCreationChecker, UserAuthentication, uploadMiddleWare.single("media")],
  async (req, res) => {
    if (!req?.file) {
      return res.json({
        status: "error",
        message: `Please Upload Image Or Video For Post`,
      });
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
      return res.json({
        status: "success",
        message: `Post Created Successfully`,
      });
    } catch (error) {
      return res.json({
        status: "error",
        message: `Failed To Add  ${error.message}`,
      });
    }
  },
);

// Api To Get All Post List Created By User
PostRouter.get("/listall", UserAuthentication, async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "Authentication");
  try {
    const result = await PostModel.aggregate([
      {
        $match: {
          createdBy: new mongoose.Types.ObjectId(decoded._id),
          disabled: false,
        },
      },
      {
        $lookup: {
          from: "comments",
          localField: "_id",
          foreignField: "postId",
          as: "comments",
        },
      },
      { $sort: { CreatedAt: -1 } },
    ]);
    if (result.length == 0) {
      return res.json({
        status: "error",
        message: "No Post Created By User",
      });
    } else {
      return res.json({
        status: "success",
        data: result,
      });
    }
  } catch (error) {
    return res.json({
      status: "error",
      message: `Failed To Get Post Detail's ${error.message}`,
    });
  }
});

// Api To Get All Detail Of A Particular Post Created By User

PostRouter.get(
  "/details/:id",
  [UserAuthentication, PostCreationChecker],
  async (req, res) => {
    const { id } = req.params;
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, "Authentication");

    try {
      const post = await PostModel.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(id), disabled: false } },
        {
          $lookup: {
            from: "comments",
            localField: "_id",
            foreignField: "postId",
            as: "comments",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "createdBy",
            foreignField: "_id",
            as: "userdetails",
            pipeline: [
              {
                $project: {
                  _id: 1,
                  name: 1,
                  email: 1,
                  category: 1,
                  profile: 1,
                },
              },
            ],
          },
        },
        {
          $lookup: {
            from: "bookmarks",
            localField: "_id",
            foreignField: "postId",
            as: "bookmarks",
          },
        },
        {
          $addFields: {
            bookmark: {
              $in: [
                new mongoose.Types.ObjectId(decoded._id),
                "$bookmarks.bookmarkedBy",
              ],
            },
          },
        },
        {
          $lookup: {
            from: "followers",
            localField: "createdBy",
            foreignField: "userId",
            as: "followerlist",
          },
        },
        {
          $addFields: {
            followstatus: {
              $in: [
                new mongoose.Types.ObjectId(decoded._id),
                {
                  $reduce: {
                    input: "$followerlist",
                    initialValue: [],
                    in: { $concatArrays: ["$$value", "$$this.followedBy"] }, // Flatten the likedBy arrays
                  },
                },
              ],
            },
          },
        },
        {
          $lookup: {
            from: "likes",
            localField: "_id",
            foreignField: "postId",
            as: "like",
          },
        },
        {
          $addFields: {
            likestatus: {
              $in: [
                new mongoose.Types.ObjectId(decoded._id),
                {
                  $reduce: {
                    input: "$like",
                    initialValue: [],
                    in: { $concatArrays: ["$$value", "$$this.likedBy"] }, // Flatten the likedBy arrays
                  },
                },
              ],
            },
          },
        },
        {
          $project: { followerlist: 0 },
        },
        { $sort: { CreatedAt: -1 } },
      ]);
      if (post.length == 0) {
        return res.json({
          status: "error",
          message: "No Post Created By User",
        });
      } else {
        return res.json({
          status: "success",
          data: post,
        });
      }
    } catch (error) {
      return res.json({
        status: "error",
        message: `Failed To Get Details Of A Particular Event ${error.message}`,
      });
    }
  },
);

// Api To Edit Detail's Of A Particular Post Created By User

PostRouter.patch(
  "/edit/:id",
  [PostCreationChecker, UserAuthentication, uploadMiddleWare.single("media")],
  async (req, res) => {
    const { id } = req.params;
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, "Authentication");

    try {
      const post = await PostModel.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(id),
            createdBy: new mongoose.Types.ObjectId(decoded._id),
            disabled: false,
          },
        },
      ]);
      if (post.length == 0) {
        return res.json({
          status: "error",
          message: "No Post Created By User",
        });
      } else {
        let isVideovalue;
        if (req.file) {
          isVideovalue =
            req.file?.mimetype.split("/")[0] == "video" ? true : false;
        } else {
          isVideovalue = post[0].isVideo;
        }

        const updatedPost = {
          ...req.body,
          description: req.body?.description || post[0].description,
          media: req.file?.location || post[0].media,
          mediaType: req.file?.mimetype.split("/")[0] || post[0].mimetype,
          isVideo: isVideovalue,
        };
        const newpost = await PostModel.findByIdAndUpdate(id, updatedPost, {
          new: true, // Return the updated document
        });
        return res.json({
          status: "success",
          message: "Post Updated Successfully",
        });
      }
    } catch (error) {
      return res.json({
        status: "error",
        message: `Failed To Update Event Details ${error.message}`,
      });
    }
  },
);

// Api To Get All Post List For Admin

PostRouter.get("/listall/admin", AdminAuthentication, async (req, res) => {
  try {
    const result = await PostModel.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          pipeline: [
            {
              $project: { _id: 1, name: 1, email: 1, profile: 1, category: 1 },
            },
          ],
          as: "userdetails",
        },
      },
      {
        $lookup: {
          from: "comments",
          localField: "_id",
          foreignField: "postId",
          pipeline: [{ $project: { postId: 0, CreatedAt: 0, __v: 0 } }],
          as: "comments",
        },
      },
      { $sort: { CreatedAt: -1 } },
    ]);

    if (result.length == 0) {
      return res.json({
        status: "error",
        message: "No Post Created By User",
      });
    } else {
      return res.json({
        status: "success",
        data: result,
      });
    }
  } catch (error) {
    return res.json({
      status: "error",
      message: `Failed To Get Post Detail's ${error.message}`,
    });
  }
});

// Api To Get Full Detail Of A Particular Post Created By User For Admin

PostRouter.get(
  "/detailone/admin/:id",
  AdminAuthentication,
  async (req, res) => {
    try {
      const result = await PostModel.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(req.params.id) } },
        {
          $lookup: {
            from: "users",
            localField: "createdBy",
            foreignField: "_id",
            pipeline: [
              {
                $project: {
                  _id: 1,
                  name: 1,
                  email: 1,
                  profile: 1,
                  category: 1,
                },
              },
            ],
            as: "userdetails",
          },
        },
        {
          $lookup: {
            from: "comments",
            localField: "_id",
            foreignField: "postId",
            pipeline: [{ $project: { postId: 0, CreatedAt: 0, __v: 0 } }],
            as: "comments",
          },
        },
        { $sort: { CreatedAt: -1 } },
      ]);

      if (result.length == 0) {
        return res.json({
          status: "error",
          message: "No Post Created By User",
        });
      } else {
        return res.json({
          status: "success",
          data: result,
        });
      }
    } catch (error) {
      return res.json({
        status: "error",
        message: `Failed To Get Post Detail's ${error.message}`,
      });
    }
  },
);

// Api To Disable A Particular Post Created By User Only For Admin

PostRouter.patch(
  "/disable/admin/:id",
  AdminAuthentication,
  async (req, res) => {
    const { id } = req.params;
    try {
      const post = await PostModel.findByIdAndUpdate(id, { disabled: true });
      return res.json({
        status: "success",
        message: "Post Disabled Successfully",
      });
    } catch (error) {
      return res.json({
        status: "error",
        message: `Failed To Disable Event ${error.message}`,
      });
    }
  },
);

// Api To Enable A Particular Post Created By User Only For Admin

PostRouter.patch("/enable/admin/:id", AdminAuthentication, async (req, res) => {
  const { id } = req.params;
  try {
    const post = await PostModel.findByIdAndUpdate(id, { disabled: false });
    return res.json({
      status: "success",
      message: "Post Enabled Successfully",
    });
  } catch (error) {
    return res.json({
      status: "error",
      message: `Failed To Enable Event ${error.message}`,
    });
  }
});

// Api's For Comment

// Api To Add New Comment In a Particular Post

PostRouter.post("/add/comment/:id", UserAuthentication, async (req, res) => {
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
    return res.json({
      status: "success",
      message: `Added Comment Successfully`,
    });
  } catch (error) {
    return res.json({
      status: "error",
      message: `Failed To Add New Comment ${error.message}`,
    });
  }
});

// Api To Edit A particular Comment

PostRouter.patch("/edit/comment/:id", UserAuthentication, async (req, res) => {
  const { id } = req.params;
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "Authentication");
  const commentDetails = await CommentModel.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(id),
        commentedBy: new mongoose.Types.ObjectId(decoded._id),
      },
    },
  ]);
  if (commentDetails.length == 0) {
    return res.json({
      status: "error",
      message: "No Comment Found",
    });
  } else {
    const updatedData = {
      ...req.body,
      description: req.body?.description || commentDetails[0].description,
    };
    const updatedComment = await CommentModel.findByIdAndUpdate(
      id,
      updatedData,
      { new: true },
    );
    return res.json({
      status: "success",
      message: `Comment Updated Successfully`,
    });
  }
});

// Api To Get List Of All Comment in An Post

PostRouter.get("/list/comments/:id", UserAuthentication, async (req, res) => {
  const { id } = req.params;
  try {
    const comment = await CommentModel.aggregate([
      { $match: { postId: new mongoose.Types.ObjectId(id) } },
    ]);
    if (comment.length == 0) {
      return res.json({
        status: "error",
        message: "No Comment Found",
      });
    } else {
      return res.json({
        status: "success",
        data: comment,
      });
    }
  } catch (error) {
    return res.json({
      status: "error",
      message: `Failed To Add New Comment ${error.message}`,
    });
  }
});

// Api's For Bookmark

// Api To Add OR Remove Bookmark

PostRouter.post("/add/bookmark/:id", UserAuthentication, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "Authentication");

  try {
    const bookmark = await BookMarkModel.find({ postId: id });

    if (bookmark.length == 0) {
      if (status == true) {
        const bookmark = new BookMarkModel({
          bookmarkedBy: decoded._id,
          postId: id,
        });

        await bookmark.save();
        return res.json({
          status: "success",
          message: `Added Bookmark Successfully`,
        });
      }
    } else {
      if (status == false) {
        const bookmark = await BookMarkModel.deleteOne({
          postId: id,
        });

        return res.json({
          status: "success",
          message: `Bookmark Successfully Removed`,
        });
      }
    }
  } catch (error) {
    return res.json({
      status: "error",
      message: `Failed To Add New Comment ${error.message}`,
    });
  }
});

// Api To Get List Of All Bookmark List Of A Particular User

PostRouter.get("/listall/bookmark", UserAuthentication, async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "Authentication");
  try {
    const bookmark = await BookMarkModel.aggregate([
      {
        $match: { bookmarkedBy: new mongoose.Types.ObjectId(decoded._id) },
      },
      {
        $lookup: {
          from: "posts",
          localField: "postId",
          foreignField: "_id",
          pipeline: [
            {
              $addFields: { bookmark: true },
            },
            {
              $lookup: {
                from: "users",
                localField: "createdBy",
                foreignField: "_id",
                as: "userdetails",
                pipeline: [
                  {
                    $project: {
                      _id: 1,
                      name: 1,
                      email: 1,
                      category: 1,
                      profile: 1,
                    },
                  },
                ],
              },
            },
          ],
          as: "post",
        },
      },
      {
        $sort: { CreatedAt: -1 },
      },
    ]);
    if (bookmark.length == 0) {
      return res.json({
        status: "error",
        message: "No Bookmark Found",
      });
    } else {
      return res.json({
        status: "success",
        data: bookmark,
      });
    }
  } catch (error) {
    return res.json({
      status: "error",
      message: `Failed To Get List Of All Bookmarks ${error.message}`,
    });
  }
});

// Api's For Live Post Feed
PostRouter.get("/listall/live", UserAuthentication, async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "Authentication");

  try {
    const result = await PostModel.aggregate([
      { $match: { disabled: false } },
      {
        $lookup: {
          from: "comments",
          localField: "_id",
          foreignField: "postId",
          as: "comments",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "userdetails",
          pipeline: [
            {
              $project: { _id: 1, name: 1, email: 1, category: 1, profile: 1 },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "bookmarks",
          localField: "_id",
          foreignField: "postId",
          as: "bookmarks",
        },
      },
      {
        $addFields: {
          bookmark: {
            $in: [
              new mongoose.Types.ObjectId(decoded._id),
              "$bookmarks.bookmarkedBy",
            ],
          },
        },
      },
      {
        $lookup: {
          from: "followers",
          localField: "createdBy",
          foreignField: "userId",
          as: "followerlist",
        },
      },
      {
        $addFields: {
          followstatus: {
            $in: [
              new mongoose.Types.ObjectId(decoded._id),
              {
                $reduce: {
                  input: "$followerlist",
                  initialValue: [],
                  in: { $concatArrays: ["$$value", "$$this.followedBy"] }, // Flatten the likedBy arrays
                },
              },
            ],
          },
        },
      },
      {
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "postId",
          as: "like",
        },
      },
      {
        $addFields: {
          likestatus: {
            $in: [
              new mongoose.Types.ObjectId(decoded._id),
              {
                $reduce: {
                  input: "$like",
                  initialValue: [],
                  in: { $concatArrays: ["$$value", "$$this.likedBy"] }, // Flatten the likedBy arrays
                },
              },
            ],
          },
        },
      },
      { $sort: { CreatedAt: -1 } },
      { $project: { followerlist: 0 } },
    ]);
    if (result.length == 0) {
      return res.json({
        status: "error",
        message: "No Live Post Found",
      });
    } else {
      return res.json({
        status: "success",
        data: result,
      });
    }
  } catch (error) {
    return res.json({
      status: "error",
      message: `Failed To Get Live Post Feed's ${error.message}`,
    });
  }
});

// Api's For Live Post Feed For Admin
PostRouter.get("/listall/admin/live", AdminAuthentication, async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "Authentication");

  try {
    const result = await PostModel.aggregate([
      { $match: { disabled: false } },
      {
        $lookup: {
          from: "comments",
          localField: "_id",
          foreignField: "postId",
          as: "comments",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "userdetails",
          pipeline: [
            {
              $project: { _id: 1, name: 1, email: 1, category: 1, profile: 1 },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "postId",
          pipeline: [
            { $unwind: "$likedBy" },
            {
              $lookup: {
                from: "users",
                localField: "likedBy",
                foreignField: "_id",
                pipeline: [
                  {
                    $project: {
                      _id: 1,
                      name: 1,
                      email: 1,
                      category: 1,
                      profile: 1,
                    },
                  },
                ],
                as: "userlist",
              },
            },
          ],
          as: "like",
        },
      },
      { $sort: { CreatedAt: -1 } },
      { $project: { followerlist: 0, disabled: 0 } },
    ]);
    if (result.length == 0) {
      return res.json({
        status: "error",
        message: "No Live Post Found",
      });
    } else {
      return res.json({
        status: "success",
        data: result,
      });
    }
  } catch (error) {
    return res.json({
      status: "error",
      message: `Failed To Get Live Post Feed's ${error.message}`,
    });
  }
});

// Api's For Post Search Not In Use
PostRouter.get("/find", UserAuthentication, async (req, res) => {
  const { search } = req.query;
  const regex = new RegExp(search, "i");

  try {
    let result = {};
    const postResult = await PostModel.aggregate([
      {
        $match: {
          $or: [{ description: { $regex: regex } }],
          disabled: false,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          pipeline: [
            {
              $project: { _id: 1, name: 1, email: 1, category: 1, profile: 1 },
            },
          ],
          as: "professionaldetails",
        },
      },
    ]);

    const userResult = await UserModel.aggregate([
      {
        $match: {
          $or: [{ name: { $regex: regex } }, { category: { $regex: regex } }],
        },
      },
      {
        $lookup: {
          from: "posts",
          localField: "_id",
          foreignField: "createdBy",
          as: "posts",
        },
      },
    ]);
    result.post = postResult;
    result.user = userResult;
    return res.json({
      status: "success",
      data: result,
    });
  } catch (error) {
    return res.json({
      status: "error",
      message: `Failed To Get Live Post Feed's ${error.message}`,
    });
  }
});

// Api's For Post Like By User
PostRouter.get("/like", UserAuthentication, async (req, res) => {
  const { postId, status } = req.query;
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "Authentication");
  try {
    const postResult = await LikeModel.aggregate([
      { $match: { postId: new mongoose.Types.ObjectId(postId) } },
    ]);
    if (postResult.length == 0) {
      if (status == "false") {
        return res.json({
          status: "error",
          message: "No Like Found",
        });
      } else {
        const like = new LikeModel({
          likedBy: decoded._id,
          postId: postId,
        });
        await like.save();
        return res.json({
          status: "success",
          message: `Post Liked Successfully`,
        });
      }
    } else {
      const likeResult = await LikeModel.aggregate([
        {
          $match: {
            postId: new mongoose.Types.ObjectId(postId),
            likedBy: {
              $elemMatch: { $eq: new mongoose.Types.ObjectId(decoded._id) },
            },
          },
        },
      ]);

      if (likeResult.length > 0) {
        if (status == "false") {
          const like = await LikeModel.updateOne(
            { postId: new mongoose.Types.ObjectId(postId) },
            { $pull: { likedBy: new mongoose.Types.ObjectId(decoded._id) } }, // Add ObjectId to the array
          );
          return res.json({
            status: "success",
            message: "Post Disliked Successfully",
          });
        } else {
          return res.json({
            status: "success",
            message: "Post Already Liked",
          });
        }
      } else {
        if (status == "false") {
          return res.json({
            status: "success",
            message: "Post Already Disliked",
          });
        } else {
          const like = await LikeModel.updateOne(
            { postId: new mongoose.Types.ObjectId(postId) },
            { $push: { likedBy: new mongoose.Types.ObjectId(decoded._id) } }, // Add ObjectId to the array
          );
          return res.json({
            status: "success",
            message: "Post Liked Successfully",
          });
        }
      }
    }
  } catch (error) {
    return res.json({
      status: "error",
      message: `Failed To Get Live Post Feed's ${error.message}`,
    });
  }
});

module.exports = { PostRouter };
