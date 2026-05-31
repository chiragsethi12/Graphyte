import { useState, useEffect } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { Bell, X, CheckCheck } from "lucide-react";
import api from "../lib/axios";
import { useAuth } from "../context/AuthContext";
import MainLayout from "../components/layout/MainLayout";
import Avatar from "../components/ui/Avatar";
import formatRelativeTime from "../utils/formatRelativeTime";
import toast from "react-hot-toast";
import { usePageTitle } from "../hooks/usePageTitle";

// Sub-component for Connection Request Buttons
function ConnectionActionButtons({ senderId, onResponded }) {
  const [loading, setLoading] = useState(false);

  const handleAction = async (action) => {
    setLoading(true);
    try {
      // 1. Fetch connection status to get connectionId
      const statusRes = await api.get(`/connections/status/${senderId}`);
      const connectionId = statusRes.data.connectionId;

      if (!connectionId) {
        toast.error("Request not found");
        return;
      }

      // 2. Respond
      await api.put(`/connections/respond/${connectionId}`, { action });
      toast.success(action === "accept" ? "Request accepted" : "Request declined");
      onResponded();
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2 mt-3">
      <button
        disabled={loading}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleAction("accept"); }}
        className="px-5 py-2 text-sm font-semibold bg-primary text-white rounded-full hover:bg-primary-600 transition-colors disabled:opacity-50 min-h-[44px]"
      >
        Accept
      </button>
      <button
        disabled={loading}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleAction("reject"); }}
        className="px-5 py-2 text-sm font-semibold bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50 min-h-[44px]"
      >
        Decline
      </button>
    </div>
  );
}

