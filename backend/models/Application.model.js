import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
    {
        job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
        applicant: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        status: { type: String, enum: ["pending", "reviewed", "accepted", "rejected"], default: "pending" },
        resumeUrl: { type: String, required: true },
        coverLetter: { type: String, maxlength: 2000 },
        portfolioLinks: [{ type: String }],
    },
    { timestamps: true }
);

applicationSchema.index({ job: 1, applicant: 1 }, { unique: true });

export default mongoose.model("Application", applicationSchema);