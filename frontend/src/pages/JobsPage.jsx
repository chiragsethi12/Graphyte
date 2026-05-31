import { useState, useEffect, useMemo } from "react";
import { Search, MapPin, Filter, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import api from "../lib/axios";
import MainLayout from "../components/layout/MainLayout";
import JobCard from "../components/jobs/JobCard";
import PostJobModal from "../components/jobs/PostJobModal";
import JobDetailModal from "../components/jobs/JobDetailModal";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { usePageTitle } from "../hooks/usePageTitle";

function JobsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white rounded-card shadow-card border border-surface-border p-5 animate-pulse flex flex-col gap-3">
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-gray-200 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-2/3" />
              <div className="h-3 bg-gray-200 rounded w-1/3" />
            </div>
          </div>
          <div className="h-12 bg-gray-100 rounded w-full mt-2 animate-pulse" />
          <div className="flex gap-2 mt-auto">
            <div className="h-6 bg-gray-100 rounded w-16" />
            <div className="h-6 bg-gray-100 rounded w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function JobsPage() {
  usePageTitle("Jobs");
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q") || "";
  const pageParam = parseInt(searchParams.get("page")) || 1;

  const [searchInput, setSearchInput] = useState(q);
  const [locationInput, setLocationInput] = useState("");
  const [debouncedLocation, setDebouncedLocation] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [expFilter, setExpFilter] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // "all" | "applied" | "listings"
  const [showPostModal, setShowPostModal] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState(null);

  // Sync search input with URL search param "?q" debounced 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (searchInput) {
          next.set("q", searchInput);
        } else {
          next.delete("q");
        }
        next.set("page", "1");
        return next;
      });
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput, setSearchParams]);

  // Sync debounced location
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedLocation(locationInput);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set("page", "1");
        return next;
      });
    }, 300);
    return () => clearTimeout(handler);
  }, [locationInput, setSearchParams]);

  // Sync searchInput when q parameter changes (e.g. on direct URL load or back navigation)
  useEffect(() => {
    setSearchInput(q);
  }, [q]);

  // Page state
  const page = pageParam;
  const setPage = (newPage) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("page", String(newPage));
      return next;
    });
  };

  // Queries
  // 1. All Jobs (Only active when tab is "all")
  const { data: allJobsData, isLoading: isAllLoading } = useQuery({
    queryKey: ["jobs", q, debouncedLocation, typeFilter, expFilter, page],
    queryFn: () =>
      api.get("/jobs", {
        params: {
          search: q || undefined,
          location: debouncedLocation || undefined,
          type: typeFilter || undefined,
          experienceLevel: expFilter || undefined,
          page,
        },
      }).then((r) => r.data),
    enabled: activeTab === "all",
    keepPreviousData: true,
  });

  // 2. My Applications (Only active when tab is "applied")
  const { data: myAppsData, isLoading: isAppsLoading } = useQuery({
    queryKey: ["myApplications"],
    queryFn: () => api.get("/jobs/my-applications").then((r) => r.data),
    enabled: activeTab === "applied",
  });

  // 3. My Listings (Only active when tab is "listings")
  const { data: myListingsData, isLoading: isListingsLoading } = useQuery({
    queryKey: ["myListings"],
    queryFn: () => api.get("/jobs/my-listings").then((r) => r.data),
    enabled: activeTab === "listings",
  });

  const currentJobs = useMemo(() => {
    if (activeTab === "all") return allJobsData?.jobs || [];
    if (activeTab === "applied") return myAppsData?.applications?.map((a) => a.job).filter(Boolean) || [];
    if (activeTab === "listings") return myListingsData?.jobs || [];
    return [];
  }, [activeTab, allJobsData, myAppsData, myListingsData]);

  const isLoading =
    (activeTab === "all" && isAllLoading) ||
    (activeTab === "applied" && isAppsLoading) ||
    (activeTab === "listings" && isListingsLoading);

  const totalPages = activeTab === "all" ? allJobsData?.pages || 1 : 1;

  return (
    <MainLayout>
      <div className="max-w-[1040px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-2 border-b border-surface-border">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Opportunities</h1>
            <p className="text-sm text-gray-500 mt-1">
              Professional placements curated for the Graphyte network.
            </p>
          </div>
          <Button size="sm" className="flex items-center gap-2 self-start" onClick={() => setShowPostModal(true)}>
            <Plus size={14} /> Post a Job
          </Button>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Left Side: Filter Panel */}
          <div className="w-full md:w-64 flex-shrink-0">
            <Card className="p-5 border border-surface-border bg-white shadow-sm space-y-5 sticky top-20">
              <h2 className="font-bold text-gray-900 text-sm border-b border-surface-border pb-3 flex items-center gap-2">
                <Filter size={15} className="text-primary" /> Filter Options
              </h2>

              {/* Search Bar */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-700">Search</label>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Title, company, skills..."
                    className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary transition-all"
                  />
                </div>
              </div>

              {/* Location Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-700">Location</label>
                <div className="relative">
                  <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    placeholder="City, state, or remote"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary transition-all"
                  />
                </div>
              </div>

              {/* Type Filter Select */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-700">Job Type</label>
                <select
                  value={typeFilter}
                  onChange={(e) => {
                    setTypeFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary transition-all"
                >
                  <option value="">All Types</option>
                  <option value="full-time">Full-Time</option>
                  <option value="part-time">Part-Time</option>
                  <option value="remote">Remote</option>
                  <option value="internship">Internship</option>
                  <option value="contract">Contract</option>
                </select>
              </div>

              {/* Experience Level Filter Select */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-700">Experience Level</label>
                <select
                  value={expFilter}
                  onChange={(e) => {
                    setExpFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary transition-all"
                >
                  <option value="">All Levels</option>
                  <option value="any">Any Experience</option>
                  <option value="entry">Entry Level</option>
                  <option value="mid">Mid Level</option>
                  <option value="senior">Senior Level</option>
                  <option value="lead">Lead / Principal</option>
                </select>
              </div>

              {/* Clear Filters Button */}
              {(searchInput || locationInput || typeFilter || expFilter) && (
                <button
                  onClick={() => {
                    setSearchInput("");
                    setLocationInput("");
                    setTypeFilter("");
                    setExpFilter("");
                    setPage(1);
                  }}
                  className="w-full text-center text-xs font-semibold text-gray-500 hover:text-primary transition-colors pt-2 border-t border-dashed border-gray-150"
                >
                  Clear All Filters
                </button>
              )}
            </Card>
          </div>

          {/* Main Area: Tabs, Grid & Pagination */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Tabs */}
            <div className="flex border-b border-surface-border">
              {[
                { id: "all", label: "All Jobs" },
                { id: "applied", label: "My Applications" },
                { id: "listings", label: "My Listings" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setActiveTab(t.id);
                    setPage(1);
                  }}
                  className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-[2px] transition-all duration-150 ${
                    activeTab === t.id
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:text-gray-900"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Results Grid / List */}
            {isLoading ? (
              <JobsSkeleton />
            ) : currentJobs.length === 0 ? (
              <Card className="text-center py-16 px-4 bg-white border border-surface-border">
                <p className="font-semibold text-gray-700 mb-1">No jobs found</p>
                <p className="text-sm text-gray-400">
                  {activeTab === "all"
                    ? "Try adjusting your search filters."
                    : activeTab === "applied"
                    ? "You haven't applied to any jobs yet."
                    : "You haven't posted any job listings yet."}
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentJobs.map((job) => (
                  <div
                    key={job._id}
                    className="cursor-pointer"
                    onClick={() => setSelectedJobId(job._id)}
                  >
                    <JobCard job={job} />
                  </div>
                ))}
              </div>
            )}

            {/* Pagination (only active on 'all' tab) */}
            {activeTab === "all" && totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-4 border-t border-surface-border">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm text-gray-600">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showPostModal && <PostJobModal onClose={() => setShowPostModal(false)} />}
      {selectedJobId && (
        <JobDetailModal jobId={selectedJobId} onClose={() => setSelectedJobId(null)} />
      )}
    </MainLayout>
  );
}