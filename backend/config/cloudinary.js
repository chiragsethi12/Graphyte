import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "graphite",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
    }
});

export const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },  // 10MB max
    fileFilter: (req, file, cb) => {
        const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Only JPEG, PNG, WebP, and GIF images are allowed"), false);
        }
    },
});

const resumeStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "graphite_resumes",
        resource_type: "auto",
    }
});

export const uploadResume = multer({
    storage: resumeStorage,
    limits: { fileSize: 10 * 1024 * 1024 },  // 10MB max
    fileFilter: (req, file, cb) => {
        const allowedExtensions = [".pdf", ".doc", ".docx"];
        const allowedMimeTypes = [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ];
        const ext = file.originalname.substring(file.originalname.lastIndexOf(".")).toLowerCase();
        if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error("Only PDF, DOC, and DOCX files are allowed"), false);
        }
    },
});

export const handleMulterError = (err, req, res, next) => {
    if (err && err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ success: false, message: "Image must be under 10MB" });
    }
    if (err && err.message) {
        return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
};

export default cloudinary;