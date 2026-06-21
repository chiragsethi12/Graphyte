import express from "express";
import {
    getJobAlerts,
    createJobAlert,
    updateJobAlert,
    deleteJobAlert,
} from "../controllers/jobAlert.controller.js";
import protect from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", protect, getJobAlerts);
router.post("/", protect, createJobAlert);
router.put("/:id", protect, updateJobAlert);
router.delete("/:id", protect, deleteJobAlert);

export default router;
