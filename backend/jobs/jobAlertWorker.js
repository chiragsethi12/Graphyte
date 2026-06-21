import cron from "node-cron";
import SavedSearch from "../models/SavedSearch.model.js";
import Job from "../models/Job.model.js";
import User from "../models/User.model.js";
import Notification from "../models/Notification.model.js";
import sendEmail, { buildJobAlertEmail } from "../utils/sendEmail.js";
import { io } from "../socket/socket.js";
import logger from "../config/logger.js";

/**
 * Run a single saved search against new jobs since lastRunAt.
 * Returns array of matching jobs (plain objects).
 */
async function runSearch(alert) {
    const filter = { isActive: true, createdAt: { $gt: alert.lastRunAt } };

    if (alert.query) {
        filter.$text = { $search: alert.query };
    }
    if (alert.type) filter.type = alert.type;
    if (alert.experienceLevel) filter.experienceLevel = alert.experienceLevel;
    if (alert.location) filter.location = { $regex: alert.location, $options: "i" };

    return Job.find(filter)
        .sort(alert.query ? { score: { $meta: "textScore" } } : { createdAt: -1 })
        .limit(10)
        .select("title company location _id")
        .lean();
}

/**
 * Process all due alerts of a given frequency.
 */
async function processAlerts(frequency) {
    const now = new Date();
    const thresholdMs = frequency === "weekly" ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    const cutoff = new Date(now.getTime() - thresholdMs);

    const dueAlerts = await SavedSearch.find({
        isActive: true,
        frequency,
        lastRunAt: { $lte: cutoff },
    }).populate("user", "name email emailNotifications");

    if (dueAlerts.length === 0) return;

    logger.info({ frequency, count: dueAlerts.length }, "Processing job alerts");

    for (const alert of dueAlerts) {
        try {
            const user = alert.user;
            if (!user || !user.email) {
                await SavedSearch.findByIdAndUpdate(alert._id, { lastRunAt: now });
                continue;
            }

            const matchedJobs = await runSearch(alert);

            if (matchedJobs.length > 0) {
                // Create in-app notification
                const notification = await Notification.create({
                    recipient: user._id,
                    sender: user._id,     // self-triggered notification
                    type: "jobAlert",
                    message: `Your alert "${alert.name}" found ${matchedJobs.length} new job${matchedJobs.length !== 1 ? "s" : ""}`,
                    relatedJob: matchedJobs[0]._id,
                });

                // Real-time push via socket
                if (io) {
                    const populated = await Notification.findById(notification._id)
                        .populate("sender", "name profilePic username");
                    io.to(`user:${user._id}`).emit("newNotification", populated);
                }

                // Email digest (if user has email notifications enabled)
                if (user.emailNotifications !== false) {
                    try {
                        await sendEmail({
                            to: user.email,
                            subject: `${matchedJobs.length} new job${matchedJobs.length !== 1 ? "s" : ""} for "${alert.name}" — Graphyte`,
                            html: buildJobAlertEmail(user.name, matchedJobs, alert.name),
                        });
                    } catch (emailErr) {
                        logger.error({ err: emailErr, alertId: alert._id }, "Failed to send job alert email");
                    }
                }

                logger.info({ alertId: alert._id, userId: user._id, matches: matchedJobs.length }, "Job alert matches sent");
            }

            // Update lastRunAt regardless of whether matches were found
            await SavedSearch.findByIdAndUpdate(alert._id, { lastRunAt: now });
        } catch (err) {
            logger.error({ err, alertId: alert._id }, "Error processing job alert");
        }
    }
}

/**
 * Start the job alert cron scheduler.
 * Runs every hour — checks both daily and weekly alerts based on their lastRunAt.
 */
export function startJobAlertWorker() {
    // Run every hour at minute 0
    cron.schedule("0 * * * *", async () => {
        logger.info("Job alert worker: starting hourly check");
        try {
            await Promise.all([
                processAlerts("daily"),
                processAlerts("weekly"),
            ]);
            logger.info("Job alert worker: hourly check complete");
        } catch (err) {
            logger.error({ err }, "Job alert worker: unhandled error");
        }
    });

    logger.info("Job alert cron worker started (runs every hour)");
}
