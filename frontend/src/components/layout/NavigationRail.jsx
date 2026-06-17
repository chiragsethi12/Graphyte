import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Home, Users, Briefcase, MessageSquare, Bell, Search, LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import api from "../../lib/axios";
import Avatar from "../ui/Avatar";
import SearchOverlay from "../search/SearchOverlay";

export default function NavigationRail() {
  const navigate = useNavigate();
  const { user, unreadNotifications, unreadMessages, logout } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);

  // Fetch pending connection invitations for badge
  const { data: pendingData } = useQuery({
    queryKey: ["pending"],
    queryFn: () => api.get("/connections/pending").then((r) => r.data),
    enabled: !!user,
  });
  const pendingCount = pendingData?.requests?.length || 0;

  useEffect(() => {
    const handleOpenSearch = () => {
      setSearchOpen(true);
    };
    window.addEventListener("open-search", handleOpenSearch);

    const handleKeyDown = (e) => {
      // Listen for Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key?.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("open-search", handleOpenSearch);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const navItems = [
    { to: "/feed",          icon: Home,          label: "Home" },
    { to: "/network",       icon: Users,         label: "Network",       badge: "pendingCount" },
    { to: "/jobs",          icon: Briefcase,     label: "Jobs" },
    { to: "/messaging",     icon: MessageSquare, label: "Messages",      badge: "unreadMessages" },
    { to: "/notifications", icon: Bell,          label: "Notifications", badge: "unreadNotifications" },
  ];

  return (
    <>
      <aside className="w-[220px] flex-shrink-0 hidden lg:flex flex-col h-screen sticky top-0 bg-[#0D0D0D] border-r border-[#1E1E1E] z-30">
        {/* Logo area */}
        <div className="px-4 py-5 flex items-center gap-2.5">
          <img src="/logo.png" alt="Graphyte Logo" className="w-7 h-7 object-contain rounded-lg" />
          <span className="font-bold text-white text-xs tracking-widest font-cinzel">GRAPHYTE</span>
        </div>

        {/* Search button */}
        <button
          onClick={() => setSearchOpen(true)}
          className="mx-3 mb-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] text-[#6B7280] text-sm hover:text-white hover:border-[#3A3A3A] transition-all focus:outline-none"
        >
          <Search size={14} />
          <span className="flex-1 text-left text-xs">Search...</span>
          <kbd className="text-[10px] bg-[#252525] px-1.5 py-0.5 rounded text-[#6B7280]">⌘K</kbd>
        </button>

        {/* Nav Items */}
        <nav className="flex-1 px-2 space-y-0.5">
          {navItems.map(({ to, icon: Icon, label, badge }) => {
            const badgeCount =
              badge === "unreadMessages" ? unreadMessages :
              badge === "unreadNotifications" ? unreadNotifications :
              badge === "pendingCount" ? pendingCount : 0;

            return (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                    isActive
                      ? "bg-[#1A0008] text-[#FF4D6D] border-l-2 border-[#7A0022]"
                      : "text-[#6B7280] hover:bg-[#141414] hover:text-[#D1D5DB]"
                  }`
                }
              >
                <Icon size={18} />
                <span className="flex-1">{label}</span>
                {badgeCount > 0 && (
                  <span className="min-w-[16px] h-4 px-1 text-[9px] font-bold text-white bg-[#FF4D6D] rounded-full flex items-center justify-center">
                    {badgeCount}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-[#1E1E1E] p-3 space-y-1">
          <NavLink
            to="/activity"
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                isActive ? "bg-[#1A0008] text-[#FF4D6D]" : "text-[#6B7280] hover:text-white hover:bg-[#141414]"
              }`
            }
          >
            Insights
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                isActive ? "bg-[#1A0008] text-[#FF4D6D]" : "text-[#6B7280] hover:text-white hover:bg-[#141414]"
              }`
            }
          >
            Settings
          </NavLink>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-[#6B7280] hover:text-[#FF4D6D] hover:bg-[#1A0008] transition-all focus:outline-none text-left"
          >
            <LogOut size={12} />
            Sign Out
          </button>
          <button
            onClick={() => navigate(`/profile/${user?.username || user?._id}`)}
            className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-[#141414] transition-all mt-2 focus:outline-none"
          >
            <Avatar src={user?.profilePic} name={user?.name} size="sm" />
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-[#6B7280]">View profile</p>
            </div>
          </button>
        </div>
      </aside>

      {/* Search Overlay */}
      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
