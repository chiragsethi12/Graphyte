import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 120,
        },
        description: {
            type: String,
            default: "",
            maxlength: 2000,
        },
        techStack: [{ type: String, trim: true }],
        liveUrl:   { type: String, default: "" },
        repoUrl:   { type: String, default: "" },
        images:    [{ type: String }],  // Cloudinary URLs, max 5
        order:     { type: Number, default: 0 },
    },
    { timestamps: true }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────
projectSchema.index({ user: 1, order: 1 });

export default mongoose.model("Project", projectSchema);
