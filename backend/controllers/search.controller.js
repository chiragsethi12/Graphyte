import asyncHandler from "../utils/asyncHandler.js";
import User from "../models/User.model.js";
import Post from "../models/Post.model.js";
import Job from "../models/Job.model.js";
import escapeRegex from "../utils/escapeRegex.js";

/**
 * GET /api/search?q=&type=all|users|jobs|posts&skills=&location=&company=&page=
 * Unified search endpoint — returns mixed results or filtered by type.
 */
export const search = asyncHandler(async (req, res) => {
    const { q, type = "all", skills, location, company } = req.query;
    const page  = parseInt(req.query.page) || 1;
    const limit = 10;

    if (q && q.length > 100) return res.status(400).json({ success: false, message: "Search query is too long" });
    if (skills && skills.length > 100) return res.status(400).json({ success: false, message: "Skills filter is too long" });
    if (location && location.length > 100) return res.status(400).json({ success: false, message: "Location filter is too long" });
    if (company && company.length > 100) return res.status(400).json({ success: false, message: "Company filter is too long" });

    if (!q || !q.trim())
        return res.status(400).json({ success: false, message: "Search query is required" });

    const trimmed = q.trim();
    const result = { users: [], jobs: [], posts: [] };

    // ── Users ────────────────────────────────────────────────────
    if (type === "all" || type === "users") {
        const blockedUsers = req.user.blockedUsers || [];
        const usersWhoBlockedMe = await User.find({ blockedUsers: req.user._id }).select("_id");
        const allBlockedIds = [...blockedUsers, ...usersWhoBlockedMe.map(u => u._id)];

        // Build shared filters for skills / location / company
        const extraFilter = { 
            _id: { $ne: req.user._id, $nin: allBlockedIds },
            $or: [
                { isPublic: { $ne: false } },
                { _id: { $in: req.user.connections || [] } }
            ]
        };
        if (skills)   extraFilter.skills   = { $in: skills.split(",").map((s) => new RegExp(escapeRegex(s.trim()), "i")) };
        if (location) extraFilter.location = { $regex: escapeRegex(location.trim()), $options: "i" };
        if (company)  extraFilter["experience.company"] = { $regex: escapeRegex(company.trim()), $options: "i" };

        // Query 1: Full-text search (scored)
        const textFilter = { ...extraFilter, $text: { $search: trimmed } };
        const textResultsPromise = User.find(textFilter)
            .sort({ score: { $meta: "textScore" } })
            .limit(limit)
            .select("name username profilePic headline location skills");

        // Query 2: Regex search on username + name
        const regexFilter = {
            ...extraFilter,
            $or: [
                { username: { $regex: escapeRegex(trimmed), $options: "i" } },
                { name: { $regex: escapeRegex(trimmed), $options: "i" } },
            ],
        };
        const regexResultsPromise = User.find(regexFilter)
            .sort({ skillScore: -1, createdAt: -1 })
            .limit(limit)
            .select("name username profilePic headline location skills");

        const [textResults, regexResults] = await Promise.all([
            textResultsPromise.catch(() => []),
            regexResultsPromise,
        ]);

        // Merge & deduplicate — text-scored results come first
        const seen = new Set();
        const merged = [];

        for (const user of textResults) {
            const uid = user._id.toString();
            if (!seen.has(uid)) {
                seen.add(uid);
                merged.push(user);
            }
        }
        for (const user of regexResults) {
            const uid = user._id.toString();
            if (!seen.has(uid)) {
                seen.add(uid);
                merged.push(user);
            }
        }

        // Apply pagination to merged results
        result.users = merged.slice((page - 1) * limit, page * limit);
    }

    // ── Jobs ─────────────────────────────────────────────────────
    if (type === "all" || type === "jobs") {
        const jobFilter = { isActive: true, $text: { $search: trimmed } };
        result.jobs = await Job.find(jobFilter)
            .sort({ score: { $meta: "textScore" } })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate("postedBy", "name username profilePic")
            .select("title company location type experienceLevel salary createdAt");
    }

    // ── Posts ─────────────────────────────────────────────────────
    if (type === "all" || type === "posts") {
        const privateNonConnections = await User.find({
            _id: { $ne: req.user._id, $nin: req.user.connections || [] },
            isPublic: false
        }).select("_id");
        const excludeIds = privateNonConnections.map(u => u._id);

        const postFilter = { 
            $text: { $search: trimmed },
            author: { $nin: excludeIds }
        };
        result.posts = await Post.find(postFilter)
            .sort({ score: { $meta: "textScore" } })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate("author", "name username profilePic headline")
            .select("content image author likesCount commentsCount createdAt tags");
    }

    res.json({ success: true, ...result, page });
});
