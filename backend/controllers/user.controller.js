import asyncHandler from "../utils/asyncHandler.js";
import User from "../models/User.model.js";
import Post from "../models/Post.model.js";
import bcrypt from "bcryptjs";
import Comment from "../models/Comment.model.js";
import Connection from "../models/Connection.model.js";
import Message from "../models/Message.model.js";
import Notification from "../models/Notification.model.js";
import SavedPost from "../models/SavedPost.model.js";
import escapeRegex from "../utils/escapeRegex.js";

// ─── GET /api/users/:identifier ─────────────────────────────────────────────
export const getUserProfile = asyncHandler(async (req, res) => {
    const { identifier } = req.params;
    const isObjectId = /^[a-f\d]{24}$/i.test(identifier);
    const query = isObjectId ? { _id: identifier } : { username: identifier };

    const user = await User.findOne(query)
        .select("-password -resetPasswordToken -resetPasswordExpires")
        .populate("connections", "name profilePic headline username location")
        .populate("profileViewHistory.viewerId", "name profilePic username");

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const isOwner = req.user._id.toString() === user._id.toString();

    if (!isOwner) {
        // Track profile view (single atomic operation)
        await User.findByIdAndUpdate(user._id, {
            $inc: { profileViews: 1 },
            $push: {
                profileViewHistory: {
                    $each: [{ viewerId: req.user._id, viewedAt: new Date() }],
                    $slice: -100,
                },
            },
        });

        // Private profile gating — return restricted payload if not connected
        if (user.isPublic === false) {
            const isConnected = user.connections.some(
                (conn) => conn._id.toString() === req.user._id.toString()
            );
            if (!isConnected) {
                return res.json({
                    success: true,
                    isPrivate: true,
                    user: {
                        _id: user._id,
                        name: user.name,
                        profilePic: user.profilePic,
                        headline: user.headline,
                        username: user.username,
                        isPublic: false,
                    },
                });
            }
        }
    }

    res.json({ success: true, user });
});

// ─── GET /api/users/:userId/posts ────────────────────────────────────────────
export const getUserPosts = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const page  = parseInt(req.query.page) || 1;
    const limit = 12;

    const targetUser = await User.findById(userId).select("isPublic connections");
    if (!targetUser) return res.status(404).json({ success: false, message: "User not found" });

    const isOwner = req.user._id.toString() === targetUser._id.toString();
    const isConnected = targetUser.connections.some(
        (conn) => conn.toString() === req.user._id.toString()
    );

    if (!isOwner && targetUser.isPublic === false) {
        if (!isConnected) {
            return res.status(403).json({ success: false, message: "This profile is private", isPrivate: true });
        }
    }

    let visibilityFilter = {};
    if (!isOwner) {
        if (isConnected) {
            visibilityFilter = { visibility: { $in: ["public", "connections"] } };
        } else {
            visibilityFilter = { visibility: "public" };
        }
    }

    const posts = await Post.find({ author: userId, ...visibilityFilter })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("author", "name profilePic headline username");

    const total = await Post.countDocuments({ author: userId, ...visibilityFilter });
    res.json({ success: true, posts, total, page, pages: Math.ceil(total / limit) });
});

// ─── GET /api/users/:userId/stats ────────────────────────────────────────────
export const getUserStats = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const [user, postCount] = await Promise.all([
        User.findById(userId).select("connections profileViews skillScore isPublic"),
        Post.countDocuments({ author: userId }),
    ]);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const isOwner = req.user._id.toString() === user._id.toString();
    if (!isOwner && user.isPublic === false) {
        const isConnected = user.connections.some(
            (conn) => conn.toString() === req.user._id.toString()
        );
        if (!isConnected) {
            return res.status(403).json({ success: false, message: "This profile is private", isPrivate: true });
        }
    }

    res.json({
        success: true,
        stats: {
            connectionCount: user.connections.length,
            profileViews:    user.profileViews,
            skillScore:      user.skillScore,
            postCount,
        },
    });
});

