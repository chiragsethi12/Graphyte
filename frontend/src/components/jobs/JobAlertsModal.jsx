import { useState } from 'react';
import {
  Bell, BellOff, X, Trash2, Loader2, Clock,
  Search, MapPin, Briefcase, ChevronDown,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import Button from '../ui/Button';
import ConfirmAction from '../ui/ConfirmDialog';
import toast from 'react-hot-toast';

const JOB_TYPES = [
  { value: '', label: 'Any type' },
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'remote', label: 'Remote' },
  { value: 'internship', label: 'Internship' },
  { value: 'contract', label: 'Contract' },
];

const EXP_LEVELS = [
  { value: '', label: 'Any level' },
  { value: 'entry', label: 'Entry' },
  { value: 'mid', label: 'Mid' },
  { value: 'senior', label: 'Senior' },
  { value: 'lead', label: 'Lead' },
];

const FREQ_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
];

/* ─── Alert Row ───────────────────────────────────────────────── */
function AlertRow({ alert, onToggle, onDelete, toggling, deleting }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border last:border-b-0 hover:bg-bg-hover/50 transition-colors group">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text-primary truncate">{alert.name}</p>
        <div className="flex items-center gap-2 mt-1 text-[11px] text-text-muted">
          {alert.query && (
            <span className="inline-flex items-center gap-1">
              <Search size={10} /> {alert.query}
            </span>
          )}
          {alert.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin size={10} /> {alert.location}
            </span>
          )}
          {alert.type && (
            <span className="inline-flex items-center gap-1">
              <Briefcase size={10} /> {alert.type}
            </span>
          )}
        </div>
      </div>

      {/* Frequency badge */}
      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
        alert.frequency === 'daily'
          ? 'bg-accent-muted text-accent border-border-accent'
          : 'bg-bg-hover text-text-muted border-border'
      }`}>
        {alert.frequency}
      </span>

      {/* Toggle active */}
      <button
        onClick={() => onToggle(alert._id, !alert.isActive)}
        disabled={toggling}
        className={`p-1.5 rounded-md transition-colors ${
          alert.isActive
            ? 'text-accent hover:bg-accent/10'
            : 'text-text-faint hover:text-text-muted hover:bg-bg-hover'
        }`}
        title={alert.isActive ? 'Pause alert' : 'Resume alert'}
      >
        {alert.isActive ? <Bell size={14} /> : <BellOff size={14} />}
      </button>

      {/* Delete */}
      <ConfirmAction
        onConfirm={() => onDelete(alert._id)}
        message={`Delete "${alert.name}"?`}
        confirmLabel="Delete"
      >
        {(requestConfirm) => (
          <button
            onClick={requestConfirm}
            disabled={deleting}
            className="p-1.5 rounded-md text-text-faint hover:text-semantic-destructive hover:bg-bg-hover transition-colors opacity-0 group-hover:opacity-100"
          >
            <Trash2 size={13} />
          </button>
        )}
      </ConfirmAction>
    </div>
  );
}

/* ─── Create Alert Form ───────────────────────────────────────── */
function CreateAlertForm({ defaults, onSubmit, onCancel, saving }) {
  const [name, setName] = useState(defaults?.name || 'Job Alert');
  const [query, setQuery] = useState(defaults?.query || '');
  const [type, setType] = useState(defaults?.type || '');
  const [location, setLocation] = useState(defaults?.location || '');
  const [experienceLevel, setExperienceLevel] = useState(defaults?.experienceLevel || '');
  const [frequency, setFrequency] = useState('daily');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) {
      toast.error('Search query is required');
      return;
    }
    onSubmit({ name: name.trim(), query: query.trim(), type, location: location.trim(), experienceLevel, frequency });
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-border space-y-3 bg-bg-base/50">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-[11px] font-semibold text-text-muted mb-1">Alert Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            className="w-full text-sm border border-border bg-bg-base text-text-primary rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all placeholder:text-text-faint"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-[11px] font-semibold text-text-muted mb-1">Search Query *</label>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. React Developer"
            className="w-full text-sm border border-border bg-bg-base text-text-primary rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all placeholder:text-text-faint"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-text-muted mb-1">Location</label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Any location"
            className="w-full text-sm border border-border bg-bg-base text-text-primary rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all placeholder:text-text-faint"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-text-muted mb-1">Job Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full text-sm border border-border bg-bg-base text-text-primary rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
          >
            {JOB_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-text-muted mb-1">Experience</label>
          <select
            value={experienceLevel}
            onChange={(e) => setExperienceLevel(e.target.value)}
            className="w-full text-sm border border-border bg-bg-base text-text-primary rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
          >
            {EXP_LEVELS.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-text-muted mb-1">Frequency</label>
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            className="w-full text-sm border border-border bg-bg-base text-text-primary rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
          >
            {FREQ_OPTIONS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="px-3 py-1.5 rounded-lg text-xs font-medium text-text-muted hover:bg-bg-hover transition-colors"
        >
          Cancel
        </button>
        <Button type="submit" size="sm" loading={saving}>
          Create Alert
        </Button>
      </div>
    </form>
  );
}

/* ─── Main Job Alerts Modal ───────────────────────────────────── */
export default function JobAlertsModal({ onClose, searchDefaults }) {
  const [showCreate, setShowCreate] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['jobAlerts'],
    queryFn: () => api.get('/job-alerts').then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (body) => api.post('/job-alerts', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobAlerts'] });
      setShowCreate(false);
      toast.success('Job alert created!');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create alert'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }) => api.put(`/job-alerts/${id}`, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['jobAlerts'] }),
    onError: () => toast.error('Failed to update alert'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/job-alerts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobAlerts'] });
      toast.success('Alert deleted');
    },
    onError: () => toast.error('Failed to delete alert'),
  });

  const alerts = data?.alerts || [];
  const canCreate = alerts.length < 5;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-bg-elevated rounded-2xl border border-border shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-accent" />
            <h3 className="text-base font-bold text-text-primary">Job Alerts</h3>
            {alerts.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent-muted text-accent border border-border-accent font-semibold">
                {alerts.length}/5
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Alert list */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={20} className="animate-spin text-text-faint" />
            </div>
          ) : alerts.length === 0 && !showCreate ? (
            <div className="text-center py-12 px-5">
              <Bell size={28} className="mx-auto text-text-faint mb-2" />
              <p className="text-sm text-text-muted font-medium mb-1">No job alerts yet</p>
              <p className="text-[11px] text-text-faint">Create an alert to get notified when new jobs match your criteria</p>
            </div>
          ) : (
            alerts.map((alert) => (
              <AlertRow
                key={alert._id}
                alert={alert}
                onToggle={(id, isActive) => toggleMutation.mutate({ id, isActive })}
                onDelete={(id) => deleteMutation.mutate(id)}
                toggling={toggleMutation.isPending}
                deleting={deleteMutation.isPending}
              />
            ))
          )}
        </div>

        {/* Create form */}
        {showCreate && (
          <CreateAlertForm
            defaults={searchDefaults}
            onSubmit={(body) => createMutation.mutate(body)}
            onCancel={() => setShowCreate(false)}
            saving={createMutation.isPending}
          />
        )}

        {/* Footer — New Alert button */}
        {!showCreate && canCreate && (
          <div className="px-5 py-3 border-t border-border">
            <button
              onClick={() => setShowCreate(true)}
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-accent bg-accent-muted border border-border-accent hover:bg-accent/20 transition-all"
            >
              <Bell size={13} /> New Alert
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
