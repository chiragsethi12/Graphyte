import * as Sentry from "@sentry/node";
import logger from "./logger.js";

/**
 * Initialise Sentry for the Express backend.
 * No-op when SENTRY_DSN is not set (safe for dev / test).
 */
export function setupSentry(app) {
    const dsn = process.env.SENTRY_DSN;
    if (!dsn) {
        logger.info("Sentry DSN not configured — error tracking disabled");
        return;
    }

    Sentry.init({
        dsn,
        environment: process.env.NODE_ENV || "development",
        tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || "0.2"),
    });

    logger.info("Sentry initialised for backend");
}

/**
 * Install Sentry's Express error handler.
 * Must be called AFTER all routes but BEFORE custom error handlers.
 */
export function setupSentryErrorHandler(app) {
    if (!process.env.SENTRY_DSN) return;
    Sentry.setupExpressErrorHandler(app);
}

export { Sentry };
