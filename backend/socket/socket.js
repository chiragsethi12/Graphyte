import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import jwt from "jsonwebtoken";
import User from "../models/User.model.js";
import { pubClient, subClient, redisClient, isRedisConnected } from "../config/redis.js";
import logger from "../config/logger.js";

let io;

export const initSocket = (server) => {
    const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
    const allowedOrigins = process.env.NODE_ENV === "production"
        ? [clientUrl]
        : [clientUrl, "http://localhost:5173", "http://localhost:3000"];

    io = new Server(server, {
        cors: {
            origin: allowedOrigins,
            methods: ["GET", "POST"],
        },
        pingTimeout: 60000,
    });

    const isTest = process.env.NODE_ENV === "test";
    const useRedis = !isTest && isRedisConnected();

    if (useRedis) {
        io.adapter(createAdapter(pubClient, subClient));
    }

    // JWT verification middleware for Socket.IO handshake
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth?.token;
            if (!token) {
                return next(new Error("Authentication error: No token provided"));
            }
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select("_id");
            if (!user) {
                return next(new Error("Authentication error: User not found"));
            }
            socket.user = user;
            next();
        } catch (error) {
            return next(new Error("Authentication error: Invalid token"));
        }
    });

    io.on("connection", async (socket) => {
        const userId = socket.user._id.toString();
        socket.join(`user:${userId}`);

        if (useRedis) {
            try {
                // Add socket to user's active connections set
                await redisClient.sAdd(`user:connections:${userId}`, socket.id);
                // Mark user as online globally
                await redisClient.sAdd("online_users", userId);
                // Get updated global online users list
                const onlineUsers = await redisClient.sMembers("online_users");
                io.emit("onlineUsers", onlineUsers);
            } catch (err) {
                logger.error({ err, userId }, "Failed to update online presence in Redis on connection");
            }
        } else {
            // Fallback: in-memory tracking when Redis is not available
            if (!global.userSocketMap) {
                global.userSocketMap = {};
            }
            global.userSocketMap[userId] = socket.id;
            io.emit("onlineUsers", Object.keys(global.userSocketMap));
        }

        // ── Conversation rooms ───────────────────────────────────
        socket.on("joinConversation", (conversationId) => {
            if (!conversationId) return;
            const parts = conversationId.split("_");
            if (parts.length === 2 && parts.includes(userId)) {
                socket.join(`conv:${conversationId}`);
            } else {
                logger.warn({ userId, conversationId }, "Unauthorized joinConversation attempt");
            }
        });

        socket.on("leaveConversation", (conversationId) => {
            if (!conversationId) return;
            const parts = conversationId.split("_");
            if (parts.length === 2 && parts.includes(userId)) {
                socket.leave(`conv:${conversationId}`);
            }
        });

        // ── Typing indicators ────────────────────────────────────
        socket.on("typing", ({ recipientId, conversationId }) => {
            const parts = conversationId ? conversationId.split("_") : [];
            const isParticipant = parts.length === 2 && parts.includes(userId) && parts.includes(recipientId);
            if (!isParticipant) {
                logger.warn({ userId }, "Unauthorized typing indicator attempt");
                return;
            }
            if (conversationId) {
                socket.to(`conv:${conversationId}`).emit("userTyping", { userId, conversationId });
            }
            // Emit to recipient's user room
            io.to(`user:${recipientId}`).emit("userTyping", { userId, conversationId });
        });

        socket.on("stopTyping", ({ recipientId, conversationId }) => {
            const parts = conversationId ? conversationId.split("_") : [];
            const isParticipant = parts.length === 2 && parts.includes(userId) && parts.includes(recipientId);
            if (!isParticipant) {
                logger.warn({ userId }, "Unauthorized stopTyping indicator attempt");
                return;
            }
            if (conversationId) {
                socket.to(`conv:${conversationId}`).emit("userStopTyping", { userId, conversationId });
            }
            io.to(`user:${recipientId}`).emit("userStopTyping", { userId, conversationId });
        });

        // ── Real-time message delivery ────────────────────────────
        socket.on("messageSent", ({ recipientId, message, conversationId }) => {
            const parts = conversationId ? conversationId.split("_") : [];
            const isSender = (message.sender?._id || message.sender) === userId;
            const isParticipant = parts.length === 2 && parts.includes(userId) && parts.includes(recipientId);
            if (!isSender || !isParticipant) {
                logger.warn({ userId }, "Unauthorized messageSent");
                return;
            }
            if (conversationId) {
                socket.to(`conv:${conversationId}`).emit("newMessage", message);
            }
            io.to(`user:${recipientId}`).emit("newMessage", message);
        });

        // ── Mark messages as read notification ────────────────────
        socket.on("markRead", ({ senderId, conversationId }) => {
            const parts = conversationId ? conversationId.split("_") : [];
            const isParticipant = parts.length === 2 && parts.includes(userId) && parts.includes(senderId);
            if (!isParticipant) {
                logger.warn({ userId }, "Unauthorized markRead");
                return;
            }
            if (conversationId) {
                socket.to(`conv:${conversationId}`).emit("messagesRead", { byUserId: userId, conversationId });
            }
            io.to(`user:${senderId}`).emit("messagesRead", { byUserId: userId, conversationId });
        });

        // ── Disconnect ───────────────────────────────────────────
        socket.on("disconnect", async () => {
            if (userId) {
                if (useRedis) {
                    try {
                        await redisClient.sRem(`user:connections:${userId}`, socket.id);
                        const count = await redisClient.sCard(`user:connections:${userId}`);
                        if (count === 0) {
                            await redisClient.sRem("online_users", userId);
                        }
                        const onlineUsers = await redisClient.sMembers("online_users");
                        io.emit("onlineUsers", onlineUsers);
                    } catch (err) {
                        logger.error({ err, userId }, "Failed to update online presence in Redis on disconnect");
                    }
                } else {
                    if (global.userSocketMap) {
                        delete global.userSocketMap[userId];
                        io.emit("onlineUsers", Object.keys(global.userSocketMap));
                    }
                }
            }
        });
    });
};

export const getReceiverSocketId = (userId) => {
    if (process.env.NODE_ENV === "test") {
        return global.userSocketMap ? global.userSocketMap[userId] : undefined;
    }
    return undefined;
};

export { io };