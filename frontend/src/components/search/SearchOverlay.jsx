import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Search, Briefcase, Loader2 } from "lucide-react";
import api from "../../lib/axios";
import Avatar from "../ui/Avatar";

export default function SearchOverlay({ isOpen, onClose }) {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({ users: [], jobs: [] });
  const [isLoading, setIsLoading] = useState(false);

  // Load recent searches from localStorage
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const saved = localStorage.getItem("graphyte_recent_searches");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Autofocus input when overlay opens
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setResults({ users: [], jobs: [] });
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Handle Escape key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Debounced API search trigger
  useEffect(() => {
    if (query.trim().length <= 1) {
      setResults({ users: [], jobs: [] });
      return;
    }

    const timer = setTimeout(() => {
      setIsLoading(true);
      api
        .get(`/search?q=${encodeURIComponent(query.trim())}&type=all`)
        .then((res) => {
          setResults({
            users: res.data.users || [],
            jobs: res.data.jobs || [],
          });
        })
        .catch((err) => {
          console.error("Search query error", err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const handleSaveRecent = (term) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    const updated = [trimmed, ...recentSearches.filter((s) => s !== trimmed)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("graphyte_recent_searches", JSON.stringify(updated));
  };

  const handleInputKeyDown = (e) => {
    if (e.key === "Enter" && query.trim()) {
      handleSaveRecent(query);
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      onClose();
    }
  };

  const usersList = results.users.slice(0, 3);
  const jobsList = results.jobs.slice(0, 2);
  const hasResults = usersList.length > 0 || jobsList.length > 0;

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[999] flex items-start justify-center transition-all duration-200"
    >
      {/* Modal Container */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[600px] mt-[12vh] mx-4 bg-[#111111] border border-[#2A2A2A] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Input area */}
        <div className="relative flex items-center">
          <Search size={18} className="absolute left-5 text-[#6B7280]" />
          <input
            ref={inputRef}
            type="text"
            autoFocus
            placeholder="Search people, jobs, posts..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            className="w-full pl-12 pr-12 py-4.5 bg-transparent text-white text-base placeholder-[#6B7280] focus:outline-none"
          />
          {isLoading && (
            <Loader2 size={16} className="absolute right-5 text-[#6B7280] animate-spin" />
          )}
        </div>

        {/* Results / Suggestions panel */}
        <div className="border-t border-[#2A2A2A] max-h-[350px] overflow-y-auto">
          {/* Recent searches (query empty) */}
          {query.trim().length === 0 && (
            <div className="px-5 py-4">
              <p className="text-xs font-semibold text-[#6B7280] mb-2.5 uppercase tracking-wider">Recent Searches</p>
              {recentSearches.length === 0 ? (
                <p className="text-xs text-[#4B5563] italic">No recent searches</p>
              ) : (
                <div className="flex flex-col gap-1">
                  {recentSearches.map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setQuery(s);
                        handleSaveRecent(s);
                      }}
                      className="text-left w-full px-3 py-2 rounded-lg text-sm text-[#D1D5DB] hover:text-white hover:bg-[#1A1A1A] transition-colors focus:outline-none"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Typeahead Search Results */}
          {query.trim().length > 1 && (
            <>
              {/* No results indicator */}
              {!isLoading && !hasResults && (
                <div className="px-5 py-6 text-center text-sm text-[#6B7280]">
                  No results found for "{query}"
                </div>
              )}

              {/* People suggestions */}
              {usersList.length > 0 && (
                <div>
                  <div className="px-5 py-2.5 bg-[#161616] text-[10px] font-bold text-[#6B7280] uppercase tracking-wider border-b border-[#2A2A2A]">
                    People
                  </div>
                  {usersList.map((u) => (
                    <div
                      key={u._id}
                      onClick={() => {
                        handleSaveRecent(query);
                        navigate(`/profile/${u.username || u._id}`);
                        onClose();
                      }}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-[#1A1A1A] cursor-pointer transition-colors border-b border-[#1A1A1A] last:border-0"
                    >
                      <Avatar src={u.profilePic} name={u.name} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-white truncate">{u.name}</p>
                        <p className="text-xs text-[#6B7280] truncate">{u.headline}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Jobs suggestions */}
              {jobsList.length > 0 && (
                <div>
                  <div className="px-5 py-2.5 bg-[#161616] text-[10px] font-bold text-[#6B7280] uppercase tracking-wider border-y border-[#2A2A2A] first:border-t-0">
                    Jobs
                  </div>
                  {jobsList.map((j) => (
                    <div
                      key={j._id}
                      onClick={() => {
                        handleSaveRecent(query);
                        navigate(`/jobs?q=${encodeURIComponent(j.title)}`);
                        onClose();
                      }}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-[#1A1A1A] cursor-pointer transition-colors border-b border-[#1A1A1A] last:border-0"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#2A0015] border border-[#3D1A5E]/40 flex items-center justify-center text-[#FF4D6D] flex-shrink-0">
                        <Briefcase size={14} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-white truncate">{j.title}</p>
                        <p className="text-xs text-[#6B7280] truncate">{j.company} • {j.location}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer info (trigger all results) */}
        {query.trim().length > 1 && (
          <div
            onClick={() => {
              handleSaveRecent(query);
              navigate(`/search?q=${encodeURIComponent(query.trim())}`);
              onClose();
            }}
            className="px-5 py-3.5 bg-[#161616] hover:bg-[#202020] text-xs text-[#6B7280] hover:text-white cursor-pointer transition-colors border-t border-[#2A2A2A] text-center font-medium"
          >
            Press Enter to search all results
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
