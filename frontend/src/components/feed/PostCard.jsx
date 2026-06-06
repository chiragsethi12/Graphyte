import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Heart, MessageCircle, Share2, Trash2, MoreHorizontal,
  ChevronDown, ChevronUp, Send, X, Bookmark, Pencil,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/axios";
import { useAuth } from "../../context/AuthContext";
import Avatar from "../ui/Avatar";
import Button from "../ui/Button";
import ConfirmAction from "../ui/ConfirmDialog";
import ImageLightbox from "../ui/ImageLightbox";
import formatRelativeTime from "../../utils/formatRelativeTime";
import toast from "react-hot-toast";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatText(text) {
  if (!text) return null;
  const regex = /(\*\*.*?\*\*|\*.*?\*)/g;
  const splitText = text.split(regex);
  
  return splitText.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className="font-bold">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={index} className="italic">{part.slice(1, -1)}</em>;
    }
    return <span key={index}>{part}</span>;
  });
}

// ─── Comment Component ────────────────────────────────────────────────────────

function Comment({ comment, postId, onReply }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isOwner = user?._id === comment.user?._id;

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/posts/${postId}/comment/${comment._id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      toast.success("Comment deleted");
    },
    onError: () => toast.error("Failed to delete comment"),
  });

  return (
    <div className="flex gap-2.5">
      <Link to={`/profile/${comment.user?.username || comment.user?._id}`}>
        <Avatar src={comment.user?.profilePic} name={comment.user?.name} size="xs" />
      </Link>
      <div className="flex-1 min-w-0">
        <div className="bg-bg-hover rounded-md px-3 py-2.5 border border-border">
          <Link
            to={`/profile/${comment.user?.username || comment.user?._id}`}
            className="text-xs font-semibold text-text-primary hover:text-accent"
          >
            {comment.user?.name}
          </Link>
          <p className="text-sm text-text-primary mt-0.5 leading-relaxed">{comment.text}</p>
        </div>
        <div className="flex items-center gap-3 mt-1.5 px-1">
          <span className="text-[10px] text-text-faint">{formatRelativeTime(comment.createdAt)}</span>
          <button
            onClick={() => onReply(comment)}
            className="text-[10px] font-semibold text-text-muted hover:text-accent transition-colors"
          >
            Reply
          </button>
          {isOwner && (
            <ConfirmAction
              onConfirm={() => deleteMutation.mutate()}
              message="Delete comment?"
              confirmLabel="Delete"
            >
              {(requestConfirm) => (
                <button
                  onClick={requestConfirm}
                  className="text-[10px] font-semibold text-semantic-destructive hover:text-red-500 transition-colors"
                >
                  Delete
                </button>
              )}
            </ConfirmAction>
          )}
        </div>

        {/* Replies */}
        {comment.replies?.length > 0 && (
          <div className="mt-2 space-y-2 pl-3 border-l-2 border-border">
            {comment.replies.map((reply) => (
              <Comment key={reply._id} comment={reply} postId={postId} onReply={onReply} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Share Modal ──────────────────────────────────────────────────────────────

function ShareModal({ postId, onClose }) {
  const [text, setText] = useState("");
  const queryClient = useQueryClient();

  const shareMutation = useMutation({
    mutationFn: () => api.post(`/posts/${postId}/share`, { content: text }),
    onSuccess: () => {
      toast.success("Post shared to your feed!");
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to share"),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-bg-overlay rounded-xl border border-border shadow-lg w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-text-primary">Share Post</h3>
          <button onClick={onClose} className="p-1.5 rounded-md text-text-muted hover:bg-bg-hover hover:text-text-primary">
            <X size={16} />
          </button>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment about this post... (optional)"
          rows={3}
          className="w-full px-3 py-2 text-sm bg-bg-elevated border border-border rounded-md resize-none text-text-primary placeholder-text-faint focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
        />
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => shareMutation.mutate()}
            loading={shareMutation.isPending}
          >
            Share
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Edit Modal ──────────────────────────────────────────────────────────────────

function EditModal({ post, onClose, onSave }) {
  const [editContent, setEditContent] = useState(post.content || "");
  const queryClient = useQueryClient();

  const editMutation = useMutation({
    mutationFn: (content) => api.patch(`/posts/${post._id}`, { content }),
    onMutate: async (content) => {
      // Optimistic update
      onSave(content);
      return { previousContent: post.content };
    },
    onError: (err, _content, context) => {
      // Rollback
      if (context?.previousContent !== undefined) {
        onSave(context.previousContent);
      }
      toast.error(err.response?.data?.message || "Failed to edit post");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["userPosts"] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-bg-overlay rounded-xl border border-border shadow-lg w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-text-primary">Edit Post</h3>
          <button onClick={onClose} className="p-1.5 rounded-md text-text-muted hover:bg-bg-hover hover:text-text-primary">
            <X size={16} />
          </button>
        </div>
        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          rows={4}
          maxLength={3000}
          className="w-full px-3 py-2 text-sm bg-bg-elevated border border-border rounded-md resize-none text-text-primary placeholder-text-faint focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
        />
        <p className={`text-[10px] mt-1 text-right tabular-nums ${
          3000 - editContent.length < 100 ? "text-semantic-destructive font-bold" : "text-text-faint"
        }`}>
          {(3000 - editContent.length).toLocaleString()} remaining
        </p>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => editMutation.mutate(editContent.trim())}
            loading={editMutation.isPending}
            disabled={!editContent.trim()}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Post Card ────────────────────────────────────────────────────────────────

export default function PostCard({ post: initialPost }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [post, setPost] = useState(initialPost);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const isOwner = user?._id === post.author?._id;
  const canEdit = isOwner && (Date.now() - new Date(post.createdAt).getTime() < 10 * 60 * 1000);

  // ── Like ─────────────────────────────────────────────────────────────────
  const likeMutation = useMutation({
    mutationFn: () => api.put(`/posts/${post._id}/like`),
    onMutate: () => {
      // Optimistic update
      setPost((p) => ({
        ...p,
        isLiked: !p.isLiked,
        likesCount: p.isLiked ? Math.max(0, p.likesCount - 1) : p.likesCount + 1,
      }));
    },
    onSuccess: ({ data }) => {
      setPost((p) => ({
        ...p,
        isLiked: data.isLiked,
        likesCount: data.likesCount,
        engagementScore: data.engagementScore,
      }));
    },
    onError: () => {
      // Revert
      setPost(initialPost);
      toast.error("Failed to like post");
    },
  });

  // ── Delete Post ───────────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/posts/${post._id}`),
    onSuccess: () => {
      toast.success("Post deleted");
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["userPosts"] });
    },
    onError: () => toast.error("Failed to delete post"),
  });

  // ── Save / Bookmark ──────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: () =>
      isSaved
        ? api.delete(`/saved/${post._id}`)
        : api.post(`/saved/${post._id}`),
    onMutate: () => {
      setIsSaved((prev) => !prev);
    },
    onError: () => {
      setIsSaved((prev) => !prev);
      toast.error("Failed to update saved post");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["savedPosts"] });
    },
  });

  // ── Comments ──────────────────────────────────────────────────────────────
  const { data: commentsData, isLoading: commentsLoading } = useQuery({
    queryKey: ["comments", post._id],
    queryFn: () => api.get(`/posts/${post._id}/comments?limit=20`).then((r) => r.data),
    enabled: showComments,
  });

  const comments = commentsData?.comments || [];

  const commentMutation = useMutation({
    mutationFn: ({ content, parentComment }) =>
      api.post(`/posts/${post._id}/comment`, { content, parentComment }),
    onSuccess: () => {
      setCommentText("");
      setReplyingTo(null);
      queryClient.invalidateQueries({ queryKey: ["comments", post._id] });
      setPost((p) => ({ ...p, commentsCount: (p.commentsCount || 0) + 1 }));
    },
    onError: () => toast.error("Failed to post comment"),
  });

  const handleComment = () => {
    const trimmed = commentText.trim();
    if (!trimmed) return;
    commentMutation.mutate({
      content: trimmed,
      parentComment: replyingTo?._id || undefined,
    });
  };

  // ── Shared post preview ───────────────────────────────────────────────────
  const isShare = post.type === "share" && post.sharedPost;

  return (
    <>
      <div className="bg-bg-elevated rounded-xl border border-border shadow-md overflow-hidden">
        {/* Author row */}
        <div className="flex items-start justify-between p-4 pb-3">
          <Link
            to={`/profile/${post.author?.username || post.author?._id}`}
            className="flex items-center gap-3 group"
          >
            <Avatar src={post.author?.profilePic} name={post.author?.name} size="md" />
            <div>
              <p className="font-semibold text-sm text-text-primary group-hover:text-accent transition-colors">
                {post.author?.name}
              </p>
              <p className="text-xs text-text-muted line-clamp-1">{post.author?.headline}</p>
              <p className="text-[10px] text-text-faint mt-0.5">{formatRelativeTime(post.createdAt)}</p>
            </div>
          </Link>

          <div className="flex items-center gap-1">
            {canEdit && (
              <button
                onClick={() => setShowEditModal(true)}
                className="p-2 rounded-md text-text-muted hover:bg-bg-hover hover:text-accent transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                title="Edit post"
              >
                <Pencil size={14} />
              </button>
            )}
            {isOwner && (
              <ConfirmAction
                onConfirm={() => deleteMutation.mutate()}
                message="Delete this post?"
                confirmLabel="Delete"
              >
                {(requestConfirm) => (
                  <button
                    onClick={requestConfirm}
                    className="p-2 rounded-md text-text-muted hover:bg-bg-hover hover:text-semantic-destructive transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </ConfirmAction>
            )}
          </div>
        </div>

        {/* Content */}
        {post.content && (
          <div className="px-4 pb-3">
            <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap break-words">
              {formatText(post.content)}
            </p>
          </div>
        )}

        {/* Tags */}
        {post.tags?.length > 0 && (
          <div className="px-4 pb-3 flex flex-wrap gap-1">
            {post.tags.map((tag) => (
              <span key={tag} className="text-[11px] text-accent font-medium hover:underline cursor-pointer">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Image */}
        {post.image && (
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            className="w-full cursor-zoom-in focus:outline-none border-y border-border"
          >
            <img
              src={post.image}
              alt="Post"
              className="w-full max-h-[500px] object-cover"
              loading="lazy"
            />
          </button>
        )}

        {/* Shared post preview */}
        {isShare && post.sharedPost && (
          <div className="mx-4 mb-3 rounded-xl border border-border overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 bg-bg-hover border-b border-border">
              <Avatar
                src={post.sharedPost.author?.profilePic}
                name={post.sharedPost.author?.name}
                size="xs"
              />
              <span className="text-xs font-semibold text-text-primary">
                {post.sharedPost.author?.name}
              </span>
              <span className="text-[10px] text-text-faint">
                · {formatRelativeTime(post.sharedPost.createdAt)}
              </span>
            </div>
            <div className="p-3 bg-bg-base/30">
              <p className="text-sm text-text-muted line-clamp-3 break-words">{formatText(post.sharedPost.content)}</p>
              {post.sharedPost.image && (
                <img
                  src={post.sharedPost.image}
                  alt=""
                  className="mt-2 w-full h-32 object-cover rounded-md border border-border"
                  loading="lazy"
                />
              )}
            </div>
          </div>
        )}

        {/* Stats row */}
        <div className="px-4 py-2 flex items-center gap-1 text-xs text-text-muted border-t border-border">
          {post.likesCount > 0 && (
            <span className="flex items-center gap-1">
              <Heart size={11} className="text-semantic-destructive fill-semantic-destructive" /> {post.likesCount}
            </span>
          )}
          {post.likesCount > 0 && post.commentsCount > 0 && (
            <span className="mx-1">·</span>
          )}
          {post.commentsCount > 0 && (
            <button
              onClick={() => setShowComments((v) => !v)}
              className="hover:text-accent transition-colors"
            >
              {post.commentsCount} comment{post.commentsCount !== 1 ? "s" : ""}
            </button>
          )}
          {post.shares > 0 && (
            <>
              <span className="mx-1">·</span>
              <span>{post.shares} share{post.shares !== 1 ? "s" : ""}</span>
            </>
          )}
        </div>

        {/* Action buttons */}
        <div className="px-4 py-2 flex items-center gap-1 border-t border-border">
          <button
            onClick={() => likeMutation.mutate()}
            disabled={likeMutation.isPending}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold transition-colors min-h-[40px] flex-1 sm:flex-initial justify-center ${post.isLiked
                ? "text-semantic-destructive bg-semantic-destructive/10 border border-semantic-destructive/20"
                : "text-text-muted hover:bg-bg-hover hover:text-text-primary"
              }`}
          >
            <Heart size={15} className={post.isLiked ? "fill-semantic-destructive" : ""} />
            {post.isLiked ? "Liked" : "Like"}
          </button>

          <button
            onClick={() => setShowComments((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold text-text-muted hover:bg-bg-hover hover:text-text-primary transition-colors min-h-[40px] flex-1 sm:flex-initial justify-center"
          >
            <MessageCircle size={15} />
            Comment
            {showComments ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>

          <button
            onClick={() => setShowShareModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold text-text-muted hover:bg-bg-hover hover:text-text-primary transition-colors min-h-[40px] flex-1 sm:flex-initial justify-center"
          >
            <Share2 size={15} />
            Share
          </button>

          {/* Spacer to push bookmark to the right */}
          <div className="flex-1" />

          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold transition-colors min-h-[40px] flex-1 sm:flex-initial justify-center ${
              isSaved
                ? "text-accent bg-accent-muted border border-border-accent"
                : "text-text-muted hover:bg-bg-hover hover:text-text-primary"
            }`}
            title={isSaved ? "Unsave post" : "Save post"}
          >
            <Bookmark size={15} className={isSaved ? "fill-accent" : ""} />
            {isSaved ? "Saved" : "Save"}
          </button>
        </div>

        {/* Comments section */}
        {showComments && (
          <div className="border-t border-border px-4 py-3 space-y-3 bg-bg-elevated/40">
            {/* Comment input */}
            <div className="flex gap-2.5">
              <Avatar src={user?.profilePic} name={user?.name} size="xs" />
              <div className="flex-1 flex gap-2">
                <div className="flex-1">
                  {replyingTo && (
                    <div className="flex items-center gap-1 text-[10px] text-accent mb-1">
                      <span>Replying to {replyingTo.user?.name}</span>
                      <button onClick={() => setReplyingTo(null)}>
                        <X size={10} />
                      </button>
                    </div>
                  )}
                  <input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleComment()}
                    placeholder={replyingTo ? `Reply to ${replyingTo.user?.name}...` : "Write a comment..."}
                    className="w-full px-3 py-2.5 text-sm bg-bg-elevated border border-border rounded-md text-text-primary placeholder-text-faint focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent min-h-[44px]"
                  />
                </div>
                <button
                  onClick={handleComment}
                  disabled={!commentText.trim() || commentMutation.isPending}
                  className="self-end p-2.5 rounded-md bg-accent text-white hover:bg-accent-hover disabled:opacity-40 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>

            {/* Comments list */}
            {commentsLoading && (
              <div className="flex justify-center py-3">
                <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {!commentsLoading && comments.length === 0 && (
              <p className="text-xs text-center text-text-faint py-2">
                No comments yet. Be the first!
              </p>
            )}

            <div className="space-y-3">
              {comments.map((comment) => (
                <Comment
                  key={comment._id}
                  comment={comment}
                  postId={post._id}
                  onReply={setReplyingTo}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {showShareModal && (
        <ShareModal postId={post._id} onClose={() => setShowShareModal(false)} />
      )}

      {showEditModal && (
        <EditModal
          post={post}
          onClose={() => setShowEditModal(false)}
          onSave={(newContent) => setPost((p) => ({ ...p, content: newContent }))}
        />
      )}

      {lightboxOpen && post.image && (
        <ImageLightbox
          src={post.image}
          alt={`Post by ${post.author?.name}`}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}