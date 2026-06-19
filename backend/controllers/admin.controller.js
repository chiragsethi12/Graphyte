import asyncHandler from "../utils/asyncHandler.js";
import Report from "../models/Report.model.js";
import User from "../models/User.model.js";

// GET /api/admin/reports
export const getPendingReports = asyncHandler(async (req, res) => {
    const reports = await Report.find({ status: "pending" })
        .populate("reporter", "name username email")
        .populate("reportedUser", "name username email")
        .populate("reportedPost", "content image")
        .populate("reportedComment", "text")
        .sort({ createdAt: -1 });

    res.json({ success: true, reports });
});

// PATCH /api/admin/reports/:id
export const updateReportStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    if (!["resolved", "dismissed"].includes(status)) {
        return res.status(400).json({ success: false, message: "Invalid status value. Must be resolved or dismissed." });
    }

    const report = await Report.findById(req.params.id);
    if (!report) {
        return res.status(404).json({ success: false, message: "Report not found" });
    }

    report.status = status;
    await report.save();

    res.json({ success: true, report });
});

// PUT /api/admin/users/:id/suspend
export const suspendUser = asyncHandler(async (req, res) => {
    const { isSuspended } = req.body;
    const suspendValue = isSuspended !== undefined ? Boolean(isSuspended) : true;

    const user = await User.findById(req.params.id);
    if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
    }

    // Admins/moderators cannot suspend themselves
    if (user._id.toString() === req.user._id.toString()) {
        return res.status(400).json({ success: false, message: "You cannot suspend your own account" });
    }

    user.isSuspended = suspendValue;
    
    // Invalidate user's token session by incrementing tokenVersion on suspension so any current JWT is immediately rejected
    if (suspendValue) {
        user.tokenVersion = (user.tokenVersion || 0) + 1;
    }

    await user.save();

    res.json({ 
        success: true, 
        message: `User account has been successfully ${suspendValue ? "suspended" : "reactivated"}`,
        user: {
            _id: user._id,
            name: user.name,
            username: user.username,
            isSuspended: user.isSuspended,
            tokenVersion: user.tokenVersion
        }
    });
});
