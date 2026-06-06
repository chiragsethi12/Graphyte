import { NavLink } from "react-router-dom";
import { Home, Users, Briefcase, MessageSquare, Bell } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import api from "../../lib/axios";

export default function MobileBottomNav() {
  const { user, unreadNotifications, unreadMessages } = useAuth();

  // Fetch connection invitations count reactively
  const { data: pendingData } = useQuery({
    queryKey: ["pending"],
    queryFn: () => api.get("/connections/pending").then((r) => r.data),
    enabled: !!user,
  });
  const pendingCount = pendingData?.requests?.length || 0;

  const navItems = [
    { to: "/feed",          icon: Home,          label: "Home" },
    { to: "/network",       icon: Users,         label: "Network",       badgeCount: pendingCount },
    { to: "/jobs",          icon: Briefcase,     label: "Jobs" },
    { to: "/messaging",     icon: MessageSquare, label: "Messages",      badgeCount: unreadMessages },
    { to: "/notifications", icon: Bell,          label: "Notifications", badgeCount: unreadNotifications },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[#0D0D0D] border-t border-[#1E1E1E] flex items-center justify-around lg:hidden z-40">
      {navItems.map(({ to, icon: Icon, label, badgeCount }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 h-full relative transition-colors ${
              isActive ? "text-[#FF4D6D]" : "text-[#6B7280] hover:text-[#D1D5DB]"
            }`
          }
        >
          <div className="relative">
            <Icon size={20} />
            {badgeCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 min-w-[14px] h-[14px] px-1 text-[8px] font-bold text-white bg-[#FF4D6D] rounded-full flex items-center justify-center">
                {badgeCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-1 font-medium">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