// ─── GET /api/users/search ────────────────────────────────────────────────────
export const searchUsers = asyncHandler(async (req, res) => {
    const { q, skills, location, company } = req.query;
    const page  = parseInt(req.query.page) || 1;
    const limit = 12;

    if (q && q.length > 100) return res.status(400).json({ success: false, message: "Search query is too long" });
    if (skills && skills.length > 100) return res.status(400).json({ success: false, message: "Skills filter is too long" });
    if (location && location.length > 100) return res.status(400).json({ success: false, message: "Location filter is too long" });
    if (company && company.length > 100) return res.status(400).json({ success: false, message: "Company filter is too long" });

    const blockedUsers = req.user.blockedUsers || [];
    const usersWhoBlockedMe = await User.find({ blockedUsers: req.user._id }).select("_id");
    const allBlockedIds = [...blockedUsers, ...usersWhoBlockedMe.map(u => u._id)];

    const baseFilter = {
        _id: { $ne: req.user._id, $nin: allBlockedIds },
        $or: [
            { isPublic: { $ne: false } },
            { _id: { $in: req.user.connections || [] } }
        ]
    };

    if (skills) {
        const skillArr = skills.split(",").map((s) => s.trim()).filter(Boolean);
        if (skillArr.length) baseFilter.skills = { $in: skillArr.map((s) => new RegExp(escapeRegex(s), "i")) };
    }
    if (location) baseFilter.location = { $regex: escapeRegex(location.trim()), $options: "i" };
    if (company)  baseFilter["experience.company"] = { $regex: escapeRegex(company.trim()), $options: "i" };

    let users = [];
    let total = 0;
    const selectFields = "name username profilePic headline location skills experience connections";

    if (q && q.trim()) {
        const trimmed = q.trim();
        const textFilter = { ...baseFilter, $text: { $search: trimmed } };
        const regexFilter = {
            ...baseFilter,
            $or: [
                { username: { $regex: escapeRegex(trimmed), $options: "i" } },
                { name: { $regex: escapeRegex(trimmed), $options: "i" } },
            ],
        };

        const [textResults, regexResults] = await Promise.all([
            User.find(textFilter).sort({ score: { $meta: "textScore" } }).limit(limit * 2).select(selectFields).catch(() => []),
            User.find(regexFilter).sort({ skillScore: -1, createdAt: -1 }).limit(limit * 2).select(selectFields),
        ]);

        const seen = new Set();
        const merged = [];
        for (const u of textResults) { const uid = u._id.toString(); if (!seen.has(uid)) { seen.add(uid); merged.push(u); } }
        for (const u of regexResults) { const uid = u._id.toString(); if (!seen.has(uid)) { seen.add(uid); merged.push(u); } }

        total = merged.length;
        users = merged.slice((page - 1) * limit, page * limit);
    } else {
        const [filteredUsers, filteredTotal] = await Promise.all([
            User.find(baseFilter).sort({ skillScore: -1, createdAt: -1 }).skip((page - 1) * limit).limit(limit).select(selectFields),
            User.countDocuments(baseFilter),
        ]);
        users = filteredUsers;
        total = filteredTotal;
    }

    const Connection = (await import("../models/Connection.model.js")).default;
    const myConnIds  = new Set(req.user.connections.map((c) => c.toString()));
    const pendingOut = await Connection.find({ sender: req.user._id, recipient: { $in: users.map((u) => u._id) }, status: "pending" }).select("recipient");
    const pendingOutSet = new Set(pendingOut.map((c) => c.recipient.toString()));
    const pendingIn = await Connection.find({ recipient: req.user._id, sender: { $in: users.map((u) => u._id) }, status: "pending" }).select("sender");
    const pendingInSet = new Set(pendingIn.map((c) => c.sender.toString()));

    const results = users.map((u) => {
        const uid = u._id.toString();
        let connectionStatus = "none";
        if (myConnIds.has(uid)) connectionStatus = "connected";
        else if (pendingOutSet.has(uid)) connectionStatus = "pending_sent";
        else if (pendingInSet.has(uid)) connectionStatus = "pending_received";
        return { ...u.toObject(), connectionStatus };
    });

    res.json({ success: true, users: results, total, page, pages: Math.ceil(total / limit) });
});

