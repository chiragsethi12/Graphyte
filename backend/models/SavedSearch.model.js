import mongoose from "mongoose";

const savedSearchSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        name: {
            type: String,
            default: "Job Alert",
            maxlength: 80,
            trim: true,
        },
        // Search criteria (mirrors the getJobs filter params)
        query:           { type: String, default: "" },
        type:            { type: String, default: "" },    // full-time, part-time, remote, etc.
        location:        { type: String, default: "" },
        experienceLevel: { type: String, default: "" },

        frequency: {
            type: String,
            enum: ["daily", "weekly"],
            default: "daily",
        },
        lastRunAt: { type: Date, default: Date.now },
        isActive:  { type: Boolean, default: true },
    },
    { timestamps: true }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────
savedSearchSchema.index({ user: 1 });
savedSearchSchema.index({ isActive: 1, frequency: 1, lastRunAt: 1 });

export default mongoose.model("SavedSearch", savedSearchSchema);
