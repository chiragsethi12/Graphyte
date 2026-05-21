import { useState, useEffect, useRef } from "react";
import { X, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "../../lib/axios";
import Avatar from "../ui/Avatar";
import { useAuth } from "../../context/AuthContext";

/**
 * Modal that fetches the current user's connections and lets them
 * pick someone to start (or resume) a conversation with.
 */
export default function NewMessageModal({ open, onClose, onSelect, existingConversations = [] }) {
  const { onlineUsers } = useAuth();
  const [search, setSearch] = useState("");
  const inputRef = useRef(null);

  // Fetch accepted connections
  const { data, isLoading } = useQuery({
    queryKey: ["connections"],
    queryFn: () => api.get("/connections").then((r) => r.data),
    enabled: open,
  });

  const connections = data?.connections || [];

  // Filter by search
  const filtered = connections.filter((c) =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.headline?.toLowerCase().includes(search.toLowerCase())
  );

  // Auto-focus the search input when opened
  useEffect(() => {
    if (open) {
      setSearch("");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleSelect = (connection) => {
    // Check if there's already an existing conversation with this person
    const existing = existingConversations.find(
      (c) => c.participant?._id === connection._id
    );

    if (existing) {
      // Reuse the existing conversation
      onSelect(existing);
    } else {
      // Create a virtual conversation object so ChatWindow can open immediately
      // The first message sent will create the real conversation in the DB
      const virtualConversation = {
        _id: `new_${connection._id}`,
        participant: {
          _id: connection._id,
          name: connection.name,
          username: connection.username,
          profilePic: connection.profilePic,
          headline: connection.headline,
        },
        lastMessage: "",
        lastMessageAt: null,
        unread: 0,
      };
      onSelect(virtualConversation);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">New message</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-gray-100">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search connections..."
              className="w-full pl-9 pr-3 py-2.5 text-sm bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
            />
          </div>
        </div>

        {/* Connection list */}
        <div className="max-h-80 overflow-y-auto">
          {isLoading && (
            <div className="flex flex-col gap-3 px-5 py-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                    <div className="h-2 bg-gray-200 rounded w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <p className="text-sm font-medium">
                {connections.length === 0
                  ? "No connections yet"
                  : "No connections match your search"}
              </p>
              <p className="text-xs mt-1">
                {connections.length === 0
                  ? "Connect with people to start messaging"
                  : "Try a different name"}
              </p>
            </div>
          )}

          {!isLoading && filtered.map((conn) => {
            const isOnline = onlineUsers.includes(conn._id);
            return (
              <button
                key={conn._id}
                onClick={() => handleSelect(conn)}
                className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="relative flex-shrink-0">
                  <Avatar
                    src={conn.profilePic}
                    name={conn.name}
                    size="md"
                  />
                  {isOnline && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {conn.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {conn.headline || conn.location || "Graphite member"}
                  </p>
                </div>
                {isOnline && (
                  <span className="text-[10px] text-green-600 font-medium flex-shrink-0">
                    Online
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
