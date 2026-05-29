import { body, validationResult } from "express-validator";

/**
 * Reusable validation error handler.
 * Returns the first validation error in the standard { success, message } shape.
 */
export const handleValidation = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }
    next();
};

export const validateRegister = [
    body("name")
        .trim()
        .isLength({ min: 2 })
        .withMessage("Name must be at least 2 characters"),
    body("email")
        .trim()
        .isEmail()
        .withMessage("Please enter a valid email address"),
    body("password")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters")
        .isLength({ max: 128 })
        .withMessage("Password is too long"),
    handleValidation,
];

export const validateLogin = [
    body("email")
        .trim()
        .isEmail()
        .withMessage("Please enter a valid email address"),
    body("password")
        .notEmpty()
        .withMessage("Password is required")
        .isLength({ max: 128 })
        .withMessage("Invalid credentials"),
    handleValidation,
];

export const validateForgotPassword = [
    body("email")
        .trim()
        .isEmail()
        .withMessage("Please enter a valid email address"),
    handleValidation,
];

export const validateResetPassword = [
    body("password")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters")
        .isLength({ max: 128 })
        .withMessage("Password is too long"),
    handleValidation,
];
