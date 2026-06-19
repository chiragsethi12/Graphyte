import asyncHandler from "../utils/asyncHandler.js";
import Job from "../models/Job.model.js";
import Application from "../models/Application.model.js";

// POST /api/jobs
export const createJob = asyncHandler(async (req, res) => {
    const { title, company, location, type, description, skills, benefits, salary, deadline, experienceLevel } = req.body;

    if (!title || !company || !description)
        return res.status(400).json({ success: false, message: "Title, company, and description are required" });

    const jobData = {
        postedBy: req.user._id, title, company, location, type, description,
        skills:   skills   ? (typeof skills   === "string" ? JSON.parse(skills)   : skills)   : [],
        benefits: benefits ? (typeof benefits === "string" ? JSON.parse(benefits) : benefits) : [],
        experienceLevel: experienceLevel || "any",
    };

    if (salary) jobData.salary = typeof salary === "string" ? JSON.parse(salary) : salary;
    if (deadline) jobData.deadline = new Date(deadline);

    const job = await Job.create(jobData);
    res.status(201).json({ success: true, job });
});

// GET /api/jobs
export const getJobs = asyncHandler(async (req, res) => {
    const { search, type, location, experienceLevel, page: pg } = req.query;
    const page  = parseInt(pg) || 1;
    const limit = 12;
    const filter = { isActive: true };

    if (search) {
        filter.$text = { $search: search };
    }
    if (type)            filter.type            = type;
    if (experienceLevel) filter.experienceLevel = experienceLevel;
    if (location)        filter.location        = { $regex: location, $options: "i" };

    const [jobs, total] = await Promise.all([
        Job.find(filter)
            .sort(search ? { score: { $meta: "textScore" } } : { createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate("postedBy", "name username profilePic"),
        Job.countDocuments(filter),
    ]);

    res.json({ success: true, jobs, total, page, pages: Math.ceil(total / limit) });
});

// GET /api/jobs/:id
export const getJobById = asyncHandler(async (req, res) => {
    const job = await Job.findById(req.params.id)
        .populate("postedBy", "name username profilePic headline");
    if (!job) return res.status(404).json({ success: false, message: "Job not found" });
    res.json({ success: true, job });
});

// POST /api/jobs/:id/apply
export const applyForJob = asyncHandler(async (req, res) => {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: "Job not found" });
    if (!job.isActive) return res.status(400).json({ success: false, message: "Job is no longer active" });
    if (job.deadline && new Date() > job.deadline)
        return res.status(400).json({ success: false, message: "Application deadline has passed" });

    const existing = await Application.findOne({ job: req.params.id, applicant: req.user._id });
    if (existing) return res.status(400).json({ success: false, message: "Already applied" });

    if (!req.file) {
        return res.status(400).json({ success: false, message: "Resume file (PDF, DOC, or DOCX) is required" });
    }

    const { coverLetter, portfolioLinks } = req.body;

    if (coverLetter && coverLetter.length > 2000) {
        return res.status(400).json({ success: false, message: "Cover letter cannot exceed 2000 characters" });
    }

    let parsedLinks = [];
    if (portfolioLinks) {
        if (typeof portfolioLinks === "string") {
            try {
                parsedLinks = JSON.parse(portfolioLinks);
            } catch {
                parsedLinks = [portfolioLinks];
            }
        } else if (Array.isArray(portfolioLinks)) {
            parsedLinks = portfolioLinks;
        }
    }

    const application = await Application.create({
        job: req.params.id,
        applicant: req.user._id,
        resumeUrl: req.file.path,
        coverLetter: coverLetter || "",
        portfolioLinks: parsedLinks,
    });

    await Job.findByIdAndUpdate(req.params.id, { $addToSet: { applicants: req.user._id } });

    res.status(201).json({ success: true, application });
});

// GET /api/jobs/my-applications
export const getMyApplications = asyncHandler(async (req, res) => {
    const applications = await Application.find({ applicant: req.user._id })
        .populate({ path: "job", populate: { path: "postedBy", select: "name profilePic" } })
        .sort({ createdAt: -1 });
    res.json({ success: true, applications });
});

// GET /api/jobs/my-listings
export const getMyListings = asyncHandler(async (req, res) => {
    const jobs = await Job.find({ postedBy: req.user._id })
        .sort({ createdAt: -1 })
        .select("title company location type isActive applicants createdAt deadline");
    res.json({ success: true, jobs });
});

// PUT /api/jobs/:id/toggle-active
export const toggleJobActive = asyncHandler(async (req, res) => {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: "Job not found" });
    if (job.postedBy.toString() !== req.user._id.toString())
        return res.status(403).json({ success: false, message: "Not authorized" });

    job.isActive = !job.isActive;
    await job.save();
    res.json({ success: true, job });
});

// GET /api/jobs/recommended
export const getRecommendedJobs = asyncHandler(async (req, res) => {
    const me = await (await import("../models/User.model.js")).default
        .findById(req.user._id).select("skills location");

    const mySkills = me.skills || [];
    const filter = { isActive: true };

    if (mySkills.length > 0) {
        filter.skills = { $in: mySkills.map((s) => new RegExp(s, "i")) };
    }

    const jobs = await Job.find(filter)
        .sort({ createdAt: -1 })
        .limit(6)
        .populate("postedBy", "name username profilePic");

    res.json({ success: true, jobs });
});