import mongoose from "mongoose";

const { Schema } = mongoose;
const { ObjectId } = Schema.Types;

const savedPostSchema = new Schema(
    {
        user:    { type: ObjectId, ref: "User", required: true },
        post:    { type: ObjectId, ref: "Post", required: true },
        savedAt: { type: Date, default: Date.now },
    },
    { timestamps: false }
);

// Prevent duplicate saves
savedPostSchema.index({ user: 1, post: 1 }, { unique: true });

// Efficient "my saved posts" listing sorted by most-recently-saved
savedPostSchema.index({ user: 1, savedAt: -1 });

export default mongoose.model("SavedPost", savedPostSchema);
