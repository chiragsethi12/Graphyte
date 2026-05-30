import { useInfiniteQuery } from "@tanstack/react-query";
import { Bookmark, Sparkles } from "lucide-react";
import api from "../lib/axios";
import MainLayout from "../components/layout/MainLayout";
import PostCard from "../components/feed/PostCard";
import Card from "../components/ui/Card";
import useInfiniteScroll from "../hooks/useInfiniteScroll";

function SavedPostsSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-card shadow-card border border-surface-border p-5 animate-pulse space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/3" />
              <div className="h-3 bg-gray-200 rounded w-1/4" />
            </div>
          </div>
          <div className="h-20 bg-gray-150 rounded w-full" />
        </div>
      ))}
    </div>
  );
}

export default function SavedPostsPage() {
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["savedPosts"],
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({ limit: "12" });
      if (pageParam) params.set("cursor", pageParam);
      return api.get(`/saved?${params}`).then((r) => r.data);
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: null,
  });

  const savedItems = data?.pages?.flatMap((p) => p.savedPosts) || [];
  const posts = savedItems.map((item) => item.post).filter(Boolean);

  const sentinelRef = useInfiniteScroll(
    () => fetchNextPage(),
    !!hasNextPage,
    isFetchingNextPage
  );

  return (
    <MainLayout>
      <div className="max-w-[640px] mx-auto space-y-6">
        {/* Header */}
        <div className="pb-2 border-b border-surface-border">
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <Bookmark size={22} className="text-primary" /> Saved Posts
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Articles and insights you have bookmarked for later.
          </p>
        </div>

        {/* Results / List */}
        {isLoading ? (
          <SavedPostsSkeleton />
        ) : posts.length === 0 ? (
          <Card className="text-center py-16 px-6 relative overflow-hidden bg-white border border-surface-border">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-50/30 via-transparent to-primary-50/10 pointer-events-none" />
            <div className="relative z-10">
              <div className="w-16 h-16 bg-primary-50 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Bookmark size={28} strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                No saved posts yet
              </h3>
              <p className="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
                Bookmark posts to find them here. When you see a post in your feed, click the bookmark icon to save it.
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post._id} post={post} />
            ))}

            {/* Scroll Sentinel */}
            <div ref={sentinelRef} className="h-4" />

            {isFetchingNextPage && (
              <div className="flex justify-center py-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-gray-400">Loading more saved posts…</span>
                </div>
              </div>
            )}

            {!hasNextPage && posts.length > 0 && (
              <div className="text-center py-4 text-xs text-gray-400 font-medium">
                You've reached the end of your saved posts
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
