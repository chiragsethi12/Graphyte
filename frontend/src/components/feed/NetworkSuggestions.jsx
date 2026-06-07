import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/axios";
import Avatar from "../ui/Avatar";
import Button from "../ui/Button";
import toast from "react-hot-toast";

export default function NetworkSuggestions({ suggestions = [] }) {
  const queryClient = useQueryClient();

  const connectMutation = useMutation({
    mutationFn: (id) => api.post(`/connections/request/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suggestions"] });
      toast.success("Connection request sent!");
    },
    onError: () => toast.error("Failed to send request"),
  });

  if (!suggestions.length) return null;

  return (
    <div className="bg-bg-elevated rounded-xl border border-border p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-text-primary">Expand Your Network</h3>
        <Link to="/network" className="text-xs font-semibold text-accent hover:underline">View All</Link>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {suggestions.slice(0, 3).map((person) => (
          <div key={person._id} className="flex flex-col items-center text-center p-3 rounded-md bg-bg-base border border-border hover:bg-bg-hover hover:border-accent transition-colors">
            <Avatar src={person.profilePic} name={person.name} size="lg" />
            <p className="mt-2 text-xs font-semibold text-text-primary leading-tight line-clamp-1">{person.name}</p>
            <p className="text-[10px] text-text-muted mt-0.5 line-clamp-2 leading-tight">{person.headline}</p>
            <Button
              size="sm"
              variant="outline"
              className="mt-2 text-xs w-full"
              onClick={() => connectMutation.mutate(person._id)}
            >
              Connect
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
