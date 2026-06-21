import asyncHandler from "../utils/asyncHandler.js";
import Project from "../models/Project.model.js";
import User from "../models/User.model.js";
import cloudinary from "../config/cloudinary.js";

// GET /api/projects/user/:userId
export const getUserProjects = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const targetUser = await User.findById(userId).select("isPublic connections");
    if (!targetUser) return res.status(404).json({ success: false, message: "User not found" });

    // Privacy gating
    const isOwner = req.user._id.toString() === targetUser._id.toString();
    if (!isOwner && targetUser.isPublic === false) {
        const isConnected = targetUser.connections.some(
            (conn) => conn.toString() === req.user._id.toString()
        );
        if (!isConnected) {
            return res.status(403).json({ success: false, message: "This profile is private", isPrivate: true });
        }
    }

    const projects = await Project.find({ user: userId }).sort({ order: 1, createdAt: -1 });
    res.json({ success: true, projects });
});

// POST /api/projects
export const createProject = asyncHandler(async (req, res) => {
    const { title, description, techStack, liveUrl, repoUrl, order } = req.body;

    if (!title || !title.trim()) {
        return res.status(400).json({ success: false, message: "Title is required" });
    }

    // Limit to 10 projects per user
    const count = await Project.countDocuments({ user: req.user._id });
    if (count >= 10) {
        return res.status(400).json({ success: false, message: "Maximum 10 projects allowed" });
    }

    const images = req.files ? req.files.map((f) => f.path) : [];

    let parsedTechStack = [];
    if (techStack) {
        if (typeof techStack === "string") {
            try { parsedTechStack = JSON.parse(techStack); }
            catch { parsedTechStack = techStack.split(",").map((s) => s.trim()).filter(Boolean); }
        } else if (Array.isArray(techStack)) {
            parsedTechStack = techStack;
        }
    }

    const project = await Project.create({
        user: req.user._id,
        title: title.trim(),
        description: (description || "").trim(),
        techStack: parsedTechStack.slice(0, 15),  // max 15 tech tags
        liveUrl: liveUrl || "",
        repoUrl: repoUrl || "",
        images: images.slice(0, 5),  // max 5 images
        order: parseInt(order) || 0,
    });

    res.status(201).json({ success: true, project });
});

// PUT /api/projects/:id
export const updateProject = asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });
    if (project.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: "Not authorized" });
    }

    const { title, description, techStack, liveUrl, repoUrl, order, existingImages } = req.body;

    if (title !== undefined) project.title = title.trim();
    if (description !== undefined) project.description = description.trim();
    if (liveUrl !== undefined) project.liveUrl = liveUrl;
    if (repoUrl !== undefined) project.repoUrl = repoUrl;
    if (order !== undefined) project.order = parseInt(order) || 0;

    if (techStack !== undefined) {
        let parsed = [];
        if (typeof techStack === "string") {
            try { parsed = JSON.parse(techStack); }
            catch { parsed = techStack.split(",").map((s) => s.trim()).filter(Boolean); }
        } else if (Array.isArray(techStack)) {
            parsed = techStack;
        }
        project.techStack = parsed.slice(0, 15);
    }

    // Handle images: keep existing + add new uploads
    let finalImages = [];
    if (existingImages) {
        const kept = typeof existingImages === "string" ? JSON.parse(existingImages) : existingImages;
        finalImages = Array.isArray(kept) ? kept : [];
    }
    if (req.files && req.files.length > 0) {
        finalImages = [...finalImages, ...req.files.map((f) => f.path)];
    }
    project.images = finalImages.slice(0, 5);

    await project.save();
    res.json({ success: true, project });
});

// DELETE /api/projects/:id
export const deleteProject = asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });
    if (project.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: "Not authorized" });
    }

    // Clean up Cloudinary images
    for (const url of project.images) {
        try {
            // Extract public_id from Cloudinary URL
            const parts = url.split("/");
            const folderAndFile = parts.slice(parts.indexOf("graphite_projects")).join("/");
            const publicId = folderAndFile.replace(/\.[^/.]+$/, "");
            if (publicId) await cloudinary.uploader.destroy(publicId);
        } catch {
            // Ignore cleanup errors — image may already be gone
        }
    }

    await Project.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Project deleted" });
});
