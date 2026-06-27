import { createClient } from "redis";
import logger from "./logger.js";

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

const redisClient = createClient({ url: redisUrl });
const pubClient = createClient({ url: redisUrl });
const subClient = pubClient.duplicate();

let redisConnected = false;

redisClient.on("error", (err) => {
    if (redisConnected) logger.error({ err }, "Redis Client Error");
});
pubClient.on("error", (err) => {
    if (redisConnected) logger.error({ err }, "Redis Pub Client Error");
});
subClient.on("error", (err) => {
    if (redisConnected) logger.error({ err }, "Redis Sub Client Error");
});

export const connectRedis = async () => {
    try {
        await Promise.all([
            redisClient.connect(),
            pubClient.connect(),
            subClient.connect()
        ]);
        redisConnected = true;
        logger.info("Redis connected successfully for presence and Pub/Sub adapter");
    } catch (err) {
        redisConnected = false;
        logger.warn("Redis not available — running without Redis (online presence disabled)");
    }
};

export const isRedisConnected = () => redisConnected;

export { redisClient, pubClient, subClient };
