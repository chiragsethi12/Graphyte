import jwt from "jsonwebtoken";
import User from "../models/User.model.js";

const protect = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select("-password");
        if (!req.user) return res.status(401).json({ success: false, message: "User not found" });

        if (decoded.tokenVersion === undefined || decoded.tokenVersion !== req.user.tokenVersion) {
            return res.status(401).json({ success: false, message: "Session expired, please login again" });
        }

        next();
    } catch {
        res.status(401).json({ success: false, message: "Invalid token" });
    }
};

export const requireVerification = (req, res, next) => {
    if (!req.user || !req.user.isVerified) {
        return res.status(403).json({ success: false, message: "Your email must be verified to perform this action." });
    }
    next();
};

export default protect;