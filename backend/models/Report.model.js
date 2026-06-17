import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
    {
        reporter: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "User", 
            required: true 
        },
        reportedUser: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "User" 
        },
        reportedPost: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "Post" 
        },
        reportedComment: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "Comment" 
        },
        reason: { 
            type: String, 
            required: true,
            enum: ["spam", "harassment", "hate_speech", "inappropriate_content", "other"]
        },
        status: { 
            type: String, 
            enum: ["pending", "resolved", "dismissed"], 
            default: "pending" 
        }
    },
    { timestamps: true }
);

export default mongoose.model("Report", reportSchema);