// ─── GET /api/users/suggestions ──────────────────────────────────────────────
export const getRecommendedUsers = asyncHandler(async (req, res) => {
    const me = await User.findById(req.user._id).select("connections skills location");
    const myConnIds = me.connections.map((id) => id.toString());
    const excludeIds = [...myConnIds, req.user._id.toString()];

    const mySkills = me.skills || [];
    const mySkillSet = new Set(mySkills.map((s) => s.trim().toLowerCase()));

    const getSharedSkillsCount = (userSkills) => {
        if (!userSkills) return 0;
        return userSkills.filter((s) => mySkillSet.has(s.trim().toLowerCase())).length;
    };

    // 1. Users sharing 2+ skills
    let group1 = [];
    if (mySkills.length > 0) {
        const skillRegexes = mySkills.map((s) => new RegExp("^" + escapeRegex(s) + "$", "i"));
        const candidates = await User.find({
            _id: { $nin: excludeIds },
            isPublic: { $ne: false },
            skills: { $in: skillRegexes },
        }).select("name username profilePic headline location skills connections");

        group1 = candidates.filter((u) => getSharedSkillsCount(u.skills) >= 2);
    }

    // 2. Friends of friends (FoF)
    const friendsOfFriends = await User.find({ _id: { $in: me.connections } }).select("connections");
    const fofIds = new Set();
    friendsOfFriends.forEach((friend) => {
        friend.connections.forEach((id) => {
            const sid = id.toString();
            if (!excludeIds.includes(sid)) fofIds.add(sid);
        });
    });

    const group1Ids = new Set(group1.map((u) => u._id.toString()));
    const fofIdsFiltered = Array.from(fofIds).filter((id) => !group1Ids.has(id));

    let group2 = [];
    if (fofIdsFiltered.length > 0) {
        group2 = await User.find({
            _id: { $in: fofIdsFiltered },
            isPublic: { $ne: false },
        }).select("name username profilePic headline location skills connections");
    }

    // 3. Fallback active users
    const group1And2Ids = new Set([
        ...group1.map((u) => u._id.toString()),
        ...group2.map((u) => u._id.toString()),
    ]);
    const fallbackExcludeIds = [...excludeIds, ...Array.from(group1And2Ids)];

    const group3 = await User.find({
        _id: { $nin: fallbackExcludeIds },
        isPublic: { $ne: false },
    })
        .select("name username profilePic headline location skills connections")
        .limit(20);

    const merged = [...group1, ...group2, ...group3];

    const results = merged.slice(0, 12).map((u) => {
        const mutualCount = u.connections.filter((id) => myConnIds.includes(id.toString())).length;
        const sharedSkills = getSharedSkillsCount(u.skills);
        return {
            ...u.toObject(),
            mutualCount,
            sharedSkills,
        };
    });

    res.json({ success: true, users: results });
});

// ─── PUT /api/users/update ───────────────────────────────────────────────────
export const updateProfile = asyncHandler(async (req, res) => {
    const allowed = ["name", "headline", "about", "location", "website", "skills", "interests", "experience", "education", "username"];
    const updateData = {};

    allowed.forEach((field) => {
        if (req.body[field] !== undefined) updateData[field] = req.body[field];
    });

    ["skills", "interests", "experience", "education"].forEach((field) => {
        if (typeof updateData[field] === "string") {
            try { updateData[field] = JSON.parse(updateData[field]); } catch { /* ignore */ }
        }
    });

    if (req.files?.profilePic) {
        updateData.profilePic = req.files.profilePic[0].path;
    } else if (req.body.profilePic === "") {
        updateData.profilePic = "";
    }

    if (req.files?.bannerPic) {
        updateData.bannerPic = req.files.bannerPic[0].path;
    } else if (req.body.bannerPic === "") {
        updateData.bannerPic = "";
    }

    if (updateData.username) {
        const existing = await User.findOne({ username: updateData.username, _id: { $ne: req.user._id } });
        if (existing) return res.status(400).json({ success: false, message: "Username already taken" });
        updateData.username = updateData.username.toLowerCase().replace(/[^a-z0-9-]/g, "");
    }

    const user = await User.findByIdAndUpdate(req.user._id, updateData, { new: true, runValidators: true })
        .select("-password -resetPasswordToken -resetPasswordExpires");

    res.json({ success: true, user });
});

