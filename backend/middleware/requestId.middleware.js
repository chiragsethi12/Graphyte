import crypto from "crypto";
import logger from "../config/logger.js";

/**
 * Middleware that assigns a unique request ID to every incoming request.
 * - Reads an existing `X-Request-Id` header (forwarded by a reverse proxy) or generates one.
 * - Attaches `req.id` and a child logger `req.log` with the request ID for correlation.
 * - Echoes the ID back via the `X-Request-Id` response header.
 */
const requestId = (req, res, next) => {
    const id = req.headers["x-request-id"] || crypto.randomUUID();
    req.id  = id;
    req.log = logger.child({ reqId: id });
    res.setHeader("X-Request-Id", id);
    next();
};

export default requestId;
