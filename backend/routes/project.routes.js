import express from "express";
import {
    getUserProjects,
    createProject,
    updateProject,
    deleteProject,
} from "../controllers/project.controller.js";
import protect from "../middleware/auth.middleware.js";
import { uploadProjectImages, handleMulterError } from "../config/cloudinary.js";

const router = express.Router();

router.get("/user/:userId", protect, getUserProjects);
router.post("/", protect, uploadProjectImages.array("images", 5), handleMulterError, createProject);
router.put("/:id", protect, uploadProjectImages.array("images", 5), handleMulterError, updateProject);
router.delete("/:id", protect, deleteProject);

export default router;
