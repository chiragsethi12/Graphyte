import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Newspaper, Users, Briefcase, MessageSquare, BarChart2,
  Search, Bell, Shield, Star, Crown, Settings
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "../../lib/axios";
import { useAuth } from "../../context/AuthContext";
import Button from "../ui/Button";
import JobDetailModal from "../jobs/JobDetailModal";

const navItems = [
  { to: "/feed",          icon: Newspaper,     label: "Feed" },
  { to: "/network",       icon: Users,         label: "Network" },
  { to: "/jobs",          icon: Briefcase,     label: "Jobs" },
  { to: "/messaging",     icon: MessageSquare, label: "Messaging" },
  { to: "/search",        icon: Search,        label: "Search" },
  { to: "/notifications", icon: Bell,          label: "Notifications" },
  { to: "/activity",      icon: BarChart2,     label: "Insights" },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const { user, unreadNotifications, unreadMessages } = useAuth();
  const [selectedJobId, setSelectedJobId] = useState(null);

  // Fetch recommended jobs
  const { data: recData, isLoading: isRecLoading } = useQuery({
    queryKey: ["recommendedJobs"],
    queryFn: () => api.get("/jobs/recommended").then((r) => r.data),
    enabled: !!user,
  });

  const recommendedJobs = recData?.jobs || [];

  return (
    <aside className="w-[220px] flex-shrink-0 hidden lg:flex flex-col h-screen sticky top-0 bg-white border-r border-surface-border">
      <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1">
        <nav className="flex flex-col gap-0.5">
          {navItems.map(({ to, icon: Icon, label }) => {
            const badgeCount =
              label === "Notifications" ? unreadNotifications :
              label === "Messaging" ? unreadMessages : 0;

            return (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                    isActive
                      ? "bg-primary-50 text-primary font-semibold"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={18} className={isActive ? "text-primary" : "text-gray-500"} />
                    {label}
                    {badgeCount > 0 && (
                      <span className="ml-auto min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-primary rounded-full flex items-center justify-center">
                        {badgeCount > 9 ? "9+" : badgeCount}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Recommended Jobs Section */}
        {user && (
          <div className="mt-6 pt-6 border-t border-surface-border flex flex-col gap-3">
            <div>
              <h3 className="text-xs font-bold text-gray-900 px-1">Recommended Jobs</h3>
              <p className="text-[10px] text-gray-500 mt-0.5 px-1 leading-normal line-clamp-2">
                Based on your skills: {user.skills?.length > 0 ? user.skills.join(", ") : "None added yet"}
              </p>
            </div>
            {isRecLoading ? (
              <div className="flex flex-col gap-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 bg-gray-50 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : recommendedJobs.length === 0 ? (
              <p className="text-[11px] text-gray-400 italic px-1">No recommendations found</p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {recommendedJobs.slice(0, 4).map((job) => (
                  <div
                    key={job._id}
                    onClick={() => setSelectedJobId(job._id)}
                    className="p-2 rounded-lg border border-gray-100 bg-white hover:border-primary hover:bg-primary-50/20 cursor-pointer transition-all duration-150"
                  >
                    <p className="text-xs font-semibold text-gray-800 truncate">{job.title}</p>
                    <p className="text-[10px] text-gray-500 truncate mt-0.5">{job.company} • {job.location}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom section */}
      <div className="border-t border-surface-border p-3 flex flex-col gap-3">
        <div className="bg-primary-900 rounded-xl p-3 text-white">
          <div className="flex items-center gap-1.5 mb-1">
            <Star size={12} className="text-amber-300" />
            <p className="text-[10px] font-semibold uppercase tracking-wider text-primary-200">Graphyte Pro</p>
          </div>
          <p className="font-bold text-sm mb-2">Elite Tier</p>
          <Button size="sm" variant="white" className="w-full text-primary-900">
            Upgrade to Gold
          </Button>
        </div>
        <div className="flex flex-col gap-0.5">
          <button
            onClick={() => navigate("/settings")}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <Settings size={14} /> Settings
          </button>
          <button
            onClick={() => navigate("/settings")}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <Shield size={14} /> Privacy
          </button>
        </div>
      </div>
      {selectedJobId && (
        <JobDetailModal jobId={selectedJobId} onClose={() => setSelectedJobId(null)} />
      )}
    </aside>
  );
}
