import asyncHandler from "../utils/asyncHandler.js";
import SavedPost from "../models/SavedPost.model.js";

// ─── Save Post ───────────────────────────────────────────────────────────────

export const savePost = asyncHandler(async (req, res) => {
    const { postId } = req.params;

    await SavedPost.create({ user: req.user._id, post: postId });

    res.status(201).json({ success: true, saved: true });
});

// ─── Unsave Post ─────────────────────────────────────────────────────────────

export const unsavePost = asyncHandler(async (req, res) => {
    const { postId } = req.params;

    const deleted = await SavedPost.findOneAndDelete({
        user: req.user._id,
        post: postId,
    });

    if (!deleted) {
        return res.status(404).json({ success: false, message: "Saved post not found" });
    }

    res.json({ success: true, saved: false });
});

// ─── Get Saved Posts ─────────────────────────────────────────────────────────

export const getSaved = asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit) || 12;
    const cursor = req.query.cursor || null;

    const filter = { user: req.user._id };
    if (cursor) {
        filter.savedAt = { $lt: new Date(cursor) };
    }

    const savedPosts = await SavedPost.find(filter)
        .sort({ savedAt: -1 })
        .limit(limit + 1)
        .populate({
            path: "post",
            populate: { path: "author", select: "name profilePic headline username" },
        })
        .lean();

    const hasMore = savedPosts.length > limit;
    if (hasMore) savedPosts.pop();
    const nextCursor = hasMore ? savedPosts[savedPosts.length - 1].savedAt.toISOString() : null;

    res.json({ success: true, savedPosts, hasMore, nextCursor });
});
