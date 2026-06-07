import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Image, MessageCircle, FileText, PenSquare } from 'lucide-react';
import api from '../../lib/axios';
import Avatar from '../ui/Avatar';
import formatRelativeTime from '../../utils/formatRelativeTime';

const TABS = [
  { key: 'posts', label: 'Posts', icon: FileText },
  { key: 'comments', label: 'Comments', icon: MessageCircle },
  { key: 'images', label: 'Images', icon: Image },
];

function MiniPostCard({ post }) {
  return (
    <Link
      to={`/profile/${post.author?.username || post.author?._id}`}
      className="bg-bg-base rounded-xl border border-border overflow-hidden hover:shadow-md hover:border-border-muted transition-all group flex flex-col"
    >
      {post.image && (
        <div className="h-32 overflow-hidden">
          <img
            src={post.image}
            alt=""
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
          />
        </div>
      )}
      <div className="p-3.5 flex-1 flex flex-col">
        <p className="text-sm text-text-muted leading-snug line-clamp-3 break-words flex-1">
          {post.content}
        </p>
        <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-border">
          <Avatar src={post.author?.profilePic} name={post.author?.name} size="xs" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-text-primary truncate">{post.author?.name}</p>
            <p className="text-[10px] text-text-muted">{formatRelativeTime(post.createdAt)}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function ActivitySection({ userId, isOwner, userName }) {
  const [activeTab, setActiveTab] = useState('posts');

  const { data: postsData, isLoading } = useQuery({
    queryKey: ['userPosts', userId],
    queryFn: () => api.get(`/users/${userId}/posts`).then((r) => r.data),
    enabled: !!userId,
  });

  const allPosts = postsData?.posts || [];

  // Filter based on tab
  const filtered =
    activeTab === 'images'
      ? allPosts.filter((p) => p.image)
      : activeTab === 'comments'
      ? [] // Comments listing not typically available via posts endpoint
      : allPosts;

  const displayPosts = filtered.slice(0, 4);

  return (
    <div className="card p-6 md:p-7">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div>
          <h2 className="text-lg font-bold font-display text-text-primary">Activity</h2>
          {allPosts.length > 0 && (
            <p className="text-xs text-text-muted mt-0.5">
              {allPosts.length} post{allPosts.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        {isOwner && (
          <Link
            to="/feed"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border text-text-primary bg-bg-base text-sm font-semibold hover:bg-bg-hover hover:border-border-muted transition-all min-h-[44px]"
          >
            <PenSquare size={14} /> Create a post
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mt-4 mb-5">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeTab === key
                ? 'bg-accent text-white shadow-sm hover:bg-accent-hover'
                : 'text-text-muted hover:bg-bg-hover hover:text-text-primary'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="skeleton h-48 rounded-xl" />
          ))}
        </div>
      ) : displayPosts.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-sm text-text-muted">
            {activeTab === 'images'
              ? 'No image posts yet.'
              : activeTab === 'comments'
              ? 'Comment history is not available.'
              : isOwner
              ? 'You haven\'t posted yet. Share what\'s on your mind!'
              : `${userName || 'This user'} hasn't posted yet.`}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {displayPosts.map((post) => (
              <MiniPostCard key={post._id} post={post} />
            ))}
          </div>

          {allPosts.length > 4 && (
            <div className="mt-4 pt-4 border-t border-border text-center">
              <Link
                to={`/profile/${userId}`}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline min-h-[44px]"
              >
                Show all activity <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
