import { useState, useEffect, useRef } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { Search, MapPin, Filter, MessageSquare, Briefcase, Sparkles, Newspaper } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "../lib/axios";
import { useAuth } from "../context/AuthContext";
import useConnectionStatus from "../hooks/useConnectionStatus";
import MainLayout from "../components/layout/MainLayout";
import Avatar from "../components/ui/Avatar";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import JobCard from "../components/jobs/JobCard";
import Badge from "../components/ui/Badge";

// Connection action button that isolates event propagation
function ConnectionActionButton({ userId }) {
  const { status, isLoading, sendRequest, withdraw, respond, remove } = useConnectionStatus(userId);

  if (isLoading) {
    return (
      <Button size="xs" variant="outline" disabled className="w-24">
        <div className="w-3.5 h-3.5 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
      </Button>
    );
  }

  const handleAction = (e, callback) => {
    e.preventDefault();
    e.stopPropagation();
    callback();
  };

  switch (status) {
    case "connected":
      return (
        <Button
          size="xs"
          variant="outline"
          onClick={(e) => handleAction(e, () => remove.mutate())}
          loading={remove.isPending}
          className="w-24 text-green-400 border-green-900/50 hover:bg-green-950/25"
        >
          Connected
        </Button>
      );
    case "pending_outgoing":
      return (
        <Button
          size="xs"
          variant="outline"
          onClick={(e) => handleAction(e, () => withdraw.mutate())}
          loading={withdraw.isPending}
          className="w-24 text-amber-400 border-amber-900/50 hover:bg-amber-950/25"
        >
          Requested
        </Button>
      );
    case "pending_incoming":
      return (
        <div className="flex gap-1" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
          <Button
            size="xs"
            variant="primary"
            onClick={(e) => handleAction(e, () => respond.mutate("accept"))}
            loading={respond.isPending}
          >
            Accept
          </Button>
          <Button
            size="xs"
            variant="outline"
            onClick={(e) => handleAction(e, () => respond.mutate("reject"))}
            loading={respond.isPending}
          >
            Decline
          </Button>
        </div>
      );
    default:
      return (
        <Button
          size="xs"
          variant="primary"
          onClick={(e) => handleAction(e, () => sendRequest.mutate())}
          loading={sendRequest.isPending}
          className="w-24"
        >
          Connect
        </Button>
      );
  }
}

// UserCard matching requests exactly
function UserCard({ user, currentUser }) {
  const navigate = useNavigate();
  const mySkills = currentUser?.skills || [];
  const uSkills = user?.skills || [];
  const sharedSkills = uSkills.filter((s) => mySkills.some((ms) => ms.toLowerCase() === s.toLowerCase()));
  const sharedCount = sharedSkills.length;

  return (
    <Card className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:shadow-md hover:border-border-muted transition-all duration-150">
      <Link to={`/profile/${user.username || user._id}`} className="flex gap-3 min-w-0 flex-1">
        <Avatar src={user.profilePic} name={user.name} size="md" />
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-text-primary text-sm hover:text-accent transition-colors truncate">
            {user.name}
          </div>
          <p className="text-xs text-text-muted truncate mt-0.5">{user.headline}</p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5 text-[11px] text-text-faint">
            {user.location && (
              <span className="flex items-center gap-0.5"><MapPin size={10} /> {user.location}</span>
            )}
            {sharedCount > 0 && (
              <span className="text-accent font-medium">{sharedCount} shared skill{sharedCount !== 1 ? "s" : ""}</span>
            )}
          </div>
        </div>
      </Link>

      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
        <Button
          size="xs"
          variant="outline"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            navigate(`/messaging?user=${user._id}`);
          }}
          className="flex-shrink-0"
        >
          <MessageSquare size={12} className="mr-1 inline" /> Message
        </Button>
        <ConnectionActionButton userId={user._id} />
      </div>
    </Card>
  );
}

