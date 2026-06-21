import { useState, useRef } from 'react';
import {
  Plus, X, ExternalLink, Github, Edit2, Trash2,
  Loader2, Image as ImageIcon, ChevronLeft, ChevronRight, Code2,
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import Button from '../ui/Button';
import ConfirmAction from '../ui/ConfirmDialog';
import toast from 'react-hot-toast';

/* ─── Image Gallery (horizontal scroll with nav) ──────────────── */
function ImageGallery({ images }) {
  const scrollRef = useRef(null);
  const [active, setActive] = useState(0);

  if (!images || images.length === 0) return null;

  const scroll = (dir) => {
    const next = dir === 'left' ? Math.max(0, active - 1) : Math.min(images.length - 1, active + 1);
    setActive(next);
  };

  return (
    <div className="relative overflow-hidden rounded-t-xl bg-bg-base">
      <div
        ref={scrollRef}
        className="flex transition-transform duration-300 ease-out"
        style={{ transform: `translateX(-${active * 100}%)` }}
      >
        {images.map((src, i) => (
          <img
            key={i}
            src={src}
            alt={`Project image ${i + 1}`}
            className="w-full h-48 object-cover flex-shrink-0"
            loading="lazy"
          />
        ))}
      </div>

      {/* Nav arrows */}
      {images.length > 1 && (
        <>
          {active > 0 && (
            <button
              onClick={() => scroll('left')}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/70 transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
          )}
          {active < images.length - 1 && (
            <button
              onClick={() => scroll('right')}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/70 transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          )}
          {/* Dots */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  i === active ? 'bg-white w-3' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Project Card ────────────────────────────────────────────── */
function ProjectCard({ project, isOwner, onEdit, onDelete, deleting }) {
  return (
    <div className="bg-bg-elevated rounded-xl border border-border shadow-sm overflow-hidden group hover:border-accent/30 transition-all duration-200">
      <ImageGallery images={project.images} />

      {/* No-image placeholder */}
      {(!project.images || project.images.length === 0) && (
        <div className="h-28 bg-gradient-to-br from-accent-muted/40 to-bg-hover flex items-center justify-center rounded-t-xl">
          <Code2 size={32} className="text-text-faint" />
        </div>
      )}

      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-sm font-bold text-text-primary leading-tight line-clamp-1 group-hover:text-accent transition-colors">
            {project.title}
          </h3>
          {isOwner && (
            <div className="flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onEdit(project)}
                className="p-1.5 rounded-md text-text-faint hover:text-accent hover:bg-bg-hover transition-colors"
              >
                <Edit2 size={12} />
              </button>
              <ConfirmAction
                onConfirm={() => onDelete(project._id)}
                message={`Delete "${project.title}"?`}
                confirmLabel="Delete"
              >
                {(requestConfirm) => (
                  <button
                    onClick={requestConfirm}
                    disabled={deleting}
                    className="p-1.5 rounded-md text-text-faint hover:text-semantic-destructive hover:bg-bg-hover transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </ConfirmAction>
            </div>
          )}
        </div>

        {project.description && (
          <p className="text-xs text-text-muted leading-relaxed line-clamp-2 mb-3">
            {project.description}
          </p>
        )}

        {/* Tech stack chips */}
        {project.techStack && project.techStack.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {project.techStack.slice(0, 6).map((tech) => (
              <span
                key={tech}
                className="text-[10px] px-2 py-0.5 bg-accent-muted text-accent rounded-full font-semibold border border-border-accent"
              >
                {tech}
              </span>
            ))}
            {project.techStack.length > 6 && (
              <span className="text-[10px] px-2 py-0.5 bg-bg-hover text-text-faint rounded-full font-semibold border border-border">
                +{project.techStack.length - 6}
              </span>
            )}
          </div>
        )}

        {/* URL buttons */}
        <div className="flex gap-2 pt-2 border-t border-border">
          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent hover:underline transition-colors"
            >
              <ExternalLink size={11} /> Live
            </a>
          )}
          {project.repoUrl && (
            <a
              href={project.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-text-muted hover:text-text-primary transition-colors"
            >
              <Github size={11} /> Code
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Add/Edit Project Modal ──────────────────────────────────── */
function ProjectModal({ project, onClose, onSave, saving }) {
  const [title, setTitle] = useState(project?.title || '');
  const [description, setDescription] = useState(project?.description || '');
  const [techInput, setTechInput] = useState((project?.techStack || []).join(', '));
  const [liveUrl, setLiveUrl] = useState(project?.liveUrl || '');
  const [repoUrl, setRepoUrl] = useState(project?.repoUrl || '');
  const [newImages, setNewImages] = useState([]);
  const [existingImages, setExistingImages] = useState(project?.images || []);
  const [previews, setPreviews] = useState([]);
  const fileRef = useRef(null);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 5 - existingImages.length);
    setNewImages(files);
    setPreviews(files.map((f) => URL.createObjectURL(f)));
  };

  const removeExisting = (idx) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('description', description.trim());
    formData.append('techStack', JSON.stringify(
      techInput.split(',').map((s) => s.trim()).filter(Boolean)
    ));
    formData.append('liveUrl', liveUrl.trim());
    formData.append('repoUrl', repoUrl.trim());
    formData.append('existingImages', JSON.stringify(existingImages));
    newImages.forEach((f) => formData.append('images', f));

    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-bg-elevated rounded-2xl border border-border shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="text-base font-bold text-text-primary">
            {project ? 'Edit Project' : 'Add Project'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1.5">Title *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My Awesome Project"
              maxLength={120}
              autoFocus
              className="w-full text-sm border border-border bg-bg-base text-text-primary rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all placeholder:text-text-faint"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this project do? What problem does it solve?"
              maxLength={2000}
              rows={3}
              className="w-full text-sm border border-border bg-bg-base text-text-primary rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all resize-none placeholder:text-text-faint"
            />
          </div>

          {/* Tech Stack */}
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1.5">Tech Stack (comma separated)</label>
            <input
              value={techInput}
              onChange={(e) => setTechInput(e.target.value)}
              placeholder="React, Node.js, MongoDB"
              className="w-full text-sm border border-border bg-bg-base text-text-primary rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all placeholder:text-text-faint"
            />
          </div>

          {/* URLs */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1.5">Live URL</label>
              <input
                value={liveUrl}
                onChange={(e) => setLiveUrl(e.target.value)}
                placeholder="https://myproject.com"
                className="w-full text-sm border border-border bg-bg-base text-text-primary rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all placeholder:text-text-faint"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1.5">Repo URL</label>
              <input
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/..."
                className="w-full text-sm border border-border bg-bg-base text-text-primary rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all placeholder:text-text-faint"
              />
            </div>
          </div>

          {/* Images */}
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1.5">
              Screenshots (max {5 - existingImages.length} more)
            </label>

            {/* Existing images */}
            {existingImages.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-2">
                {existingImages.map((src, i) => (
                  <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-border group">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeExisting(i)}
                      className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} className="text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* New image previews */}
            {previews.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-2">
                {previews.map((src, i) => (
                  <div key={`new-${i}`} className="w-16 h-16 rounded-lg overflow-hidden border border-accent/30">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}

            {existingImages.length < 5 && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-border text-xs font-medium text-text-muted hover:border-accent/40 hover:text-accent hover:bg-bg-hover/50 transition-all"
              >
                <ImageIcon size={13} /> Choose Images
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-xl text-xs font-medium text-text-muted hover:bg-bg-hover transition-colors"
            >
              Cancel
            </button>
            <Button type="submit" disabled={!title.trim()} loading={saving}>
              {project ? 'Save Changes' : 'Add Project'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Main Projects Section ───────────────────────────────────── */
export default function ProjectsSection({ projects = [], isOwner = false, userId }) {
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (formData) => api.post('/projects', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', userId] });
      setShowModal(false);
      toast.success('Project added!');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to save'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, formData }) => api.put(`/projects/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', userId] });
      setEditingProject(null);
      toast.success('Project updated!');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/projects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', userId] });
      toast.success('Project deleted');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete'),
  });

  const handleSave = (formData) => {
    if (editingProject) {
      updateMutation.mutate({ id: editingProject._id, formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (project) => {
    setEditingProject(project);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Code2 size={17} className="text-accent" />
          <h2 className="text-lg font-bold font-display text-text-primary">Projects</h2>
          {projects.length > 0 && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-bg-hover text-text-faint border border-border font-semibold">
              {projects.length}
            </span>
          )}
        </div>
        {isOwner && projects.length < 10 && (
          <button
            onClick={() => { setEditingProject(null); setShowModal(true); }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-accent bg-accent-muted border border-border-accent hover:bg-accent/20 transition-all"
          >
            <Plus size={13} /> Add Project
          </button>
        )}
      </div>

      {/* Projects grid */}
      {projects.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {projects.map((project) => (
            <ProjectCard
              key={project._id}
              project={project}
              isOwner={isOwner}
              onEdit={handleEdit}
              onDelete={(id) => deleteMutation.mutate(id)}
              deleting={deleteMutation.isPending}
            />
          ))}
        </div>
      ) : (
        <div className="card p-6 md:p-7">
          {isOwner ? (
            <button
              onClick={() => { setEditingProject(null); setShowModal(true); }}
              className="w-full py-10 border-2 border-dashed border-border rounded-xl text-center hover:border-accent/40 hover:bg-bg-hover/50 transition-all group"
            >
              <Code2 size={32} className="mx-auto text-text-faint mb-2 group-hover:text-accent transition-colors" />
              <p className="text-sm text-text-muted font-medium group-hover:text-text-primary transition-colors">
                Showcase your projects
              </p>
              <p className="text-[11px] text-text-faint mt-1">
                Add projects to demonstrate your skills and experience to recruiters
              </p>
            </button>
          ) : (
            <div className="text-center py-8">
              <Code2 size={28} className="mx-auto text-text-faint mb-2" />
              <p className="text-sm text-text-muted">No projects added yet.</p>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showModal || editingProject) && (
        <ProjectModal
          project={editingProject}
          onClose={() => { setShowModal(false); setEditingProject(null); }}
          onSave={handleSave}
          saving={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  );
}
