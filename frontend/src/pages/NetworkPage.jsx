import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { Check, X, UserPlus, Users, Clock, Send, Trash2, Search, MapPin } from "lucide-react";
import Fuse from "fuse.js";
import api from "../lib/axios";
import MainLayout from "../components/layout/MainLayout";
import Avatar from "../components/ui/Avatar";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import ConfirmAction from "../components/ui/ConfirmDialog";
import { ConnectionCardSkeleton } from "../components/ui/SkeletonScreens";
import toast from "react-hot-toast";

// Inline helper to calculate readable time-ago string
function formatTimeAgo(dateInput) {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

// Person Card for suggestions grid
function SuggestionCard({ person, onConnect, loading }) {
  return (
    <Card className="p-4 flex flex-col items-center text-center gap-3 hover:shadow-card-hover transition-all bg-white border border-surface-border">
      <Link to={`/profile/${person.username || person._id}`}>
        <Avatar src={person.profilePic} name={person.name} size="lg" />
      </Link>
      <div className="min-h-[4em] flex flex-col items-center">
        <Link to={`/profile/${person.username || person._id}`} className="font-bold text-gray-900 text-sm hover:text-primary transition-colors truncate max-w-[160px]">
          {person.name}
        </Link>
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 max-w-[180px]">{person.headline}</p>
      </div>
      <div className="text-[11px] text-gray-400 space-y-0.5 mt-1 min-h-[2.5em] flex flex-col justify-center">
        {person.mutualCount > 0 && (
          <p className="flex items-center justify-center gap-1">
            <Users size={11} className="text-gray-400" />
            {person.mutualCount} mutual connection{person.mutualCount !== 1 ? "s" : ""}
          </p>
        )}
        {person.sharedSkills > 0 && (
          <p className="text-primary font-medium">
            {person.sharedSkills} shared skill{person.sharedSkills !== 1 ? "s" : ""}
          </p>
        )}
      </div>
      <Button variant="outline" size="sm" fullWidth onClick={() => onConnect(person._id)} loading={loading} className="mt-2">
        <UserPlus size={13} className="mr-1 inline" /> Connect
      </Button>
    </Card>
  );
}

// Connection Row for pending invitations list
function PendingCard({ conn, onRespond, isPending }) {
  const sender = conn.sender;
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 hover:bg-gray-50/50 transition-colors">
      <Link to={`/profile/${sender?.username || sender?._id}`} className="flex items-center gap-3 min-w-0">
        <Avatar src={sender?.profilePic} name={sender?.name} size="md" />
        <div className="min-w-0">
          <p className="font-semibold text-sm text-gray-900 truncate">{sender?.name}</p>
          <p className="text-xs text-gray-500 truncate">{sender?.headline}</p>
          <span className="inline-flex items-center gap-1 text-[10px] text-gray-400 mt-1">
            <Clock size={10} /> Received {formatTimeAgo(conn.createdAt)}
          </span>
        </div>
      </Link>
      <div className="flex gap-2 self-end sm:self-center shrink-0">
        <Button
          size="sm"
          variant="primary"
          onClick={() => onRespond(conn._id, "accept")}
          loading={isPending}
        >
          <Check size={14} className="mr-1 inline" /> Accept
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onRespond(conn._id, "reject")}
          loading={isPending}
          className="text-gray-600 border-gray-200 hover:bg-gray-50"
        >
          <X size={14} className="mr-1 inline" /> Decline
        </Button>
      </div>
    </div>
  );
}

// Sent request card
function SentCard({ conn, onWithdraw }) {
  const recipient = conn.recipient;
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 hover:bg-gray-50/50 transition-colors">
      <Link to={`/profile/${recipient?.username || recipient?._id}`} className="flex items-center gap-3 min-w-0">
        <Avatar src={recipient?.profilePic} name={recipient?.name} size="md" />
        <div className="min-w-0">
          <p className="font-semibold text-sm text-gray-900 truncate">{recipient?.name}</p>
          <p className="text-xs text-gray-500 truncate">{recipient?.headline}</p>
        </div>
      </Link>
      <ConfirmAction
        onConfirm={() => onWithdraw(recipient._id)}
        message="Withdraw connection request?"
        confirmLabel="Withdraw"
        variant="warning"
      >
        {(requestConfirm) => (
          <Button
            size="sm"
            variant="outline"
            onClick={requestConfirm}
            className="text-red-500 border-red-200 hover:bg-red-50 shrink-0 self-end sm:self-center"
          >
            <X size={14} className="mr-1 inline" /> Withdraw
          </Button>
        )}
      </ConfirmAction>
    </div>
  );
}

