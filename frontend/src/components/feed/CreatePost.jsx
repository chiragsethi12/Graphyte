import { useState, useRef } from "react";
import { Image, X, Send, Loader2, Trophy } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/axios";
import { useAuth } from "../../context/AuthContext";
import Avatar from "../ui/Avatar";
import Button from "../ui/Button";
import toast from "react-hot-toast";

const MAX_CHARS = 3000;
const WARN_THRESHOLD = 0.8; // 80%

const MILESTONE_TEMPLATES = [
  { label: "New Role", template: "🎉 Excited to announce that I've joined {company} as {role}! Looking forward to this new chapter." },
  { label: "Graduated", template: "🎓 Just graduated from {school}! Grateful for the journey and excited for what's next." },
  { label: "Launched", template: "🚀 Thrilled to share that I've launched {project}! Check it out and let me know what you think." },
  { label: "Completed", template: "📜 Just completed {course}! Continuous learning is the key to growth." },
];

export default function CreatePost() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [postType, setPostType] = useState("standard");
  const [showTemplates, setShowTemplates] = useState(false);
  const fileInputRef = useRef(null);

  const charCount = content.length;
  const charPercent = charCount / MAX_CHARS;
  const isOverLimit = charCount > MAX_CHARS;
  const isWarning = charPercent >= WARN_THRESHOLD && !isOverLimit;

  const mutation = useMutation({
    mutationFn: async () => {
      if (!content.trim() && !image) {
        throw new Error("Post must have content or an image");
      }
      const fd = new FormData();
      if (content.trim()) fd.append("content", content.trim());
      if (image) fd.append("image", image);
      if (postType !== "standard") fd.append("postType", postType);
      return api.post("/posts/create", fd);
    },
    onSuccess: () => {
      setContent("");
      setImage(null);
      setPreview(null);
      setIsExpanded(false);
      setUploadError(null);
      setPostType("standard");
      setShowTemplates(false);
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["userPosts"] });
      toast.success(postType === "milestone" ? "Milestone published! 🏆" : "Post published!");
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || "Failed to publish post";
      setUploadError(msg);
      toast.error(msg);
    },
  });

  // Shared file validation
  const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
  const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

  const validateAndSetFile = (file) => {
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Only JPEG, PNG, WebP, and GIF images are allowed");
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error("Image must be under 10MB");
      return;
    }
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setUploadError(null);
    setIsExpanded(true);
  };

  const handleFile = (e) => {
    validateAndSetFile(e.target.files[0]);
    if (e.target) e.target.value = "";
  };

  // Drag-and-drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    validateAndSetFile(file);
  };

  const removeImage = () => {
    setImage(null);
    setPreview(null);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = () => {
    if (isOverLimit) {
      toast.error(`Post must be under ${MAX_CHARS} characters`);
      return;
    }
    mutation.mutate();
  };

  const handleSelectTemplate = (template) => {
    setContent(template.template);
    setPostType("milestone");
    setShowTemplates(false);
    setIsExpanded(true);
  };

  const handleMilestoneToggle = () => {
    if (postType === "milestone") {
      setPostType("standard");
      setShowTemplates(false);
    } else {
      setPostType("milestone");
      setShowTemplates(true);
      setIsExpanded(true);
    }
  };

  return (
    <div className={`bg-bg-elevated rounded-xl border overflow-hidden ${
      postType === "milestone" ? "border-[#F59E0B]/30" : "border-border"
    }`}>
      {/* Milestone indicator bar */}
      {postType === "milestone" && (
        <div className="bg-[#F59E0B]/10 border-b border-[#F59E0B]/20 px-4 py-2 flex items-center gap-2">
          <Trophy size={14} className="text-[#F59E0B]" />
          <span className="text-xs font-semibold text-[#F59E0B]">Career Milestone</span>
          <button
            onClick={() => { setPostType("standard"); setShowTemplates(false); }}
            className="ml-auto p-1 rounded text-[#F59E0B]/60 hover:text-[#F59E0B] transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div className="p-4">
        <div className="flex gap-3">
          <Avatar src={user?.profilePic} name={user?.name} size="md" />
          <div
            className={`flex-1 relative ${
              isDragging
                ? "ring-2 ring-accent ring-offset-bg-base rounded-xl bg-accent-muted/30"
                : ""
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Drag overlay indicator */}
            {isDragging && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl border-2 border-dashed border-accent bg-accent-muted/50 pointer-events-none">
                <p className="text-sm font-medium text-accent">Drop image here</p>
              </div>
            )}

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={() => setIsExpanded(true)}
              placeholder={postType === "milestone"
                ? "Share your career milestone..."
                : `What's on your mind, ${user?.name?.split(" ")[0]}?`}
              rows={isExpanded ? 4 : 2}
              maxLength={MAX_CHARS + 100}
              className="w-full text-sm bg-transparent text-text-primary placeholder-text-faint resize-none focus:outline-none leading-relaxed"
            />

            {/* Milestone template picker */}
            {showTemplates && (
              <div className="mb-3 grid grid-cols-2 gap-2">
                {MILESTONE_TEMPLATES.map((t) => (
                  <button
                    key={t.label}
                    onClick={() => handleSelectTemplate(t)}
                    className="text-left px-3 py-2.5 rounded-lg border border-[#F59E0B]/20 bg-[#F59E0B]/5 hover:bg-[#F59E0B]/10 hover:border-[#F59E0B]/40 transition-all text-xs text-text-muted"
                  >
                    <span className="font-semibold text-text-primary block mb-0.5">{t.label}</span>
                    <span className="text-[10px] text-text-faint line-clamp-1">{t.template.slice(0, 50)}...</span>
                  </button>
                ))}
              </div>
            )}

            {isExpanded && (
              <div className="flex items-center justify-between mt-0.5">
                <p className="text-[10px] text-text-faint">
                  Use <span className="font-mono">**bold**</span> and <span className="font-mono">*italic*</span> for formatting
                </p>
                <p
                  className={`text-[10px] font-medium tabular-nums transition-colors ${
                    isOverLimit
                      ? "text-semantic-destructive font-bold"
                      : MAX_CHARS - charCount < 100
                      ? "text-semantic-destructive/80"
                      : isWarning
                      ? "text-semantic-warning"
                      : "text-text-faint"
                  }`}
                >
                  {(MAX_CHARS - charCount).toLocaleString()} remaining
                </p>
              </div>
            )}

            {/* Image preview */}
            {preview && (
              <div className="relative mt-2 rounded-xl overflow-hidden group border border-border">
                {mutation.isPending && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10 rounded-xl">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 size={24} className="text-white animate-spin" />
                      <span className="text-xs text-white/80 font-medium">Uploading…</span>
                    </div>
                  </div>
                )}
                <img
                  src={preview}
                  alt="Preview"
                  className="max-h-64 w-full object-cover rounded-xl"
                />
                {!mutation.isPending && (
                  <button
                    onClick={removeImage}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            )}

            {/* Upload error */}
            {uploadError && !mutation.isPending && (
              <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-semantic-destructive/10 text-semantic-destructive border border-semantic-destructive/20 rounded-md text-xs">
                <span>{uploadError}</span>
                <button
                  onClick={() => { setUploadError(null); mutation.mutate(); }}
                  className="font-semibold underline hover:no-underline ml-auto"
                >
                  Retry
                </button>
              </div>
            )}

            {isExpanded && (
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-text-muted hover:bg-bg-hover hover:text-text-primary transition-colors min-h-[36px]"
                  >
                    <Image size={15} />
                    Photo
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={handleFile}
                  />
                  <button
                    type="button"
                    onClick={handleMilestoneToggle}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors min-h-[36px] ${
                      postType === "milestone"
                        ? "text-[#F59E0B] bg-[#F59E0B]/10"
                        : "text-text-muted hover:text-[#F59E0B] hover:bg-[#1A1200]"
                    }`}
                  >
                    <Trophy size={14} />
                    Milestone
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setContent("");
                      setImage(null);
                      setPreview(null);
                      setIsExpanded(false);
                      setUploadError(null);
                      setPostType("standard");
                      setShowTemplates(false);
                    }}
                    className="text-xs text-text-muted hover:text-text-primary transition-colors px-3 py-1.5 rounded-md hover:bg-bg-hover min-h-[36px]"
                  >
                    Cancel
                  </button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSubmit}
                    loading={mutation.isPending}
                    disabled={(!content.trim() && !image) || isOverLimit}
                  >
                    <Send size={14} /> Publish
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}