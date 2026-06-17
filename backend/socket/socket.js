import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/User.model.js";

let io;
const userSocketMap = {};  // userId -> socketId

export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: [process.env.CLIENT_URL || "http://localhost:3000", "http://localhost:5173", "http://localhost:3000"],
            methods: ["GET", "POST"],
        },
        pingTimeout: 60000,
    });

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

    io.on("connection", (socket) => {
        const userId = socket.user._id.toString();
        userSocketMap[userId] = socket.id;
        socket.join(`user:${userId}`);

        // Broadcast online users list to everyone
        io.emit("onlineUsers", Object.keys(userSocketMap));

        // ── Conversation rooms ───────────────────────────────────
        // Clients join a conversation room when viewing it for efficient
        // broadcasting of messages, typing, and read receipts.
        socket.on("joinConversation", (conversationId) => {
            if (!conversationId) return;
            const parts = conversationId.split("_");
            if (parts.length === 2 && parts.includes(userId)) {
                socket.join(`conv:${conversationId}`);
            } else {
                console.warn(`Unauthorized joinConversation attempt by user ${userId} for conversation ${conversationId}`);
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
                console.warn(`Unauthorized typing indicator attempt by user ${userId}`);
                return;
            }
            // Emit to conversation room if available
            if (conversationId) {
                socket.to(`conv:${conversationId}`).emit("userTyping", { userId, conversationId });
            }
            // Also emit directly to recipient for fallback
            const recipientSocket = userSocketMap[recipientId];
            if (recipientSocket) {
                io.to(recipientSocket).emit("userTyping", { userId, conversationId });
            }
        });

        socket.on("stopTyping", ({ recipientId, conversationId }) => {
            const parts = conversationId ? conversationId.split("_") : [];
            const isParticipant = parts.length === 2 && parts.includes(userId) && parts.includes(recipientId);
            if (!isParticipant) {
                console.warn(`Unauthorized stopTyping indicator attempt by user ${userId}`);
                return;
            }
            if (conversationId) {
                socket.to(`conv:${conversationId}`).emit("userStopTyping", { userId, conversationId });
            }
            const recipientSocket = userSocketMap[recipientId];
            if (recipientSocket) {
                io.to(recipientSocket).emit("userStopTyping", { userId, conversationId });
            }
        });

        // ── Real-time message delivery ────────────────────────────
        // This is a fallback for when the REST API send succeeds but the
        // HTTP response is enough — the controller handles DB write and
        // emits `newMessage` via getReceiverSocketId(). This socket event
        // allows the client to also broadcast for optimistic UI sync.
        socket.on("messageSent", ({ recipientId, message, conversationId }) => {
            const parts = conversationId ? conversationId.split("_") : [];
            const isSender = (message.sender?._id || message.sender) === userId;
            const isParticipant = parts.length === 2 && parts.includes(userId) && parts.includes(recipientId);
            if (!isSender || !isParticipant) {
                console.warn(`Unauthorized messageSent by user ${userId}`);
                return;
            }
            // Broadcast to conversation room
            if (conversationId) {
                socket.to(`conv:${conversationId}`).emit("newMessage", message);
            }
            // Also emit directly to recipient
            const recipientSocket = userSocketMap[recipientId];
            if (recipientSocket) {
                io.to(recipientSocket).emit("newMessage", message);
            }
        });

        // ── Mark messages as read notification ────────────────────
        socket.on("markRead", ({ senderId, conversationId }) => {
            const parts = conversationId ? conversationId.split("_") : [];
            const isParticipant = parts.length === 2 && parts.includes(userId) && parts.includes(senderId);
            if (!isParticipant) {
                console.warn(`Unauthorized markRead by user ${userId}`);
                return;
            }
            // Notify via conversation room
            if (conversationId) {
                socket.to(`conv:${conversationId}`).emit("messagesRead", { byUserId: userId, conversationId });
            }
            // Also notify directly
            const senderSocket = userSocketMap[senderId];
            if (senderSocket) {
                io.to(senderSocket).emit("messagesRead", { byUserId: userId, conversationId });
            }
        });

        // ── Disconnect ───────────────────────────────────────────
        socket.on("disconnect", () => {
            if (userId) {
                delete userSocketMap[userId];
                io.emit("onlineUsers", Object.keys(userSocketMap));
            }
        });
    });
};

export const getReceiverSocketId = (userId) => userSocketMap[userId];
export { io };