import "dotenv/config";  // MUST be first — loads .env before any other import resolves
import express from "express";
import http from "http";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";

import connectDB from "./config/db.js";
import { initSocket } from "./socket/socket.js";
import { apiLimiter, authLimiter } from "./middleware/rateLimiter.js";

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import postRoutes from "./routes/post.routes.js";
import connectionRoutes from "./routes/connection.routes.js";
import jobRoutes from "./routes/job.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import searchRoutes from "./routes/search.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import messageRoutes from "./routes/message.routes.js";
import savedRoutes from "./routes/saved.routes.js";

connectDB();

const app = express();
const server = http.createServer(app);

initSocket(server);

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet());
app.use(morgan("dev"));
app.use(compression());

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";
console.log(`[CORS] Allowing requests from: ${CLIENT_URL}`);

app.use(cors({
    origin: [CLIENT_URL, "http://localhost:5173", "http://localhost:3000"],
    credentials: true,
}));
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

// ─── API Routes ──────────────────────────────────────────────────────────────
app.use(apiLimiter);
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/connections", connectionRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/saved", savedRoutes);

// ─── Quote route (CORS proxy for ZenQuotes API) ──────────────────────────────
app.get("/api/quote", async (req, res) => {
    try {
        const response = await fetch("https://zenquotes.io/api/random");
        if (!response.ok) {
            throw new Error(`ZenQuotes API responded with status ${response.status}`);
        }
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error("Error fetching random quote from ZenQuotes:", error.message);
        // Fallback quote
        res.json([{
            q: "True value isn't found in the number of connections you have, but in the deliberate silence between meaningful interactions.",
            a: "Graphyte"
        }]);
    }
});

// ─── Health check ────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/api/health/db", async (req, res) => {
    try {
        const { connection } = await import("mongoose");
        const state = ["disconnected", "connected", "connecting", "disconnecting"][connection.readyState] || "unknown";
        res.json({ status: state === "connected" ? "ok" : "degraded", db: state });
    } catch {
        res.status(500).json({ status: "error" });
    }
});

// ─── Global error handler ────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

app.use((err, req, res, next) => {
    console.error("Unhandled Error:", err.stack || err.message);

    if (err.name === 'ValidationError') {
        return res.status(400).json({ success: false, message: err.message });
    }

    const status = err.statusCode || 500;
    const message = err.isOperational || process.env.NODE_ENV !== "production" 
        ? err.message 
        : "Internal server error";

    res.status(status).json({
        success: false,
        message: message,
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}!`));