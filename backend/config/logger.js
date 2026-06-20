import pino from "pino";

const isTest = process.env.NODE_ENV === "test";
const isDev  = process.env.NODE_ENV !== "production";

const logger = pino({
    level: isTest ? "silent" : (process.env.LOG_LEVEL || "info"),
    ...(isDev && !isTest && {
        transport: {
            target: "pino-pretty",
            options: {
                colorize: true,
                translateTime: "HH:MM:ss.l",
                ignore: "pid,hostname",
            },
        },
    }),
});

export default logger;