// ─── PUT /api/users/change-password ─────────────────────────────────────────
export const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ success: false, message: "Both fields are required" });
    if (newPassword.length < 6) return res.status(400).json({ success: false, message: "New password must be at least 6 characters" });

    const user = await User.findById(req.user._id);
    const valid = await user.matchPassword(currentPassword);
    if (!valid) return res.status(400).json({ success: false, message: "Current password is incorrect" });

    user.password = newPassword;
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();
    res.json({ success: true, message: "Password updated successfully" });
});

// ─── PUT /api/users/privacy ──────────────────────────────────────────────────
export const updatePrivacy = asyncHandler(async (req, res) => {
    const { isPublic, emailNotifications } = req.body;
    const updates = {};
    if (isPublic !== undefined) updates.isPublic = Boolean(isPublic);
    if (emailNotifications !== undefined) updates.emailNotifications = Boolean(emailNotifications);

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select("-password");
    res.json({ success: true, user });
});

// ─── PATCH /api/users/me ──────────────────────────────────────────────────────
export const updateMe = asyncHandler(async (req, res) => {
    const { isPublic, emailNotifications, isNewUser } = req.body;
    const updates = {};
    if (isPublic !== undefined) updates.isPublic = Boolean(isPublic);
    if (emailNotifications !== undefined) updates.emailNotifications = Boolean(emailNotifications);
    if (isNewUser !== undefined) updates.isNewUser = Boolean(isNewUser);

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select("-password");
    res.json({ success: true, user });
});

// ─── DELETE /api/users/me ─────────────────────────────────────────────────────
export const deleteAccount = asyncHandler(async (req, res) => {
    const { password } = req.body;
    if (!password) {
        return res.status(400).json({ success: false, message: "Password is required to delete account" });
    }

    const user = await User.findById(req.user._id);
    const valid = await user.matchPassword(password);
    if (!valid) {
        return res.status(400).json({ success: false, message: "Incorrect password" });
    }

    const id = req.user._id;

    // Increment tokenVersion (for any in-flight/cache consistency) before deletion
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    await Promise.all([
        User.deleteOne({ _id: id }),
        Post.deleteMany({ author: id }),
        Comment.deleteMany({ user: id }),
        Connection.deleteMany({ $or: [{ sender: id }, { recipient: id }] }),
        Message.deleteMany({ $or: [{ sender: id }, { recipient: id }] }),
        Notification.deleteMany({ $or: [{ recipient: id }, { sender: id }] }),
        SavedPost.deleteMany({ user: id }),
    ]);

    res.json({ success: true, message: "Account deleted successfully" });
});

// ─── POST /api/users/:id/block ────────────────────────────────────────────────
export const blockUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (req.user._id.toString() === id) {
        return res.status(400).json({ success: false, message: "You cannot block yourself" });
    }
    const targetUser = await User.findById(id);
    if (!targetUser) return res.status(404).json({ success: false, message: "User not found" });

    // Add to blockedUsers if not already there
    await User.findByIdAndUpdate(req.user._id, {
        $addToSet: { blockedUsers: id }
    });

    // Automatically remove connection if they are connected and delete Connection records
    await Promise.all([
        User.findByIdAndUpdate(req.user._id, { $pull: { connections: id } }),
        User.findByIdAndUpdate(id, { $pull: { connections: req.user._id } }),
        Connection.deleteMany({
            $or: [
                { sender: req.user._id, recipient: id },
                { sender: id, recipient: req.user._id }
            ]
        })
    ]);

    res.json({ success: true, message: "User blocked successfully" });
});

// ─── DELETE /api/users/:id/block ──────────────────────────────────────────────
export const unblockUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    await User.findByIdAndUpdate(req.user._id, {
        $pull: { blockedUsers: id }
    });
    res.json({ success: true, message: "User unblocked successfully" });
});

// ─── GET /api/users/blocked ───────────────────────────────────────────────────
export const getBlockedUsers = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id)
        .populate("blockedUsers", "name username profilePic headline");
    res.json({ success: true, blockedUsers: user.blockedUsers || [] });
});