export default function NetworkPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [connectionsSearch, setConnectionsSearch] = useState("");

  // Queries
  const { data: suggestionsData, isLoading: suggestionsLoading } = useQuery({
    queryKey: ["suggestions"],
    queryFn: () => api.get("/users/suggestions").then((r) => r.data),
  });

  const { data: pendingData } = useQuery({
    queryKey: ["pending"],
    queryFn: () => api.get("/connections/pending").then((r) => r.data),
  });

  const { data: sentData } = useQuery({
    queryKey: ["sentRequests"],
    queryFn: () => api.get("/connections/sent").then((r) => r.data),
  });

  const { data: connectionsData } = useQuery({
    queryKey: ["connections"],
    queryFn: () => api.get("/connections").then((r) => r.data),
  });

  const suggestions = suggestionsData?.users || [];
  const pending = pendingData?.requests || [];
  const sent = sentData?.requests || [];
  const connections = connectionsData?.connections || [];

  // Client-side search for connections with Fuse.js
  const filteredConnections = useMemo(() => {
    if (!connectionsSearch.trim()) return connections;
    const fuse = new Fuse(connections, {
      keys: ["name", "headline"],
      threshold: 0.35,
    });
    return fuse.search(connectionsSearch).map((r) => r.item);
  }, [connections, connectionsSearch]);

  // Mutations with Optimistic Updates
  const connectMutation = useMutation({
    mutationFn: (id) => api.post(`/connections/request/${id}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["suggestions"] });
      const previousSuggestions = queryClient.getQueryData(["suggestions"]);
      queryClient.setQueryData(["suggestions"], (old) => {
        if (!old?.users) return old;
        return {
          ...old,
          users: old.users.filter((u) => u._id !== id),
        };
      });
      return { previousSuggestions };
    },
    onError: (err, variables, context) => {
      if (context?.previousSuggestions) {
        queryClient.setQueryData(["suggestions"], context.previousSuggestions);
      }
      toast.error(err.response?.data?.message || "Failed to send request");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sentRequests"] });
      toast.success("Connection request sent!");
    },
  });

  const respondMutation = useMutation({
    mutationFn: ({ connectionId, action }) =>
      api.put(`/connections/respond/${connectionId}`, { action }),
    onMutate: async ({ connectionId }) => {
      await queryClient.cancelQueries({ queryKey: ["pending"] });
      const previousPending = queryClient.getQueryData(["pending"]);
      queryClient.setQueryData(["pending"], (old) => {
        if (!old?.requests) return old;
        return {
          ...old,
          requests: old.requests.filter((r) => r._id !== connectionId),
        };
      });
      return { previousPending };
    },
    onError: (err, variables, context) => {
      if (context?.previousPending) {
        queryClient.setQueryData(["pending"], context.previousPending);
      }
      toast.error(err.response?.data?.message || "Action failed");
    },
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ["connections"] });
      toast.success(action === "accept" ? "Connection accepted!" : "Invitation declined");
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: (recipientId) => api.delete(`/connections/withdraw/${recipientId}`),
    onMutate: async (recipientId) => {
      await queryClient.cancelQueries({ queryKey: ["sentRequests"] });
      const previousSent = queryClient.getQueryData(["sentRequests"]);
      queryClient.setQueryData(["sentRequests"], (old) => {
        if (!old?.requests) return old;
        return {
          ...old,
          requests: old.requests.filter((r) => r.recipient?._id !== recipientId && r.recipient !== recipientId),
        };
      });
      return { previousSent };
    },
    onError: (err, variables, context) => {
      if (context?.previousSent) {
        queryClient.setQueryData(["sentRequests"], context.previousSent);
      }
      toast.error(err.response?.data?.message || "Failed to withdraw request");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suggestions"] });
      toast.success("Request withdrawn");
    },
  });

  const removeMutation = useMutation({
    mutationFn: (userId) => api.delete(`/connections/${userId}`),
    onMutate: async (userId) => {
      await queryClient.cancelQueries({ queryKey: ["connections"] });
      const previousConnections = queryClient.getQueryData(["connections"]);
      queryClient.setQueryData(["connections"], (old) => {
        if (!old?.connections) return old;
        return {
          ...old,
          connections: old.connections.filter((c) => c._id !== userId),
        };
      });
      return { previousConnections };
    },
    onError: (err, variables, context) => {
      if (context?.previousConnections) {
        queryClient.setQueryData(["connections"], context.previousConnections);
      }
      toast.error(err.response?.data?.message || "Failed to remove connection");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suggestions"] });
      toast.success("Connection removed");
    },
  });

  return (
    <MainLayout>
      <div className="max-w-[800px] mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">My Network</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your professional connections and network requests.
          </p>
        </div>

        {/* 1. Pending Invitations */}
        {pending.length > 0 && (
          <Card className="bg-white border border-surface-border">
            <div className="px-5 py-4 border-b border-surface-border">
              <h2 className="font-bold text-gray-900 text-sm flex items-center justify-between">
                <span>Pending Invitations</span>
                <span className="px-2 py-0.5 text-xs bg-primary-50 text-primary font-semibold rounded-full">
                  {pending.length}
                </span>
              </h2>
            </div>
            <div className="divide-y divide-gray-100">
              {pending.map((conn) => (
                <PendingCard
                  key={conn._id}
                  conn={conn}
                  onRespond={(connectionId, action) => respondMutation.mutate({ connectionId, action })}
                  isPending={respondMutation.isPending}
                />
              ))}
            </div>
          </Card>
        )}

        {/* 2. Sent Requests */}
        {sent.length > 0 && (
          <Card className="bg-white border border-surface-border">
            <div className="px-5 py-4 border-b border-surface-border">
              <h2 className="font-bold text-gray-900 text-sm flex items-center justify-between">
                <span>Sent Requests</span>
                <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 font-semibold rounded-full">
                  {sent.length}
                </span>
              </h2>
            </div>
            <div className="divide-y divide-gray-100">
              {sent.map((conn) => (
                <SentCard
                  key={conn._id}
                  conn={conn}
                  onWithdraw={(id) => withdrawMutation.mutate(id)}
                />
              ))}
            </div>
          </Card>
        )}

        {/* 3. People You May Know (Suggestions Grid) */}
        <div className="space-y-3">
          <h2 className="font-bold text-gray-900 text-sm px-1">People You May Know</h2>
          {suggestionsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <ConnectionCardSkeleton key={i} />
              ))}
            </div>
          ) : suggestions.length === 0 ? (
            <Card className="text-center py-10 text-gray-400 text-sm bg-white border border-surface-border">
              No recommendations at the moment. Try adding more skills to your profile!
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {suggestions.map((person) => (
                <SuggestionCard
                  key={person._id}
                  person={person}
                  onConnect={(id) => connectMutation.mutate(id)}
                  loading={connectMutation.isPending && connectMutation.variables === person._id}
                />
              ))}
            </div>
          )}
        </div>

        {/* 4. My Connections List */}
        <Card className="bg-white border border-surface-border">
          <div className="px-5 py-4 border-b border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <span>My Connections</span>
              <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-500 rounded-full">
                {connections.length}
              </span>
            </h2>
            {/* Connection Search Input */}
            {connections.length > 0 && (
              <div className="relative w-full sm:w-60">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={connectionsSearch}
                  onChange={(e) => setConnectionsSearch(e.target.value)}
                  placeholder="Search connections..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary transition-all"
                />
              </div>
            )}
          </div>

          {connections.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm">
              <Users size={32} className="mx-auto mb-3 text-gray-300" />
              <p className="font-semibold text-gray-700">No connections yet</p>
              <p className="text-xs text-gray-400 mt-1">Start connecting with other professionals to grow your network.</p>
            </div>
          ) : filteredConnections.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-xs">
              No connections matched "{connectionsSearch}"
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredConnections.map((person) => (
                <div key={person._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 hover:bg-gray-50/50 transition-colors">
                  <Link to={`/profile/${person.username || person._id}`} className="flex items-center gap-3 min-w-0">
                    <Avatar src={person.profilePic} name={person.name} size="md" />
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-gray-900 truncate">{person.name}</p>
                      <p className="text-xs text-gray-500 truncate">{person.headline}</p>
                      {person.location && (
                        <p className="flex items-center gap-0.5 text-[10px] text-gray-400 mt-0.5">
                          <MapPin size={9} /> {person.location}
                        </p>
                      )}
                    </div>
                  </Link>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/messaging?user=${person._id}`)}
                      className="text-gray-600 border-gray-200 hover:bg-gray-50"
                    >
                      <Send size={13} className="mr-1 inline" /> Message
                    </Button>
                    <ConfirmAction
                      onConfirm={() => removeMutation.mutate(person._id)}
                      message={`Remove connection with ${person.name}?`}
                      confirmLabel="Remove"
                      variant="danger"
                    >
                      {(requestConfirm) => (
                        <button
                          onClick={requestConfirm}
                          className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors shrink-0"
                          title="Remove Connection"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </ConfirmAction>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </MainLayout>
  );
}
