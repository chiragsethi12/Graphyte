import express from "express";
import { register, login, getMe, checkUsernameAvailability, forgotPassword, resetPassword } from "../controllers/auth.controller.js";
import protect from "../middleware/auth.middleware.js";
import { validateRegister, validateLogin, validateForgotPassword, validateResetPassword } from "../middleware/validate.middleware.js";

const router = express.Router();

router.get("/check-username", checkUsernameAvailability);
router.post("/register", validateRegister, register);
router.post("/login", validateLogin, login);
router.get("/me", protect, getMe);
router.post("/forgot-password", validateForgotPassword, forgotPassword);
router.post("/reset-password/:token", validateResetPassword, resetPassword);

export default router;