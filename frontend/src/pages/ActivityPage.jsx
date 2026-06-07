import { useQuery } from "@tanstack/react-query";
import { BarChart2, Eye, Users, FileText, TrendingUp, Award, Heart, MessageCircle, Share2 } from "lucide-react";
import api from "../lib/axios";
import MainLayout from "../components/layout/MainLayout";
import Card from "../components/ui/Card";

const ICON_BG = {
  blue: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  purple: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
  green: "bg-green-500/10 text-green-400 border border-green-500/20",
  amber: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  primary: "bg-accent/10 text-accent border border-accent/20",
  red: "bg-red-500/10 text-red-400 border border-red-500/20",
};

function StatCard({ icon: Icon, label, value, subtitle, color = "primary" }) {
  const colorClass = ICON_BG[color] || ICON_BG.primary;
  return (
    <Card className="p-4 flex items-start gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
        <Icon size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-2xl text-text-primary">{value ?? "—"}</p>
        <p className="text-xs font-medium text-text-muted">{label}</p>
        {subtitle && <p className="text-[10px] text-text-faint mt-0.5">{subtitle}</p>}
      </div>
    </Card>
  );
}

function EngagementBar({ label, value, max }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <p className="text-xs text-text-muted w-20 shrink-0">{label}</p>
      <div className="flex-1 h-2 bg-bg-base border border-border rounded-full overflow-hidden">
        <div
          className="h-full bg-accent rounded-full transition-all duration-500"
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <p className="text-xs font-semibold text-text-primary w-10 text-right">{value}</p>
    </div>
  );
}

function TopPostCard({ post, index }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-bg-hover/50 transition-colors">
      <div className="w-6 h-6 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs font-bold shrink-0">
        {index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text-muted line-clamp-2">{post.content || "(No text)"}</p>
        <div className="flex gap-4 mt-1 text-xs text-text-faint">
          <span>♥ {post.likes}</span>
          <span>💬 {post.comments}</span>
          <span>🔄 {post.shares}</span>
        </div>
      </div>
      <div className="flex items-center gap-1 text-xs font-semibold text-accent shrink-0">
        <TrendingUp size={12} /> {post.engagementScore}
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-bg-elevated rounded-xl border border-border p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 skeleton rounded-xl" />
        <div className="flex-1 space-y-2">
          <div className="h-6 skeleton w-16" />
          <div className="h-3 skeleton w-28" />
        </div>
      </div>
    </div>
  );
}

export default function ActivityPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["analytics"],
    queryFn: () => api.get("/analytics/me").then((r) => r.data),
  });

  const analytics = data?.analytics;

  const maxEngagement = analytics
    ? Math.max(
      analytics.engagement.totalLikes,
      analytics.engagement.totalComments,
      analytics.engagement.totalShares,
      1
    )
    : 1;

  return (
    <MainLayout>
      <div className="max-w-[860px] mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-extrabold font-display text-text-primary">Insights</h1>
          <p className="text-sm text-text-muted mt-1">
            Your professional activity and content performance
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : analytics ? (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                icon={Eye}
                label="Profile Views"
                value={analytics.profileViews}
                color="blue"
              />
              <StatCard
                icon={Users}
                label="Connections"
                value={analytics.connectionCount}
                color="green"
              />
              <StatCard
                icon={FileText}
                label="Posts"
                value={analytics.postCount}
                color="purple"
              />
              <StatCard
                icon={TrendingUp}
                label="Avg Engagement"
                value={analytics.engagement.avgEngagementPerPost}
                subtitle="Per post engagement"
                color="amber"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Engagement breakdown */}
              <Card className="p-5">
                <h3 className="font-bold text-text-primary text-sm mb-4">Engagement Breakdown</h3>
                <div className="space-y-3">
                  <EngagementBar
                    label="Likes"
                    value={analytics.engagement.totalLikes}
                    max={maxEngagement}
                  />
                  <EngagementBar
                    label="Comments"
                    value={analytics.engagement.totalComments}
                    max={maxEngagement}
                  />
                  <EngagementBar
                    label="Shares"
                    value={analytics.engagement.totalShares}
                    max={maxEngagement}
                  />
                </div>
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs text-text-muted">
                    Avg engagement per post:{" "}
                    <strong className="text-text-primary">
                      {analytics.engagement.avgEngagementPerPost}
                    </strong>
                  </p>
                </div>
              </Card>

              {/* Last 30 days */}
              <Card className="p-5">
                <h3 className="font-bold text-text-primary text-sm mb-4">Last 30 Days</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-500/5 border border-green-500/10 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-green-400" />
                      <p className="text-xs font-medium text-green-300">New Connections</p>
                    </div>
                    <p className="text-lg font-bold text-green-400">
                      {analytics.last30Days.newConnections}
                    </p>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-500/5 border border-blue-500/10 rounded-lg">
                    <div className="flex items-center gap-2">
                      <BarChart2 size={14} className="text-blue-400" />
                      <p className="text-xs font-medium text-blue-300">Notifications Received</p>
                    </div>
                    <p className="text-lg font-bold text-blue-400">
                      {analytics.last30Days.notifications}
                    </p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-[11px] text-text-faint">
                    Member since{" "}
                    {new Date(analytics.memberSince).toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </Card>
            </div>

            {/* Top posts */}
            {analytics.topPosts?.length > 0 && (
              <Card className="p-5">
                <h3 className="font-bold text-text-primary text-sm mb-4">
                  🏆 Top Performing Posts
                </h3>
                <div className="divide-y divide-border">
                  {analytics.topPosts.map((post, i) => (
                    <TopPostCard key={post._id} post={post} index={i} />
                  ))}
                </div>
              </Card>
            )}

            {/* Skill stats */}
            {analytics.skillStats?.length > 0 && (
              <Card className="p-5">
                <h3 className="font-bold text-text-primary text-sm mb-4">
                  Skills Insights
                </h3>
                <p className="text-xs text-text-muted mb-4">
                  How many Graphyte professionals share your listed skills
                </p>
                <div className="space-y-3">
                  {analytics.skillStats.map((s) => (
                    <div key={s.skill} className="flex items-center justify-between">
                      <span className="text-sm text-text-muted font-medium">{s.skill}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-1.5 bg-bg-base border border-border rounded-full overflow-hidden">
                          <div
                            className="h-full bg-accent rounded-full"
                            style={{
                              width: `${Math.min((s.usersWithSkill / 100) * 100, 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs text-text-muted w-16 text-right">
                          {s.usersWithSkill} users
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </>
        ) : (
          <Card className="text-center py-12">
            <p className="text-text-muted">No analytics data available yet.</p>
            <p className="text-sm text-text-faint mt-1">
              Start posting and connecting to see your insights.
            </p>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}