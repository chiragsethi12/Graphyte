import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/axios";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

/**
 * Hook for connection status between current user and another user.
 * Returns { status, connectionId, isLoading, sendRequest, withdraw, respond, remove }
 */
export default function useConnectionStatus(userId) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["connectionStatus", userId];

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => api.get(`/connections/status/${userId}`).then((r) => r.data),
    enabled: !!userId,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const sendRequest = useMutation({
    mutationFn: () => {
      if (user && !user.isVerified) {
        throw new Error("Please verify your email address to send connection requests.");
      }
      return api.post(`/connections/request/${userId}`);
    },
    onSuccess: invalidate,
    onError: (err) => {
      toast.error(err.message || err.response?.data?.message || "Failed to send connection request");
    },
  });

  const withdraw = useMutation({
    mutationFn: () => api.delete(`/connections/withdraw/${userId}`),
    onSuccess: invalidate,
  });

  const respond = useMutation({
    mutationFn: (action) =>
      api.put(`/connections/respond/${data?.connectionId}`, { action }),
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ["connections"] });
      queryClient.invalidateQueries({ queryKey: ["pending"] });
    },
  });

  const remove = useMutation({
    mutationFn: () => api.delete(`/connections/${userId}`),
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ["connections"] });
    },
  });

  return {
    status:       data?.status || "none",
    connectionId: data?.connectionId,
    isLoading,
    sendRequest,
    withdraw,
    respond,
    remove,
  };
}