// Compact post card without comment section
function CompactPostCard({ post }) {
  return (
    <Card className="p-4 hover:shadow-md hover:border-border-muted transition-all">
      <div className="flex items-start gap-3">
        <Link to={`/profile/${post.author?.username || post.author?._id}`}>
          <Avatar src={post.author?.profilePic} name={post.author?.name} size="sm" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <Link to={`/profile/${post.author?.username || post.author?._id}`} className="font-semibold text-xs text-text-primary hover:text-accent transition-colors">
              {post.author?.name}
            </Link>
            {post.author?.headline && (
              <span className="text-[10px] text-text-muted truncate max-w-[200px]">{post.author.headline}</span>
            )}
          </div>
          <p className="text-[10px] text-text-faint mt-0.5">{new Date(post.createdAt).toLocaleDateString()}</p>
          <p className="text-sm text-text-muted mt-2 line-clamp-3 leading-relaxed whitespace-pre-wrap">{post.content}</p>
          {post.image && (
            <img src={post.image} alt="Post content" className="mt-3 rounded-lg max-h-48 object-cover w-full" />
          )}
          {post.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {post.tags.map((t) => (
                <span key={t} className="text-[10px] px-2 py-0.5 bg-bg-base text-text-muted rounded-full font-medium border border-border">#{t}</span>
              ))}
            </div>
          )}
          <div className="flex gap-4 mt-3 text-xs text-text-faint font-medium border-t border-border pt-2.5">
            <span>♥ {post.likesCount || 0} likes</span>
            <span>💬 {post.commentsCount || 0} comments</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const qParam = searchParams.get("q") || "";
  const [searchInput, setSearchInput] = useState(qParam);
  const [query, setQuery] = useState(qParam);

  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'people' | 'jobs' | 'posts'
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ skills: "", location: "", company: "" });

  // Sync inputs with URL query param '?q='
  useEffect(() => {
    setSearchInput(qParam);
    setQuery(qParam);
  }, [qParam]);

  // Debounce search input to set search query state
  useEffect(() => {
    const handler = setTimeout(() => {
      setQuery(searchInput);
      if (searchInput) {
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          next.set("q", searchInput);
          return next;
        });
      } else {
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          next.delete("q");
          return next;
        });
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput, setSearchParams]);

  // Query search endpoint
  const { data, isLoading } = useQuery({
    queryKey: ["search", query, activeTab, filters],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set("q", query);
      // Map 'people' to 'users' for backend search controller compatibility
      params.set("type", activeTab === "people" ? "users" : activeTab);
      if (filters.skills) params.set("skills", filters.skills);
      if (filters.location) params.set("location", filters.location);
      if (filters.company && activeTab === "people") params.set("company", filters.company);
      return api.get(`/search?${params}`).then((r) => r.data);
    },
    enabled: query.length > 1,
  });

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchInput.trim().length > 1) {
      setQuery(searchInput.trim());
      setSearchParams({ q: searchInput.trim() });
    }
  };

  const users = data?.users || [];
  const jobs = data?.jobs || [];
  const posts = data?.posts || [];

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  return (
    <MainLayout>
      <div className="max-w-[720px] mx-auto space-y-4">
        {/* Search Input Bar */}
        <div className="relative">
          <form onSubmit={handleSearchSubmit} className="relative z-10">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-faint" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search people, jobs, posts..."
              className="w-full pl-11 pr-28 py-3 text-sm bg-bg-elevated border border-border text-text-primary rounded-xl shadow-md focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters((f) => !f)}
                className="flex items-center gap-1 text-text-muted hover:text-text-primary hover:bg-bg-hover min-h-[36px]"
              >
                <Filter size={14} /> Filters
              </Button>
              <Button type="submit" variant="primary" size="sm">Search</Button>
            </div>
          </form>
        </div>

        {/* Collapsible Filters Panel */}
        {showFilters && (
          <Card className="p-4 space-y-3 bg-bg-elevated border border-border shadow-sm">
            <div className="flex items-center justify-between border-b border-border pb-2 mb-1">
              <h3 className="font-bold text-sm text-text-primary flex items-center gap-1.5 font-display">
                <Filter size={14} className="text-accent" /> Advanced Filters
              </h3>
              <button
                onClick={() => setFilters({ skills: "", location: "", company: "" })}
                className="text-xs font-semibold text-accent hover:text-accent-hover transition-colors"
              >
                Clear all
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-text-muted mb-1 block">Skills</label>
                <input
                  value={filters.skills}
                  onChange={(e) => setFilters((f) => ({ ...f, skills: e.target.value }))}
                  placeholder="React, Node.js..."
                  className="w-full px-3 py-2 text-xs bg-bg-base border border-border text-text-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/55"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-text-muted mb-1 block">Location</label>
                <input
                  value={filters.location}
                  onChange={(e) => setFilters((f) => ({ ...f, location: e.target.value }))}
                  placeholder="New York, Remote..."
                  className="w-full px-3 py-2 text-xs bg-bg-base border border-border text-text-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/55"
                />
              </div>
              {activeTab === "people" && (
                <div>
                  <label className="text-xs font-semibold text-text-muted mb-1 block">Company</label>
                  <input
                    value={filters.company}
                    onChange={(e) => setFilters((f) => ({ ...f, company: e.target.value }))}
                    placeholder="Google, Meta..."
                    className="w-full px-3 py-2 text-xs bg-bg-base border border-border text-text-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/55"
                  />
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Tab switchers */}
        {query.length > 1 && (
          <div className="flex gap-1 border-b border-border">
            {[
              { id: "all", label: "All" },
              { id: "people", label: "People" },
              { id: "jobs", label: "Jobs" },
              { id: "posts", label: "Posts" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-[2px] transition-all duration-150 min-h-[44px] ${
                  activeTab === tab.id
                    ? "border-accent text-accent"
                    : "border-transparent text-text-muted hover:text-text-primary"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Search Results rendering */}
        {query.length > 1 ? (
          isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-bg-elevated rounded-xl border border-border h-24 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Tab: People */}
              {activeTab === "people" && (
                <div className="space-y-2">
                  {users.length === 0 ? (
                    <Card className="text-center py-10 text-text-muted text-sm bg-bg-elevated">No people matched your search</Card>
                  ) : (
                    users.map((u) => <UserCard key={u._id} user={u} currentUser={currentUser} />)
                  )}
                </div>
              )}

              {/* Tab: Jobs */}
              {activeTab === "jobs" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {jobs.length === 0 ? (
                    <Card className="text-center py-10 text-text-muted text-sm col-span-full bg-bg-elevated">No jobs matched your search</Card>
                  ) : (
                    jobs.map((j) => (
                      <Link key={j._id} to={`/jobs`}>
                        <JobCard job={j} />
                      </Link>
                    ))
                  )}
                </div>
              )}

              {/* Tab: Posts */}
              {activeTab === "posts" && (
                <div className="space-y-3">
                  {posts.length === 0 ? (
                    <Card className="text-center py-10 text-text-muted text-sm bg-bg-elevated">No posts matched your search</Card>
                  ) : (
                    posts.map((p) => <CompactPostCard key={p._id} post={p} />)
                  )}
                </div>
              )}

              {/* Tab: All Mixed Categories preview */}
              {activeTab === "all" && (
                <div className="space-y-6">
                  {users.length === 0 && jobs.length === 0 && posts.length === 0 ? (
                    <Card className="text-center py-12 text-text-muted bg-bg-elevated">
                      <Search size={32} className="mx-auto mb-3 text-text-faint" />
                      <p className="font-semibold text-text-primary font-display">No results found for "{query}"</p>
                      <p className="text-xs text-text-faint mt-1">Try refining your search terms or filters.</p>
                    </Card>
                  ) : (
                    <>
                      {/* People Mixed Results */}
                      {users.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between px-1">
                            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5 font-display">
                              <Sparkles size={13} className="text-accent" /> People
                            </h3>
                            <button
                              onClick={() => handleTabChange("people")}
                              className="text-xs font-semibold text-accent hover:text-accent-hover transition-colors"
                            >
                              See all ({users.length})
                            </button>
                          </div>
                          <div className="space-y-2">
                            {users.slice(0, 3).map((u) => (
                              <UserCard key={u._id} user={u} currentUser={currentUser} />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Jobs Mixed Results */}
                      {jobs.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between px-1">
                            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5 font-display">
                              <Briefcase size={13} className="text-accent" /> Jobs
                            </h3>
                            <button
                              onClick={() => handleTabChange("jobs")}
                              className="text-xs font-semibold text-accent hover:text-accent-hover transition-colors"
                            >
                              See all ({jobs.length})
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {jobs.slice(0, 3).map((j) => (
                              <Link key={j._id} to={`/jobs`}>
                                <JobCard job={j} />
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Posts Mixed Results */}
                      {posts.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between px-1">
                            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5 font-display">
                              <Newspaper size={13} className="text-accent" /> Posts
                            </h3>
                            <button
                              onClick={() => handleTabChange("posts")}
                              className="text-xs font-semibold text-accent hover:text-accent-hover transition-colors"
                            >
                              See all ({posts.length})
                            </button>
                          </div>
                          <div className="space-y-3">
                            {posts.slice(0, 3).map((p) => (
                              <CompactPostCard key={p._id} post={p} />
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )
        ) : (
          /* Empty onboarding search view */
          <Card className="text-center py-16 text-text-muted bg-bg-elevated border border-border">
            <Search size={40} className="mx-auto mb-4 text-text-faint" />
            <p className="font-bold text-text-primary text-base font-display">Search the Graphyte network</p>
            <p className="text-sm mt-1">Find colleagues, jobs, or trending posts across the platform</p>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
