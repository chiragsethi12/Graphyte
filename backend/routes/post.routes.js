import express from "express";
import {
    createPost,
    editPost,
    getFeed,
    getTrendingPosts,
    getPostById,
    likePost,
    commentOnPost,
    getComments,
    deleteComment,
    sharePost,
    deletePost,
} from "../controllers/post.controller.js";
import protect from "../middleware/auth.middleware.js";
import { upload, handleMulterError } from "../config/cloudinary.js";

const router = express.Router();

router.get("/feed",                      protect, getFeed);
router.get("/trending",                  protect, getTrendingPosts);
router.post("/create",                   protect, upload.single("image"), handleMulterError, createPost);
router.get("/:id",                       protect, getPostById);
router.put("/:id/like",                  protect, likePost);
router.post("/:id/comment",             protect, commentOnPost);
router.get("/:id/comments",             protect, getComments);
router.delete("/:id/comment/:commentId", protect, deleteComment);
router.post("/:id/share",               protect, sharePost);
router.patch("/:id",                    protect, editPost);
router.delete("/:id",                    protect, deletePost);

export default router;