function NotificationItem({ notification, onMarkRead, onDelete }) {
  const navigate = useNavigate();

  const getNotificationText = () => {
    const name = <span className="font-bold text-gray-900">{notification.sender?.name}</span>;
    switch (notification.type) {
      case "like": return <>{name} liked your post</>;
      case "comment": return <>{name} commented on your post</>;
      case "connectionRequest": return <>{name} sent you a connection request</>;
      case "connectionAccepted": return <>{name} accepted your connection request</>;
      case "postShare": return <>{name} shared your post</>;
      case "jobUpdate": return <>{name} posted a new job</>;
      case "commentLike": return <>{name} liked your comment</>;
      case "mention": return <>{name} mentioned you in a post</>;
      default: return notification.message ? <>{notification.message}</> : <>{name} interacted with you</>;
    }
  };

  const getLink = () => {
    if (notification.relatedPost) return `/post/${notification.relatedPost._id || notification.relatedPost}`;
    if (notification.type === "connectionRequest" || notification.type === "connectionAccepted") {
      return `/profile/${notification.sender?.username || notification.sender?._id}`;
    }
    if (notification.relatedJob) return `/jobs`;
    return `/profile/${notification.sender?.username || notification.sender?._id}`;
  };

  const handleClick = () => {
    if (!notification.read) onMarkRead(notification._id);
    const link = getLink();
    if (link) navigate(link);
  };

  return (
    <div
      onClick={handleClick}
      className={`group relative flex items-start gap-3 p-4 transition-colors cursor-pointer border-b border-surface-border last:border-0 hover:bg-gray-50 min-h-[72px] ${
        !notification.read ? "bg-primary-50/30" : "bg-white"
      }`}
    >
      {/* Unread indicator */}
      {!notification.read && (
        <div className="absolute left-2.5 top-8 w-2.5 h-2.5 rounded-full bg-primary" />
      )}

      {/* Avatar */}
      <div className="shrink-0 ml-4">
        <Link
          to={`/profile/${notification.sender?.username || notification.sender?._id}`}
          onClick={(e) => e.stopPropagation()}
          className="block hover:opacity-80 transition-opacity min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <Avatar src={notification.sender?.profilePic} name={notification.sender?.name} size="md" />
        </Link>
      </div>

      <div className="flex-1 min-w-0 py-1">
        <p className="text-sm text-gray-700 leading-snug">
          {getNotificationText()}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {formatRelativeTime(notification.createdAt)}
        </p>

        {notification.type === "connectionRequest" && (
          <ConnectionActionButtons
            senderId={notification.sender?._id}
            onResponded={() => onDelete(notification._id)}
          />
        )}
      </div>

      {/* Delete button */}
      <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity lg:block hidden">
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(notification._id); }}
          className="p-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          title="Delete"
        >
          <X size={18} />
        </button>
      </div>
      
      {/* Mobile visible delete */}
      <div className="shrink-0 lg:hidden block">
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(notification._id); }}
          className="p-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          title="Delete"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  usePageTitle("Notifications");
  const [filter, setFilter] = useState("all");
  const queryClient = useQueryClient();
  const { clearNotificationCount } = useAuth();

  const { data, fetchNextPage, hasNextPage, isLoading } = useInfiniteQuery({
    queryKey: ["notifications"],
    queryFn: ({ pageParam = 1 }) => api.get(`/notifications?page=${pageParam}`).then((r) => r.data),
    getNextPageParam: (lastPage) => (lastPage.page < lastPage.pages ? lastPage.page + 1 : undefined),
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => api.put(`/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/notifications/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => api.patch("/notifications/mark-all-read"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      clearNotificationCount();
      toast.success("Marked all as read");
    },
  });

  const notifications = data?.pages.flatMap((p) => p.notifications) || [];

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !n.read;
    if (filter === "connections") return ["connectionRequest", "connectionAccepted"].includes(n.type);
    if (filter === "posts") return ["like", "comment", "postShare", "commentLike", "mention"].includes(n.type);
    return true;
  });

  const tabs = [
    { id: "all", label: "All" },
    { id: "unread", label: "Unread" },
    { id: "connections", label: "Connections" },
    { id: "posts", label: "Posts" },
  ];

  return (
    <MainLayout>
      <div className="max-w-[720px] mx-auto mb-10">
        <div className="bg-white rounded-xl shadow-card border border-surface-border overflow-hidden">
          
          {/* Header */}
          <div className="px-5 py-4 border-b border-surface-border flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
            <button
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending || notifications.every(n => n.read)}
              className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-primary transition-colors disabled:opacity-50 disabled:hover:text-gray-600 min-h-[44px] px-3 -mr-3 rounded-lg hover:bg-gray-50"
            >
              <CheckCheck size={16} />
              Mark all as read
            </button>
          </div>

          {/* Filters */}
          <div className="px-3 py-2 border-b border-surface-border bg-gray-50/50 flex gap-1 overflow-x-auto hide-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors min-h-[44px] ${
                  filter === tab.id
                    ? "bg-primary text-white"
                    : "text-gray-600 hover:bg-gray-200/60"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="divide-y divide-surface-border bg-white min-h-[400px]">
            {isLoading && (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {!isLoading && filteredNotifications.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bell size={28} className="text-primary" />
                </div>
                <p className="text-lg font-bold text-gray-900 mb-1">You're all caught up! 🎉</p>
                <p className="text-sm text-gray-500">
                  {filter === "all"
                    ? "No notifications to show right now."
                    : `No ${filter} notifications.`}
                </p>
              </div>
            )}

            {!isLoading && filteredNotifications.map((n) => (
              <NotificationItem
                key={n._id}
                notification={n}
                onMarkRead={(id) => markReadMutation.mutate(id)}
                onDelete={(id) => deleteMutation.mutate(id)}
              />
            ))}

            {hasNextPage && (
              <div className="p-4 flex justify-center border-t border-surface-border">
                <button
                  onClick={() => fetchNextPage()}
                  className="px-6 py-2 bg-gray-100 text-gray-700 font-semibold rounded-full hover:bg-gray-200 transition-colors min-h-[44px]"
                >
                  Load More
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </MainLayout>
  );
}
