import { useState } from "react";
import { X, AlertTriangle } from "lucide-react";
import Button from "./Button";
import { useMutation } from "@tanstack/react-query";
import api from "../../lib/axios";
import toast from "react-hot-toast";

export default function ReportModal({ isOpen, onClose, reportedUser, reportedPost, reportedComment }) {
  const [reason, setReason] = useState("spam");

  const reportMutation = useMutation({
    mutationFn: (data) => api.post("/reports", data),
    onSuccess: () => {
      toast.success("Report submitted successfully.");
      onClose();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to submit report");
    },
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    reportMutation.mutate({
      reportedUser,
      reportedPost,
      reportedComment,
      reason,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative">
        <div className="px-5 py-4 border-b border-[#1E1E1E] flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#FF4D6D]">
            <AlertTriangle size={18} />
            <h3 className="font-bold text-sm text-white font-display">Report Content</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[#1A1A1A] text-[#6B7280] hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#6B7280] mb-2">
              Select a reason for this report
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#0D0D0D] border border-[#2A2A2A] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
            >
              <option value="spam">Spam</option>
              <option value="harassment">Harassment</option>
              <option value="hate_speech">Hate Speech</option>
              <option value="inappropriate_content">Inappropriate Content</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={reportMutation.isPending}
              className="bg-accent hover:bg-accent-hover text-white px-5"
            >
              Submit Report
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
