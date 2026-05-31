import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useConversations, useMessageSocket } from "../hooks/useMessages";
import MainLayout from "../components/layout/MainLayout";
import ConversationList from "../components/messaging/ConversationList";
import ChatWindow from "../components/messaging/ChatWindow";
import NewMessageModal from "../components/messaging/NewMessageModal";
import api from "../lib/axios";
import { usePageTitle } from "../hooks/usePageTitle";

export default function MessagingPage() {
  usePageTitle("Messaging");
  const { user, clearMessageCount, fetchUnreadMessageCount } = useAuth();
  const [activeConversation, setActiveConversation] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showChat, setShowChat] = useState(false); // mobile: toggle list vs chat
  const [showNewModal, setShowNewModal] = useState(false);

  const { data, isLoading } = useConversations();
  const conversations = data?.conversations || [];

  const [searchParams, setSearchParams] = useSearchParams();
  const userIdFromUrl = searchParams.get("user");

  // Subscribe to real-time new messages
  useMessageSocket(activeConversation?.participant?._id);

  // Clear unread badge when entering the page
  useEffect(() => {
    clearMessageCount();
    return () => {
      // Refresh unread count when leaving the page
      fetchUnreadMessageCount();
    };
  }, []);

  // Auto-select the first conversation on desktop
  useEffect(() => {
    if (!activeConversation && conversations.length > 0) {
      setActiveConversation(conversations[0]);
    }
  }, [conversations, activeConversation]);

  useEffect(() => {
    if (!userIdFromUrl) return;
    if (isLoading) return; // wait for conversations to load

    // Check if there's an existing conversation with this user
    const existing = conversations.find(
      (c) => c.participant?._id === userIdFromUrl
    );

    if (existing) {
      handleSelectConversation(existing);
    } else {
      // No prior conversation — fetch the user's info to build a virtual conversation
      api.get(`/users/${userIdFromUrl}`).then((res) => {
        const targetUser = res.data.user || res.data;
        if (!targetUser?._id) return;

        const virtualConv = {
          _id: `new_${targetUser._id}`,
          participant: {
            _id: targetUser._id,
            name: targetUser.name,
            username: targetUser.username,
            profilePic: targetUser.profilePic,
            headline: targetUser.headline,
          },
          lastMessage: "",
          lastMessageAt: null,
          unread: 0,
        };
        handleSelectConversation(virtualConv);
      }).catch(console.error);
    }

    // Clear the URL param after processing so refresh doesn't re-trigger
    setSearchParams({}, { replace: true });
  }, [userIdFromUrl, conversations, isLoading]);

  const handleSelectConversation = (conv) => {
    setActiveConversation(conv);
    setShowChat(true); // On mobile, switch to chat view
    clearMessageCount();
    
    // Mark as read immediately when switching
    if (conv.unread > 0 && conv.participant?._id) {
      api.put(`/messages/${conv.participant._id}/read`).catch(console.error);
    }
  };

  const handleBack = () => {
    setShowChat(false); // On mobile, go back to list
  };

  const filtered = conversations.filter((c) =>
    c.participant?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="max-w-[1100px] mx-auto -mt-6 -mx-4 lg:-mx-6">
        <div className="flex h-[calc(100vh-60px)] bg-white rounded-card shadow-card border border-surface-border overflow-hidden">
          {/* Conversation panel — hidden on mobile when chat is open */}
          <div className={`w-full lg:w-80 flex-shrink-0 border-r border-surface-border ${showChat ? "hidden lg:block" : "block"}`}>
            <ConversationList
              conversations={filtered}
              activeId={activeConversation?._id}
              onSelect={handleSelectConversation}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              isLoading={isLoading}
              onNewClick={() => setShowNewModal(true)}
            />
          </div>

          {/* Chat window — hidden on mobile when list is shown */}
          <div className={`flex-1 min-w-0 ${!showChat ? "hidden lg:flex" : "flex"}`}>
            <ChatWindow
              conversation={activeConversation}
              onBack={handleBack}
            />
          </div>
        </div>
      </div>
      <NewMessageModal
        open={showNewModal}
        onClose={() => setShowNewModal(false)}
        onSelect={handleSelectConversation}
        existingConversations={conversations}
      />
    </MainLayout>
  );
}