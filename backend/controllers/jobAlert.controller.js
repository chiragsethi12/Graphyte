import asyncHandler from "../utils/asyncHandler.js";
import SavedSearch from "../models/SavedSearch.model.js";

// GET /api/job-alerts
export const getJobAlerts = asyncHandler(async (req, res) => {
    const alerts = await SavedSearch.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, alerts });
});

// POST /api/job-alerts
export const createJobAlert = asyncHandler(async (req, res) => {
    const count = await SavedSearch.countDocuments({ user: req.user._id });
    if (count >= 5) {
        return res.status(400).json({ success: false, message: "Maximum 5 job alerts allowed" });
    }

    const { name, query, type, location, experienceLevel, frequency } = req.body;

    if (!query || !query.trim()) {
        return res.status(400).json({ success: false, message: "Search query is required for a job alert" });
    }

    const alert = await SavedSearch.create({
        user: req.user._id,
        name: (name || "Job Alert").trim().slice(0, 80),
        query: query.trim(),
        type: type || "",
        location: location || "",
        experienceLevel: experienceLevel || "",
        frequency: frequency === "weekly" ? "weekly" : "daily",
    });

    res.status(201).json({ success: true, alert });
});

// PUT /api/job-alerts/:id
export const updateJobAlert = asyncHandler(async (req, res) => {
    const alert = await SavedSearch.findById(req.params.id);
    if (!alert) return res.status(404).json({ success: false, message: "Alert not found" });
    if (alert.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: "Not authorized" });
    }

    const { name, query, type, location, experienceLevel, frequency, isActive } = req.body;

    if (name !== undefined) alert.name = name.trim().slice(0, 80);
    if (query !== undefined) alert.query = query.trim();
    if (type !== undefined) alert.type = type;
    if (location !== undefined) alert.location = location;
    if (experienceLevel !== undefined) alert.experienceLevel = experienceLevel;
    if (frequency !== undefined) alert.frequency = frequency === "weekly" ? "weekly" : "daily";
    if (isActive !== undefined) alert.isActive = Boolean(isActive);

    await alert.save();
    res.json({ success: true, alert });
});

// DELETE /api/job-alerts/:id
export const deleteJobAlert = asyncHandler(async (req, res) => {
    const alert = await SavedSearch.findById(req.params.id);
    if (!alert) return res.status(404).json({ success: false, message: "Alert not found" });
    if (alert.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: "Not authorized" });
    }

    await SavedSearch.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Alert deleted" });
});
