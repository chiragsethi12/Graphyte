import { useState } from 'react';
import { Briefcase, Plus, X, Edit2, Trash2, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import Button from '../ui/Button';
import Input from '../ui/Input';
import ConfirmAction from '../ui/ConfirmDialog';
import toast from 'react-hot-toast';

function ExperienceItem({ exp, isLast, isEditing, onDelete, isDeleting }) {
  const duration = [exp.startDate, exp.endDate || 'Present'].join(' – ');
  const isCurrent = !exp.endDate || exp.endDate === 'Present';

  return (
    <div className="flex gap-4 relative">
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-[22px] top-[52px] bottom-0 w-px bg-border" />
      )}

      {/* Logo / icon */}
      <div className="relative z-10 flex-shrink-0">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
          isCurrent ? 'bg-accent/10 ring-2 ring-accent/20' : 'bg-bg-base border border-border'
        }`}>
          <Briefcase size={18} className={isCurrent ? 'text-accent' : 'text-text-muted'} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-6">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="font-semibold text-text-primary text-[15px] leading-tight">{exp.title}</h4>
            <p className="text-sm text-text-muted mt-0.5">{exp.company} · Full-time</p>
            <p className="text-xs text-text-faint mt-1">{duration}</p>
          </div>
          {isEditing && (
            <ConfirmAction
              onConfirm={onDelete}
              message={`Remove "${exp.title} at ${exp.company}"?`}
              confirmLabel="Remove"
            >
              {(requestConfirm) => (
                <button
                  onClick={requestConfirm}
                  disabled={isDeleting}
                  className="p-1.5 rounded-lg text-text-faint hover:text-semantic-destructive hover:bg-semantic-destructive/10 border border-transparent hover:border-semantic-destructive/20 transition-all flex-shrink-0 min-h-[36px] min-w-[36px] flex items-center justify-center"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </ConfirmAction>
          )}
        </div>
        {exp.description && (
          <p className="text-sm text-text-muted mt-3 leading-relaxed">{exp.description}</p>
        )}
      </div>
    </div>
  );
}

export default function ExperienceSection({ experiences = [], isOwner = false, userId }) {
  const [showAdd, setShowAdd] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    title: '',
    company: '',
    startDate: '',
    endDate: '',
    description: '',
  });
  const queryClient = useQueryClient();

  const invalidateProfiles = () => {
    queryClient.invalidateQueries({
      predicate: (query) => Array.isArray(query.queryKey) && query.queryKey[0] === 'profile',
    });
  };

  const addMutation = useMutation({
    mutationFn: () => api.put('/users/profile', { experience: [...experiences, form] }),
    onSuccess: () => {
      invalidateProfiles();
      setShowAdd(false);
      setForm({ title: '', company: '', startDate: '', endDate: '', description: '' });
      toast.success('Experience added!');
    },
    onError: () => toast.error('Failed to save'),
  });

  const deleteMutation = useMutation({
    mutationFn: (index) => {
      const updated = experiences.filter((_, i) => i !== index);
      return api.put('/users/profile', { experience: updated });
    },
    onMutate: async (index) => {
      await queryClient.cancelQueries({ queryKey: ['profile'] });
      const previous = queryClient.getQueriesData({ queryKey: ['profile'] });
      queryClient.setQueriesData({ queryKey: ['profile'] }, (old) => {
        if (!old?.user) return old;
        return {
          ...old,
          user: { ...old.user, experience: old.user.experience.filter((_, i) => i !== index) },
        };
      });
      return { previous };
    },
    onError: (err, _vars, context) => {
      if (context?.previous) {
        for (const [key, data] of context.previous) {
          queryClient.setQueryData(key, data);
        }
      }
      toast.error('Failed to remove experience');
    },
    onSettled: () => invalidateProfiles(),
    onSuccess: () => toast.success('Experience removed'),
  });

  return (
    <div className="card p-6 md:p-7">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold font-display text-text-primary">Experience</h2>
        <div className="flex items-center gap-1">
          {isOwner && (
            <>
              <button
                onClick={() => { setShowAdd((p) => !p); if (isEditing) setIsEditing(false); }}
                className="p-2 rounded-xl text-text-muted hover:text-accent hover:bg-bg-hover transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                {showAdd ? <X size={16} /> : <Plus size={16} />}
              </button>
              <button
                onClick={() => { setIsEditing((p) => !p); if (showAdd) setShowAdd(false); }}
                className={`p-2 rounded-xl transition-all min-h-[44px] min-w-[44px] flex items-center justify-center ${
                  isEditing ? 'text-accent bg-accent/10' : 'text-text-muted hover:text-accent hover:bg-bg-hover'
                }`}
              >
                <Edit2 size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      {showAdd && (
        <div className="mb-6 p-5 bg-bg-base rounded-xl border border-border flex flex-col gap-3.5">
          <Input
            label="Title"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            placeholder="Chief Strategy Officer"
          />
          <Input
            label="Company"
            value={form.company}
            onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))}
            placeholder="Lumina Tech"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Date"
              value={form.startDate}
              onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
              placeholder="Jan 2021"
            />
            <Input
              label="End Date"
              value={form.endDate}
              onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
              placeholder="Present"
            />
          </div>
          <Input
            label="Description"
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            placeholder="Brief description of your role…"
          />
          <div className="flex justify-end gap-2 mt-1">
            <Button variant="ghost" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button size="sm" onClick={() => addMutation.mutate()} loading={addMutation.isPending}>
              Save
            </Button>
          </div>
        </div>
      )}

      {isEditing && experiences.length > 0 && (
        <p className="text-xs text-text-muted mb-4 -mt-2">
          Click the <Trash2 size={11} className="inline text-text-muted" /> icon to remove an entry.
        </p>
      )}

      <div className="flex flex-col">
        {experiences.map((exp, i) => (
          <ExperienceItem
            key={i}
            exp={exp}
            isLast={i === experiences.length - 1}
            isEditing={isEditing}
            onDelete={() => deleteMutation.mutate(i)}
            isDeleting={deleteMutation.isPending}
          />
        ))}
        {experiences.length === 0 && (
          <p className="text-sm text-text-muted italic">
            {isOwner ? 'Add your professional experience to stand out.' : 'No experience added yet.'}
          </p>
        )}
      </div>
    </div>
  );
}
