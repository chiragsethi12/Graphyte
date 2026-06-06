import { useState, useMemo, useCallback } from 'react';
import { Plus, X, Edit2, Award, ThumbsUp, ChevronDown, ChevronUp } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';
import ConfirmAction from '../ui/ConfirmDialog';
import toast from 'react-hot-toast';

/* ─── Endorsement helpers (localStorage-backed) ───────────────── */
function getEndorsements(profileUserId) {
  try {
    const raw = localStorage.getItem(`graphyte_endorsements_${profileUserId}`);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function setEndorsements(profileUserId, map) {
  localStorage.setItem(`graphyte_endorsements_${profileUserId}`, JSON.stringify(map));
}

function getMyEndorsements(profileUserId, myId) {
  try {
    const raw = localStorage.getItem(`graphyte_endorsed_${profileUserId}_${myId}`);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function setMyEndorsements(profileUserId, myId, skills) {
  localStorage.setItem(`graphyte_endorsed_${profileUserId}_${myId}`, JSON.stringify(skills));
}

/* ─── Single Skill Row ────────────────────────────────────────── */
function SkillRow({
  skill, rank, endorsementCount, isEndorsedByMe, isOwner, isEditing,
  isConnected, onEndorse, onRemove, removing,
}) {
  const isTop3 = rank < 3 && endorsementCount > 0;

  return (
    <div
      className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all group ${
        isTop3
          ? 'bg-accent-muted/60 border border-accent/15'
          : 'bg-bg-base border border-border hover:border-border-muted'
      }`}
    >
      {/* Left: skill name */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {isTop3 && (
          <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
            <span className="text-[10px] font-bold text-accent">#{rank + 1}</span>
          </div>
        )}
        <span className={`text-sm font-medium truncate ${
          isTop3 ? 'text-text-primary' : 'text-text-primary'
        }`}>
          {skill}
        </span>
      </div>

      {/* Right: endorsement count + actions */}
      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
        {/* Endorsement count */}
        {endorsementCount > 0 && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent tabular-nums">
            <ThumbsUp size={11} />
            {endorsementCount}
          </span>
        )}

        {/* Endorse button (for non-owner, connected visitors only) */}
        {!isOwner && isConnected && (
          <button
            onClick={() => onEndorse(skill)}
            disabled={isEndorsedByMe}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all min-h-[28px] ${
              isEndorsedByMe
                ? 'bg-accent/10 text-accent cursor-default border border-accent/20'
                : 'text-text-muted hover:text-accent hover:bg-accent/10 border border-transparent hover:border-accent/20'
            }`}
            title={isEndorsedByMe ? 'You endorsed this skill' : `Endorse ${skill}`}
          >
            <ThumbsUp size={11} className={isEndorsedByMe ? 'fill-accent' : ''} />
            {isEndorsedByMe ? 'Endorsed' : 'Endorse'}
          </button>
        )}

        {/* Remove button (owner, editing mode only) */}
        {isOwner && isEditing && (
          <ConfirmAction
            onConfirm={() => onRemove(skill)}
            message={`Remove "${skill}"?`}
            confirmLabel="Remove"
          >
            {(requestConfirm) => (
              <button
                onClick={requestConfirm}
                disabled={removing}
                className="p-1.5 text-text-faint hover:text-semantic-destructive transition-colors min-h-[28px] min-w-[28px] flex items-center justify-center"
              >
                <X size={12} />
              </button>
            )}
          </ConfirmAction>
        )}
      </div>
    </div>
  );
}

/* ─── Main Skills Section ─────────────────────────────────────── */
export default function SkillsSection({ skills = [], isOwner = false, userId, profileUserId, isConnected = false }) {
  const [open, setOpen] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [showAll, setShowAll] = useState(false);
  const { user: me } = useAuth();
  const queryClient = useQueryClient();

  // Endorsement state
  const [endorseMap, setEndorseMap] = useState(() => getEndorsements(profileUserId || userId));
  const [myEndorsed, setMyEndorsed] = useState(() => getMyEndorsements(profileUserId || userId, me?._id));

  // Sort skills by endorsement count (descending)
  const sortedSkills = useMemo(() => {
    return [...skills].sort((a, b) => (endorseMap[b] || 0) - (endorseMap[a] || 0));
  }, [skills, endorseMap]);

  const displaySkills = showAll ? sortedSkills : sortedSkills.slice(0, 6);

  const addMutation = useMutation({
    mutationFn: (updated) => api.put('/users/profile', { skills: updated }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) => Array.isArray(query.queryKey) && query.queryKey[0] === 'profile',
      });
      setOpen(false);
      setNewSkill('');
      toast.success('Skills updated!');
    },
    onError: () => toast.error('Failed to save'),
  });

  const handleAdd = () => {
    const trimmed = newSkill.trim();
    if (!trimmed || skills.includes(trimmed)) return;
    addMutation.mutate([...skills, trimmed]);
  };

  const handleRemove = (skill) => {
    addMutation.mutate(skills.filter((s) => s !== skill));
  };

  const handleEndorse = useCallback((skill) => {
    const pid = profileUserId || userId;
    if (!me?._id || myEndorsed.includes(skill)) return;

    const newMap = { ...endorseMap, [skill]: (endorseMap[skill] || 0) + 1 };
    const newMyEndorsed = [...myEndorsed, skill];

    setEndorseMap(newMap);
    setMyEndorsed(newMyEndorsed);
    setEndorsements(pid, newMap);
    setMyEndorsements(pid, me._id, newMyEndorsed);
    toast.success(`Endorsed "${skill}"!`, { icon: '👍' });
  }, [endorseMap, myEndorsed, profileUserId, userId, me?._id]);

  return (
    <div className="card p-6 md:p-7">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Award size={17} className="text-accent" />
          <h2 className="text-lg font-bold font-display text-text-primary">Skills</h2>
          {skills.length > 0 && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-bg-hover text-text-faint border border-border font-semibold">
              {skills.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {isOwner && (
            <>
              <button
                onClick={() => setOpen((p) => !p)}
                className="p-2 rounded-xl text-text-muted hover:text-accent hover:bg-bg-hover transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                {open ? <X size={16} /> : <Plus size={16} />}
              </button>
              <button
                onClick={() => setOpen((p) => !p)}
                className={`p-2 rounded-xl transition-all min-h-[44px] min-w-[44px] flex items-center justify-center ${
                  open ? 'text-accent bg-accent/10' : 'text-text-muted hover:text-accent hover:bg-bg-hover'
                }`}
              >
                <Edit2 size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Add skill input */}
      {open && (
        <div className="mb-5 flex gap-2">
          <input
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="e.g. Strategic Planning"
            className="flex-1 text-sm border border-border bg-bg-base text-text-primary rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
          />
          <Button size="sm" onClick={handleAdd} loading={addMutation.isPending}>
            Add
          </Button>
        </div>
      )}

      {/* Skills list */}
      <div className="space-y-2">
        {displaySkills.map((skill, i) => (
          <SkillRow
            key={skill}
            skill={skill}
            rank={i}
            endorsementCount={endorseMap[skill] || 0}
            isEndorsedByMe={myEndorsed.includes(skill)}
            isOwner={isOwner}
            isEditing={open}
            isConnected={isConnected}
            onEndorse={handleEndorse}
            onRemove={handleRemove}
            removing={addMutation.isPending}
          />
        ))}
      </div>

      {/* Show more / less toggle */}
      {sortedSkills.length > 6 && (
        <button
          onClick={() => setShowAll((v) => !v)}
          className="mt-3 flex items-center gap-1 text-xs font-semibold text-accent hover:underline transition-colors min-h-[36px]"
        >
          {showAll ? (
            <>
              <ChevronUp size={13} /> Show less
            </>
          ) : (
            <>
              <ChevronDown size={13} /> Show all {sortedSkills.length} skills
            </>
          )}
        </button>
      )}

      {/* Empty state */}
      {skills.length === 0 && (
        <p className="text-sm text-text-muted italic">
          {isOwner ? 'Add skills to showcase your expertise.' : 'No skills added yet.'}
        </p>
      )}
    </div>
  );
}
