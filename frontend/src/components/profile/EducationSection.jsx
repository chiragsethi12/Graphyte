import { useState } from 'react';
import { GraduationCap, Plus, X, Edit2, Trash2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import Button from '../ui/Button';
import Input from '../ui/Input';
import ConfirmAction from '../ui/ConfirmDialog';
import toast from 'react-hot-toast';

function EducationItem({ edu, isLast, isEditing, onDelete, isDeleting }) {
  const isCurrent = !edu.endYear || edu.endYear === 'Present';

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
          <GraduationCap size={18} className={isCurrent ? 'text-accent' : 'text-text-muted'} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-6">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="font-semibold text-text-primary text-[15px] leading-tight">{edu.school}</h4>
            <p className="text-sm text-text-muted mt-0.5">
              {edu.degree}
              {edu.field ? ` · ${edu.field}` : ''}
            </p>
            <p className="text-xs text-text-faint mt-1">
              {edu.startYear} – {edu.endYear || 'Present'}
            </p>
            {edu.grade && (
              <p className="text-xs text-text-muted mt-1.5">
                <span className="font-medium text-text-primary">Grade:</span> {edu.grade}
              </p>
            )}
          </div>
          {isEditing && (
            <ConfirmAction
              onConfirm={onDelete}
              message={`Remove "${edu.school}"?`}
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
      </div>
    </div>
  );
}

export default function EducationSection({ educations = [], isOwner = false, userId }) {
  const [showAdd, setShowAdd] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    school: '',
    degree: '',
    field: '',
    startYear: '',
    endYear: '',
  });
  const queryClient = useQueryClient();

  const invalidateProfiles = () => {
    queryClient.invalidateQueries({
      predicate: (query) => Array.isArray(query.queryKey) && query.queryKey[0] === 'profile',
    });
  };

  const addMutation = useMutation({
    mutationFn: () => api.put('/users/profile', { education: [...educations, form] }),
    onSuccess: () => {
      invalidateProfiles();
      setShowAdd(false);
      setForm({ school: '', degree: '', field: '', startYear: '', endYear: '' });
      toast.success('Education added!');
    },
    onError: () => toast.error('Failed to save'),
  });

  const deleteMutation = useMutation({
    mutationFn: (index) => {
      const updated = educations.filter((_, i) => i !== index);
      return api.put('/users/profile', { education: updated });
    },
    onMutate: async (index) => {
      await queryClient.cancelQueries({ queryKey: ['profile'] });
      const previous = queryClient.getQueriesData({ queryKey: ['profile'] });
      queryClient.setQueriesData({ queryKey: ['profile'] }, (old) => {
        if (!old?.user) return old;
        return {
          ...old,
          user: { ...old.user, education: old.user.education.filter((_, i) => i !== index) },
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
      toast.error('Failed to remove education');
    },
    onSettled: () => invalidateProfiles(),
    onSuccess: () => toast.success('Education removed'),
  });

  return (
    <div className="card p-6 md:p-7">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold font-display text-text-primary">Education</h2>
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
            label="School"
            value={form.school}
            onChange={(e) => setForm((p) => ({ ...p, school: e.target.value }))}
            placeholder="London School of Economics"
          />
          <Input
            label="Degree"
            value={form.degree}
            onChange={(e) => setForm((p) => ({ ...p, degree: e.target.value }))}
            placeholder="Master of Business Administration"
          />
          <Input
            label="Field of Study"
            value={form.field}
            onChange={(e) => setForm((p) => ({ ...p, field: e.target.value }))}
            placeholder="Business"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Year"
              value={form.startYear}
              onChange={(e) => setForm((p) => ({ ...p, startYear: e.target.value }))}
              placeholder="2014"
            />
            <Input
              label="End Year"
              value={form.endYear}
              onChange={(e) => setForm((p) => ({ ...p, endYear: e.target.value }))}
              placeholder="2016"
            />
          </div>
          <div className="flex justify-end gap-2 mt-1">
            <Button variant="ghost" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button size="sm" onClick={() => addMutation.mutate()} loading={addMutation.isPending}>
              Save
            </Button>
          </div>
        </div>
      )}

      {isEditing && educations.length > 0 && (
        <p className="text-xs text-text-muted mb-4 -mt-2">
          Click the <Trash2 size={11} className="inline text-text-muted" /> icon to remove an entry.
        </p>
      )}

      <div className="flex flex-col">
        {educations.map((edu, i) => (
          <EducationItem
            key={i}
            edu={edu}
            isLast={i === educations.length - 1}
            isEditing={isEditing}
            onDelete={() => deleteMutation.mutate(i)}
            isDeleting={deleteMutation.isPending}
          />
        ))}
        {educations.length === 0 && (
          <p className="text-sm text-text-muted italic">
            {isOwner ? 'Add your education background.' : 'No education added yet.'}
          </p>
        )}
      </div>
    </div>
  );
}
