import Report from "../models/Report.model.js";
import asyncHandler from "../utils/asyncHandler.js";

/**
 * POST /api/reports
 * Create a new report against a user, post, or comment.
 */
export const createReport = asyncHandler(async (req, res) => {
    const { reportedUser, reportedPost, reportedComment, reason } = req.body;

    if (!reason) {
        return res.status(400).json({ success: false, message: "Reason is required" });
    }

    const report = await Report.create({
        reporter: req.user._id,
        reportedUser: reportedUser || undefined,
        reportedPost: reportedPost || undefined,
        reportedComment: reportedComment || undefined,
        reason,
    });

    res.status(201).json({ success: true, report });
});
