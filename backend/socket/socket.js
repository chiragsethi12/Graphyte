import { Server } from "socket.io";

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

    io.on("connection", (socket) => {
        const userId = socket.handshake.query.userId;
        if (userId && userId !== "undefined") {
            userSocketMap[userId] = socket.id;
            socket.join(`user:${userId}`);
        }

        // Broadcast online users list to everyone
        io.emit("onlineUsers", Object.keys(userSocketMap));

        // ── Conversation rooms ───────────────────────────────────
        // Clients join a conversation room when viewing it for efficient
        // broadcasting of messages, typing, and read receipts.
        socket.on("joinConversation", (conversationId) => {
            if (conversationId) socket.join(`conv:${conversationId}`);
        });

        socket.on("leaveConversation", (conversationId) => {
            if (conversationId) socket.leave(`conv:${conversationId}`);
        });

        // ── Typing indicators ────────────────────────────────────
        socket.on("typing", ({ recipientId, conversationId }) => {
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