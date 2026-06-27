import "dotenv/config";  // MUST be first — loads .env before any other import resolves
import express from "express";
import http from "http";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import compression from "compression";

import connectDB from "./config/db.js";
import { connectRedis } from "./config/redis.js";
import logger from "./config/logger.js";
import { setupSentry, setupSentryErrorHandler, Sentry } from "./config/sentry.js";
import { initSocket } from "./socket/socket.js";
import { apiLimiter, authLimiter } from "./middleware/rateLimiter.js";
import requestId from "./middleware/requestId.middleware.js";

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
import reportRoutes from "./routes/report.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import projectRoutes from "./routes/project.routes.js";
import jobAlertRoutes from "./routes/jobAlert.routes.js";
import { startJobAlertWorker } from "./jobs/jobAlertWorker.js";

if (process.env.NODE_ENV !== "test") {
    connectDB();
    connectRedis();
    startJobAlertWorker();
}

const app = express();
const server = http.createServer(app);

setupSentry(app);
initSocket(server);

// ─── Middleware ───────────────────────────────────────────────────────────────
const rawClientUrl = process.env.CLIENT_URL || "http://localhost:3000";
const CLIENT_URL = rawClientUrl.replace(/\/$/, "");
logger.info({ clientUrl: CLIENT_URL }, "CORS origins configured");

const allowedOrigins = process.env.NODE_ENV === "production" 
    ? [CLIENT_URL] 
    : [CLIENT_URL, "http://localhost:5173", "http://localhost:3000"];

app.use(cors({
    origin: function(origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || origin.startsWith("https://graphyte.netlify.app")) {
            callback(null, true);
        } else {
            logger.warn({ origin }, "Blocked by CORS");
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
}));

app.use(helmet());
app.use(requestId);
app.use(pinoHttp({ 
    logger, 
    autoLogging: process.env.NODE_ENV === "production" ? { ignore: (req) => req.url === "/api/health" } : false 
}));
app.use(compression());
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

// ─── OAuth Redirect Bridges (Google/GitHub redirect browser to backend port 5000) ────
app.get("/auth/google/callback", (req, res) => {
    const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
    const queryString = new URLSearchParams(req.query).toString();
    res.redirect(`${clientUrl}/auth/google/callback?${queryString}`);
});

app.get("/auth/github/callback", (req, res) => {
    const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
    const queryString = new URLSearchParams(req.query).toString();
    res.redirect(`${clientUrl}/auth/github/callback?${queryString}`);
});

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
app.use("/api/reports", reportRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/job-alerts", jobAlertRoutes);

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
        (req.log || logger).warn({ err: error }, "Error fetching random quote from ZenQuotes");
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
        const mongoose = await import("mongoose");
        const conn = mongoose.default?.connection || mongoose.connection;
        const state = ["disconnected", "connected", "connecting", "disconnecting"][conn.readyState] || "unknown";
        res.json({ status: state === "connected" ? "ok" : "degraded", db: state });
    } catch {
        res.status(500).json({ status: "error" });
    }
});

// ─── Sentry error handler (must be before custom error handler) ──────────────
setupSentryErrorHandler(app);

// ─── Global error handler ────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

app.use((err, req, res, next) => {
    const reqLog = req.log || logger;
    reqLog.error({ err, reqId: req.id }, "Unhandled Error");

    // Capture 5xx errors in Sentry (non-operational / unexpected)
    const status = err.statusCode || 500;
    if (status >= 500 && process.env.SENTRY_DSN) {
        Sentry.captureException(err);
    }

    if (err.name === 'ValidationError') {
        return res.status(400).json({ success: false, message: err.message });
    }

    const message = err.isOperational || process.env.NODE_ENV !== "production" 
        ? err.message 
        : "Internal server error";

    res.status(status).json({
        success: false,
        message: message,
    });
});

if (process.env.NODE_ENV !== "test") {
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => logger.info({ port: PORT }, `Server running on port ${PORT}`));
}

export { app, server };