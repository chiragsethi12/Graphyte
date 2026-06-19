import express from "express";
import protect, { isAdmin } from "../middleware/auth.middleware.js";
import { getPendingReports, updateReportStatus, suspendUser } from "../controllers/admin.controller.js";

const router = express.Router();

// Apply protect and isAdmin check to all admin routes
router.use(protect);
router.use(isAdmin);

router.get("/reports", getPendingReports);
router.patch("/reports/:id", updateReportStatus);
router.put("/users/:id/suspend", suspendUser);

export default router;
