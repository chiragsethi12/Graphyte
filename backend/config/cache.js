import { LRUCache } from "lru-cache";

// ─── Trending Posts Cache ────────────────────────────────────────────────────
// Single-key cache ("trending") — TTL 5 minutes
const trendingCache = new LRUCache({
    max: 1,
    ttl: 5 * 60 * 1000, // 5 min
});

// ─── Recommended Jobs Cache ─────────────────────────────────────────────────
// Keyed by userId — TTL 10 minutes, max 200 users cached
const recommendedJobsCache = new LRUCache({
    max: 200,
    ttl: 10 * 60 * 1000, // 10 min
});

/** Clear the trending posts cache (call on any post create/edit/delete/like) */
export function invalidateTrending() {
    trendingCache.clear();
}

/**
 * Clear recommended jobs cache.
 * @param {string} [userId] — if provided, only that user's entry is evicted;
 *                             otherwise the entire cache is flushed.
 */
export function invalidateRecommendedJobs(userId) {
    if (userId) {
        recommendedJobsCache.delete(userId.toString());
    } else {
        recommendedJobsCache.clear();
    }
}

export { trendingCache, recommendedJobsCache };
