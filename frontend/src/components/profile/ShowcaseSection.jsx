import { useState } from 'react';
import { ExternalLink, Plus, X, Link as LinkIcon, Loader2, FolderOpen } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import toast from 'react-hot-toast';

/* ─── Showcase Item Card ──────────────────────────────────────── */
function ShowcaseCard({ item, isOwner, onRemove, removing }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex flex-col bg-bg-base border border-border rounded-xl p-5 hover:border-accent/40 hover:bg-bg-hover transition-all duration-200"
    >
      {/* Remove button (owner only) */}
      {isOwner && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }}
          disabled={removing}
          className="absolute top-3 right-3 p-1.5 rounded-md text-text-faint hover:text-semantic-destructive hover:bg-bg-hover opacity-0 group-hover:opacity-100 transition-all min-h-[28px] min-w-[28px] flex items-center justify-center z-10"
        >
          <X size={13} />
        </button>
      )}

      {/* Icon + Title */}
      <div className="flex items-start gap-3 mb-2">
        <div className="w-9 h-9 rounded-lg bg-accent-muted border border-border-accent flex items-center justify-center flex-shrink-0 mt-0.5">
          <LinkIcon size={15} className="text-accent" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-text-primary truncate group-hover:text-accent transition-colors">
            {item.title}
          </p>
          <p className="text-[11px] text-text-faint truncate mt-0.5 font-mono">
            {item.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
          </p>
        </div>
      </div>

      {/* Description */}
      {item.description && (
        <p className="text-xs text-text-muted leading-relaxed line-clamp-2 mt-1">
          {item.description}
        </p>
      )}

      {/* External link indicator */}
      <div className="flex items-center gap-1 mt-3 pt-2.5 border-t border-border">
        <ExternalLink size={11} className="text-text-faint group-hover:text-accent transition-colors" />
        <span className="text-[10px] text-text-faint font-medium group-hover:text-accent transition-colors">
          Open link
        </span>
      </div>
    </a>
  );
}

/* ─── Add Showcase Form ───────────────────────────────────────── */
function AddShowcaseForm({ onSubmit, onCancel, saving }) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;
    let finalUrl = url.trim();
    if (!/^https?:\/\//i.test(finalUrl)) finalUrl = `https://${finalUrl}`;
    onSubmit({ title: title.trim(), url: finalUrl, description: description.trim() });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-bg-base border border-border rounded-xl p-5 space-y-3">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title (e.g., My Portfolio)"
        maxLength={80}
        autoFocus
        className="w-full text-sm border border-border bg-bg-elevated text-text-primary rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all placeholder:text-text-faint"
      />
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="URL (e.g., github.com/you)"
        maxLength={200}
        className="w-full text-sm border border-border bg-bg-elevated text-text-primary rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all placeholder:text-text-faint"
      />
      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Short description (optional)"
        maxLength={120}
        className="w-full text-sm border border-border bg-bg-elevated text-text-primary rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all placeholder:text-text-faint"
      />
      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-xs font-medium text-text-muted hover:bg-bg-hover hover:text-text-primary transition-colors min-h-[36px]"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || !title.trim() || !url.trim()}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-accent hover:bg-accent-hover disabled:opacity-50 transition-colors min-h-[36px]"
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
          Add
        </button>
      </div>
    </form>
  );
}

/* ─── Main Showcase Section ───────────────────────────────────── */
export default function ShowcaseSection({ items = [], isOwner = false, userId }) {
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: (showcase) => api.put('/users/profile', { showcase }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) => Array.isArray(query.queryKey) && query.queryKey[0] === 'profile',
      });
      setShowForm(false);
      toast.success('Showcase updated!');
    },
    onError: () => toast.error('Failed to save showcase'),
  });

  const handleAdd = (item) => {
    if (items.length >= 3) {
      toast.error('Maximum 3 showcase items');
      return;
    }
    saveMutation.mutate([...items, item]);
  };

  const handleRemove = (index) => {
    saveMutation.mutate(items.filter((_, i) => i !== index));
  };

  // Don't show this section for non-owners when empty
  if (!isOwner && items.length === 0) return null;

  return (
    <div className="card p-6 md:p-7">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <FolderOpen size={17} className="text-accent" />
          <h2 className="text-lg font-bold font-display text-text-primary">Showcase</h2>
        </div>
        {isOwner && items.length < 3 && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="p-2 rounded-xl text-text-muted hover:text-accent hover:bg-bg-hover transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <Plus size={16} />
          </button>
        )}
      </div>

      {/* Items grid */}
      {items.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
          {items.map((item, i) => (
            <ShowcaseCard
              key={`${item.url}-${i}`}
              item={item}
              isOwner={isOwner}
              onRemove={() => handleRemove(i)}
              removing={saveMutation.isPending}
            />
          ))}
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <AddShowcaseForm
          onSubmit={handleAdd}
          onCancel={() => setShowForm(false)}
          saving={saveMutation.isPending}
        />
      )}

      {/* Empty state for owner */}
      {isOwner && items.length === 0 && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-8 border-2 border-dashed border-border rounded-xl text-center hover:border-accent/40 hover:bg-bg-hover/50 transition-all group"
        >
          <FolderOpen size={28} className="mx-auto text-text-faint mb-2 group-hover:text-accent transition-colors" />
          <p className="text-sm text-text-muted font-medium group-hover:text-text-primary transition-colors">
            Pin your best work here
          </p>
          <p className="text-[11px] text-text-faint mt-1">
            Portfolio links, GitHub repos, or published articles
          </p>
        </button>
      )}
    </div>
  );
}
