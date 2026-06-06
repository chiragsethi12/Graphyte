import { useState } from 'react';
import { Edit2, X, Check, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import toast from 'react-hot-toast';

export default function AboutSection({ about, isOwner, userId }) {
  const [expanded, setExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const queryClient = useQueryClient();

  const text = about || '';
  const PREVIEW_LENGTH = 280;
  const MAX_CHARS = 2600;
  const isLong = text.length > PREVIEW_LENGTH;
  const displayText = expanded || !isLong ? text : text.slice(0, PREVIEW_LENGTH);

  const saveMutation = useMutation({
    mutationFn: (newAbout) => api.put('/users/profile', { about: newAbout }),
    onMutate: async (newAbout) => {
      // Cancel ongoing queries
      await queryClient.cancelQueries({ queryKey: ['profile'] });
      // Snapshot for rollback
      const previous = queryClient.getQueriesData({ queryKey: ['profile'] });
      // Optimistic update
      queryClient.setQueriesData({ queryKey: ['profile'] }, (old) => {
        if (!old?.user) return old;
        return { ...old, user: { ...old.user, about: newAbout } };
      });
      return { previous };
    },
    onError: (err, _vars, context) => {
      // Rollback
      if (context?.previous) {
        for (const [key, data] of context.previous) {
          queryClient.setQueryData(key, data);
        }
      }
      toast.error(err.response?.data?.message || 'Failed to update about');
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        predicate: (query) => Array.isArray(query.queryKey) && query.queryKey[0] === 'profile',
      });
      setIsEditing(false);
    },
    onSuccess: () => toast.success('About updated!'),
  });

  const handleStartEdit = () => {
    setEditText(text);
    setIsEditing(true);
  };

  const handleSave = () => {
    saveMutation.mutate(editText.trim());
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditText('');
  };

  const remaining = MAX_CHARS - editText.length;

  return (
    <div className="card p-6 md:p-7">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold font-display text-text-primary">About</h2>
        {isOwner && !isEditing && (
          <button
            onClick={handleStartEdit}
            className="p-2 rounded-xl text-text-muted hover:text-accent hover:bg-bg-hover transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <Edit2 size={16} />
          </button>
        )}
      </div>

      {isEditing ? (
        <div>
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            maxLength={MAX_CHARS + 50}
            rows={6}
            autoFocus
            placeholder="Tell the world about yourself..."
            className="w-full text-[15px] text-text-primary leading-[1.7] bg-bg-base border border-border rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
          />
          <div className="flex items-center justify-between mt-2">
            <p className={`text-[10px] tabular-nums font-medium ${
              remaining < 100 ? 'text-semantic-destructive' : 'text-text-muted'
            }`}>
              {remaining.toLocaleString()} remaining
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancel}
                disabled={saveMutation.isPending}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium text-text-muted hover:bg-bg-hover hover:text-text-primary transition-colors min-h-[44px]"
              >
                <X size={13} /> Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-accent hover:bg-accent-hover disabled:opacity-50 transition-colors min-h-[44px]"
              >
                {saveMutation.isPending ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Check size={13} />
                )}
                Save
              </button>
            </div>
          </div>
        </div>
      ) : text ? (
        <div>
          <p className="text-[15px] text-text-muted leading-[1.7] whitespace-pre-wrap break-words">
            {displayText}
            {isLong && !expanded && (
              <span className="text-text-faint">… </span>
            )}
          </p>
          {isLong && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="mt-2 text-sm font-semibold text-accent hover:underline transition-colors min-h-[44px]"
            >
              {expanded ? 'Show less' : '…see more'}
            </button>
          )}
        </div>
      ) : (
        <p className="text-sm text-text-muted italic">
          {isOwner
            ? 'Tell the world about yourself. Add a summary to help people learn about you.'
            : 'No bio added yet.'}
        </p>
      )}
    </div>
  );
}
