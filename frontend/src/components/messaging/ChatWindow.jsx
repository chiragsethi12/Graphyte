import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Send, Smile, Paperclip, MoreVertical, ArrowLeft, Image, X, FileText, Check, CheckCheck } from "lucide-react";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import { useAuth } from "../../context/AuthContext";
import { getSocket } from "../../lib/socket";
import {
  useMessageThread,
  useSendMessage,
  useMarkConversationRead,
} from "../../hooks/useMessages";
import Avatar from "../ui/Avatar";

/* ─── Quick Reply Constants ──────────────────────────────────────────────── */
const QUICK_REPLIES = [
  "Sounds good!",
  "Thanks for reaching out!",
  "Let's connect!",
  "I'll get back to you.",
  "Happy to chat!",
];

function getRandomReplies(arr, count = 3) {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

/* ─── Single message bubble ──────────────────────────────────────────────── */
function MessageBubble({ msg, isMine }) {
  const timeStr = new Date(msg.createdAt || Date.now()).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={`flex items-end gap-2 ${isMine ? "flex-row-reverse" : "flex-row"}`}>
      {!isMine && (
        <Avatar
          src={msg.sender?.profilePic}
          name={msg.sender?.name}
          size="xs"
        />
      )}
      <div
        className={`max-w-[70%] text-sm leading-relaxed ${
          isMine
            ? "bg-[#3A0018] border border-[#5A0025] text-white rounded-2xl rounded-br-sm"
            : "bg-[#141414] border border-[#2A2A2A] text-white rounded-2xl rounded-bl-sm"
        }`}
      >
        {/* Attachment image */}
        {msg.attachment?.url && (
          <div>
            <img
              src={msg.attachment.url}
              alt="Attachment"
              className={`max-w-full max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity ${
                msg.content ? "rounded-t-2xl" : "rounded-2xl"
              }`}
              onClick={() => window.open(msg.attachment.url, "_blank")}
            />
          </div>
        )}
        {/* Text content */}
        {msg.content && (
          <div className="px-4 py-2.5">
            {msg.content}
          </div>
        )}
        {/* Timestamp + read receipt */}
        <div className={`px-4 pb-2 ${!msg.content && msg.attachment?.url ? "pt-1" : ""} text-[10px] flex items-center justify-end gap-1 ${isMine ? "text-white/60" : "text-[#666]"}`}>
          {timeStr}
          {isMine && (
            msg.read
              ? <CheckCheck size={14} className="text-blue-300" />
              : <Check size={14} className="text-white/50" />
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Animated typing indicator ──────────────────────────────────────────── */
function TypingIndicator({ participant }) {
  return (
    <div className="flex items-center gap-2">
      <Avatar
        src={participant?.profilePic}
        name={participant?.name}
        size="xs"
      />
      <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl rounded-bl-sm px-4 py-2.5">
        <div className="flex gap-1 items-center h-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 bg-[#666] rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Main ChatWindow ────────────────────────────────────────────────────── */
export default function ChatWindow({ conversation, onBack }) {
  const { user, onlineUsers } = useAuth();
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const bottomRef = useRef(null);
  const typingTimer = useRef(null);
  const typingDebounce = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const emojiRef = useRef(null);

  const recipientId = conversation?.participant?._id;
  const conversationId = conversation?._id;
  const isOnline = recipientId && onlineUsers.includes(recipientId);

  const { data: msgData, isLoading, fetchNextPage, hasNextPage } = useMessageThread(recipientId);
  const sendMessage = useSendMessage(recipientId);
  const markRead = useMarkConversationRead(recipientId);

  // Flatten pages of messages (oldest first)
  const allMessages = msgData?.pages?.flatMap((p) => p.messages) || [];

  // Determine if last message was received (not sent by current user)
  const lastMessage = allMessages.length > 0 ? allMessages[allMessages.length - 1] : null;
  const lastMessageIsReceived = lastMessage
    && (lastMessage.sender?._id || lastMessage.sender) !== user?._id;

  // Get random quick replies (memoize to avoid reshuffling on every render)
  const quickReplies = useMemo(() => getRandomReplies(QUICK_REPLIES, 3), [lastMessage?._id]);

  // Join/leave conversation room for efficient socket broadcasting
  useEffect(() => {
    if (!conversationId) return;
    const socket = getSocket();
    if (!socket) return;

    socket.emit("joinConversation", conversationId);
    return () => {
      socket.emit("leaveConversation", conversationId);
    };
  }, [conversationId]);

  // Mark messages as read when conversation is opened
  useEffect(() => {
    if (recipientId && conversation?.unread > 0) {
      markRead.mutate();
    }
  }, [recipientId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages.length]);

  // Typing indicator via socket
  useEffect(() => {
    if (!recipientId) return;
    const socket = getSocket();
    if (!socket) return;

    const handleTyping = ({ userId }) => {
      if (userId === recipientId) {
        setIsTyping(true);
        clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => setIsTyping(false), 2500);
      }
    };

    const handleStopTyping = ({ userId }) => {
      if (userId === recipientId) setIsTyping(false);
    };

    socket.on("userTyping", handleTyping);
    socket.on("userStopTyping", handleStopTyping);

    return () => {
      socket.off("userTyping", handleTyping);
      socket.off("userStopTyping", handleStopTyping);
    };
  }, [recipientId]);

  // Close emoji picker on outside click
  useEffect(() => {
    const handler = (e) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Clean up image preview on unmount or conversation change
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    if (file.type.startsWith("image/")) {
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImagePreview(null);
    }
  }, []);

  const handleImageSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }, []);

  const removeFile = useCallback(() => {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (imageInputRef.current) imageInputRef.current.value = "";
  }, [imagePreview]);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed && !imageFile) return;
    if (sendMessage.isPending) return;

    if (imageFile) {
      const formData = new FormData();
      if (trimmed) formData.append("content", trimmed);
      formData.append("image", imageFile);
      sendMessage.mutate(formData);
    } else {
      sendMessage.mutate(trimmed);
    }

    setInput("");
    removeFile();
    setShowEmojiPicker(false);

    // Stop typing indicator
    const socket = getSocket();
    if (socket && recipientId) {
      socket.emit("stopTyping", { recipientId, conversationId });
    }
  }, [input, imageFile, sendMessage, recipientId, conversationId, removeFile]);

  const handleQuickReply = useCallback((reply) => {
    if (sendMessage.isPending) return;
    sendMessage.mutate(reply);
  }, [sendMessage]);

  const handleInputChange = useCallback((e) => {
    setInput(e.target.value);

    // Debounced typing indicator
    const socket = getSocket();
    if (socket && recipientId) {
      socket.emit("typing", { recipientId, conversationId });
      clearTimeout(typingDebounce.current);
      typingDebounce.current = setTimeout(() => {
        socket.emit("stopTyping", { recipientId, conversationId });
      }, 2000);
    }
  }, [recipientId, conversationId]);

  const handleEmojiSelect = useCallback((emoji) => {
    setInput((prev) => prev + emoji.native);
  }, []);

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  /* ─── Empty state (no conversation selected) ───────────────────── */
  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0A0A0A]">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-[#1A0008] flex items-center justify-center mx-auto mb-3 border border-[#3A0018]">
            <Send size={24} className="text-accent" />
          </div>
          <p className="font-medium text-text-primary">Select a conversation</p>
          <p className="text-sm text-text-muted mt-1">Choose from your messages on the left</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0A0A0A]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1E1E1E] bg-[#111111]">
        <div className="flex items-center gap-3">
          {/* Back button — visible on mobile */}
          {onBack && (
            <button
              onClick={onBack}
              className="lg:hidden p-1.5 -ml-1 rounded-lg text-text-muted hover:bg-bg-hover transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div className="relative">
            <Avatar
              src={conversation.participant?.profilePic}
              name={conversation.participant?.name}
              size="md"
            />
            {isOnline && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-[#111111] rounded-full" />
            )}
          </div>
          <div>
            <p className="font-semibold text-sm text-text-primary">
              {conversation.participant?.name}
            </p>
            <p className="text-xs text-text-muted">
              {isOnline ? (
                <span className="text-green-400 font-medium">Online</span>
              ) : (
                conversation.participant?.headline || "Offline"
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-2 rounded-lg text-text-muted hover:bg-bg-hover transition-colors">
            <MoreVertical size={18} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-[#0A0A0A]">
        {/* Load older messages */}
        {hasNextPage && (
          <div className="text-center">
            <button
              onClick={() => fetchNextPage()}
              className="text-xs text-accent hover:underline font-medium transition-colors"
            >
              Load older messages
            </button>
          </div>
        )}

        {isLoading && (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!isLoading && allMessages.length === 0 && (
          <div className="text-center text-xs text-text-muted mt-8">
            Start your conversation with {conversation.participant?.name}
          </div>
        )}

        {allMessages.map((msg) => {
          const senderId = msg.sender?._id || msg.sender;
          const isMine = senderId === user?._id;
          return <MessageBubble key={msg._id} msg={msg} isMine={isMine} />;
        })}

        {isTyping && <TypingIndicator participant={conversation.participant} />}

        <div ref={bottomRef} />
      </div>

      {/* Quick Reply Chips */}
      {lastMessageIsReceived && !input.trim() && (
        <div className="flex gap-2 px-4 pb-2 pt-1 flex-wrap border-t border-[#1E1E1E] bg-[#0A0A0A]">
          {quickReplies.map((reply) => (
            <button
              key={reply}
              onClick={() => handleQuickReply(reply)}
              disabled={sendMessage.isPending}
              className="px-3 py-1.5 text-xs font-medium bg-[#1A0008] border border-[#3A0018] text-[#FF4D6D] rounded-full hover:bg-[#2A0015] transition-colors disabled:opacity-50"
            >
              {reply}
            </button>
          ))}
        </div>
      )}

      {/* File / image preview bar */}
      {(imagePreview || (imageFile && !imagePreview)) && (
        <div className="border-t border-[#1E1E1E] bg-[#111111] px-4 py-2.5 flex items-center gap-3">
          <div className="relative">
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Preview"
                className="w-16 h-16 object-cover rounded-lg border border-[#2A2A2A]"
              />
            ) : (
              <div className="w-16 h-16 rounded-lg border border-[#2A2A2A] bg-[#141414] flex items-center justify-center">
                <FileText size={20} className="text-[#666]" />
              </div>
            )}
            <button
              onClick={removeFile}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#1A1A1A] border border-[#2A2A2A] text-text-primary rounded-full flex items-center justify-center hover:bg-[#2A2A2A] transition-colors"
            >
              <X size={12} />
            </button>
          </div>
          <div className="min-w-0">
            <p className="text-xs text-text-primary font-medium truncate">{imageFile?.name}</p>
            {imageFile?.size && (
              <p className="text-[10px] text-text-muted mt-0.5">{formatFileSize(imageFile.size)}</p>
            )}
          </div>
        </div>
      )}

      {/* Message input */}
      <div className="border-t border-[#1E1E1E] bg-[#111111] px-4 py-3">
        <div className="relative">
          {/* Emoji picker popup */}
          {showEmojiPicker && (
            <div ref={emojiRef} className="absolute bottom-full right-0 mb-2 z-50">
              <Picker
                data={data}
                onEmojiSelect={handleEmojiSelect}
                theme="dark"
                previewPosition="none"
                skinTonePosition="none"
                maxFrequentRows={1}
              />
            </div>
          )}

          <div className="flex items-center gap-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2">
            <button
              onClick={() => imageInputRef.current?.click()}
              className="text-[#666] hover:text-accent transition-colors flex-shrink-0"
              title="Send Image"
            >
              <Image size={17} />
            </button>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            <input
              value={input}
              onChange={handleInputChange}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="Write a message..."
              className="flex-1 bg-transparent text-white text-sm focus:outline-none placeholder-[#555]"
            />
            <button
              onClick={() => setShowEmojiPicker((p) => !p)}
              className={`transition-colors flex-shrink-0 ${showEmojiPicker ? "text-accent" : "text-[#666] hover:text-accent"}`}
              title="Emoji"
            >
              <Smile size={17} />
            </button>
            <button
              onClick={handleSend}
              disabled={(!input.trim() && !imageFile) || sendMessage.isPending}
              className="ml-1 w-8 h-8 rounded-lg bg-accent text-white flex items-center justify-center hover:bg-accent-hover disabled:opacity-40 transition-colors flex-shrink-0"
            >
              <Send size={15} />
            </button>
          </div>
        </div>

        {/* Action buttons row */}
        <div className="flex items-center gap-2 mt-2 pl-1">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 text-xs text-[#666] hover:text-accent hover:bg-accent/10 px-2.5 py-1.5 rounded-lg transition-colors min-h-[36px]"
          >
            <Paperclip size={13} />
            Attach File
          </button>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => imageInputRef.current?.click()}
            className="flex items-center gap-1.5 text-xs text-[#666] hover:text-accent hover:bg-accent/10 px-2.5 py-1.5 rounded-lg transition-colors min-h-[36px]"
          >
            <Image size={13} />
            Send Image
          </button>
        </div>
      </div>
    </div>
  );
}