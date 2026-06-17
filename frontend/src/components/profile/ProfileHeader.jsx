import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, Globe, Edit2, Plus, Sparkles, BarChart2, Copy,
  Briefcase, GraduationCap, Mail, UserPlus, UserMinus, Clock, CheckCircle,
  Ban, ShieldAlert, MoreHorizontal
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import useConnectionStatus from '../../hooks/useConnectionStatus';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import ConfirmAction from '../ui/ConfirmDialog';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import ReportModal from '../ui/ReportModal';

/* ─── Connection Action Buttons ────────────────────────────────── */

/* ─── Connection Action Buttons ────────────────────────────────── */

function ConnectionActions({ userId }) {
  const { status, sendRequest, withdraw, respond, remove } = useConnectionStatus(userId);

  if (status === 'self') return null;

  if (status === 'connected') {
    return (
      <ConfirmAction onConfirm={() => remove.mutate()} message="Remove connection?" confirmLabel="Remove">
        {(ask) => (
          <button onClick={ask} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md border border-border text-text-primary bg-bg-hover hover:bg-bg-active text-sm font-semibold transition-all min-h-[40px]">
            <CheckCircle size={16} /> Connected
          </button>
        )}
      </ConfirmAction>
    );
  }

  if (status === 'pending_sent') {
    return (
      <ConfirmAction onConfirm={() => withdraw.mutate()} message="Withdraw request?" confirmLabel="Withdraw" variant="warning">
        {(ask) => (
          <button onClick={ask} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md border border-border text-text-muted bg-bg-hover hover:bg-bg-active text-sm font-semibold transition-all min-h-[40px]">
            <Clock size={16} /> Pending
          </button>
        )}
      </ConfirmAction>
    );
  }

  if (status === 'pending_received') {
    return (
      <div className="flex gap-2">
        <button onClick={() => respond.mutate('accept')} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-accent text-white text-sm font-semibold hover:bg-accent-hover transition-all min-h-[40px]">
          Accept
        </button>
        <button onClick={() => respond.mutate('reject')} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md border border-border text-text-muted bg-bg-hover hover:bg-bg-active text-sm font-semibold transition-all min-h-[40px]">
          Decline
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => sendRequest.mutate()}
      disabled={sendRequest.isPending}
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-accent text-white text-sm font-semibold hover:bg-accent-hover transition-all shadow-glow-accent disabled:opacity-50 min-h-[40px]"
    >
      <UserPlus size={16} /> Connect
    </button>
  );
}

/* ─── Profile Header Hero ──────────────────────────────────────── */

export default function ProfileHeader({ profile, stats, isOwner, mutuals = [], mutualCount = 0 }) {
  const navigate = useNavigate();
  const [bannerError, setBannerError] = useState(false);
  const connectionCount = stats?.connectionCount ?? profile?.connections?.length ?? 0;

  const queryClient = useQueryClient();
  const { user, setUser } = useAuth();
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const isBlocked = user?.blockedUsers?.some(
    (id) => id === profile._id || id.toString() === profile._id.toString()
  );

  const blockMutation = useMutation({
    mutationFn: () => api.post(`/users/${profile._id}/block`),
    onSuccess: () => {
      toast.success("User blocked successfully");
      setUser((prev) => ({
        ...prev,
        blockedUsers: [...(prev.blockedUsers || []), profile._id],
      }));
      queryClient.invalidateQueries({ queryKey: ["connectionStatus", profile._id] });
      queryClient.invalidateQueries({ queryKey: ["connections"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to block user");
    },
  });

  const unblockMutation = useMutation({
    mutationFn: () => api.delete(`/users/${profile._id}/block`),
    onSuccess: () => {
      toast.success("User unblocked successfully");
      setUser((prev) => ({
        ...prev,
        blockedUsers: (prev.blockedUsers || []).filter(
          (id) => id !== profile._id && id.toString() !== profile._id.toString()
        ),
      }));
      queryClient.invalidateQueries({ queryKey: ["connectionStatus", profile._id] });
      queryClient.invalidateQueries({ queryKey: ["connections"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to unblock user");
    },
  });

  // Derive the first current experience and education for the right summary
  const currentRole = profile.experience?.find((e) => e.current || !e.endDate || e.endDate === 'Present');
  const firstEdu = profile.education?.[0];

  const handleShareProfile = () => {
    const url = `${window.location.origin}/profile/${profile.username || profile._id}`;
    navigator.clipboard.writeText(url);
    toast.success('Profile link copied!');
  };

  const showBannerImage = profile.bannerPic && !bannerError;

  return (
    <div className="bg-bg-elevated rounded-xl border border-border shadow-md overflow-hidden">
      {/* ── Banner ──────────────────────────────────────────── */}
      <div className="h-44 md:h-52 relative overflow-hidden">
        {/* Gradient fallback — always rendered behind the image */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg, #1A000D 0%, #660033 60%, #99004C 100%)' }}
        />
        {/* User banner image — covers the gradient when valid */}
        {showBannerImage && (
          <img
            src={profile.bannerPic}
            alt=""
            loading="lazy"
            onError={() => setBannerError(true)}
            className="absolute inset-0 w-full h-full object-cover opacity-[0.08]"
          />
        )}
        {/* Burgundy tinted overlay — dims any image to a subtle background */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(26,0,13,0.85) 0%, rgba(102,0,51,0.65) 60%, rgba(124,58,237,0.7) 100%)' }} />

        {/* Edit banner (owner only) */}
        {isOwner && (
          <button
            onClick={() => navigate('/settings')}
            className="absolute top-4 right-4 z-10 p-2 bg-bg-overlay/85 border border-border rounded-md text-text-muted hover:text-text-primary hover:bg-bg-hover transition-all min-h-[36px] min-w-[36px] flex items-center justify-center shadow-sm"
          >
            <Edit2 size={15} />
          </button>
        )}
      </div>

      {/* ── Profile Info ───────────────────────────────────── */}
      <div className="px-6 md:px-8 pb-6">
        {/* Avatar — overlaps banner */}
        <div className="-mt-16 md:-mt-20 mb-3 relative z-10">
          <div className="w-32 h-32 rounded-full ring-4 ring-bg-elevated shadow-lg bg-bg-elevated overflow-hidden flex items-center justify-center">
            {profile.profilePic ? (
              <img
                src={profile.profilePic}
                alt={profile.name}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-4xl font-semibold text-accent">
                {profile.name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '?'}
              </span>
            )}
          </div>
        </div>

        {/* Identity + Affiliations side by side on desktop */}
        <div className="flex flex-col lg:flex-row lg:justify-between gap-3">
          {/* Left: identity */}
          <div className="min-w-0 flex-1">
            <h1 className="text-[22px] md:text-2xl font-extrabold text-text-primary tracking-tight leading-tight">
              {profile.name}
            </h1>

            {profile.headline && (
              <p className="text-[14px] text-text-muted mt-0.5 leading-snug max-w-md">
                {profile.headline}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
              {profile.location && (
                <span className="flex items-center gap-1 text-[13px] text-text-faint">
                  <MapPin size={13} /> {profile.location}
                </span>
              )}
              <button className="flex items-center gap-1 text-[13px] text-accent font-semibold hover:underline">
                <Mail size={13} /> Contact info
              </button>
              {profile.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[13px] text-accent font-semibold hover:underline"
                >
                  <Globe size={13} /> Website
                </a>
              )}
            </div>

            {/* Connections count */}
            <p className="mt-1.5 text-[13px] text-accent font-semibold hover:underline cursor-pointer">
              {connectionCount} connection{connectionCount !== 1 ? 's' : ''}
            </p>

            {/* Mutual connections avatar stack (non-owner view only) */}
            {!isOwner && mutuals.length > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <div className="flex -space-x-2">
                  {mutuals.slice(0, 3).map((m) => (
                    <Link
                      key={m._id}
                      to={`/profile/${m.username || m._id}`}
                      className="inline-block ring-2 ring-bg-elevated rounded-full hover:z-10 transition-transform hover:scale-110"
                    >
                      <Avatar src={m.profilePic} name={m.name} size="xs" />
                    </Link>
                  ))}
                </div>
                <p className="text-[12px] text-text-muted">
                  <span className="font-semibold text-text-primary">{mutualCount || mutuals.length}</span>
                  {' '}mutual connection{(mutualCount || mutuals.length) !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>

          {/* Right: Affiliations summary */}
          <div className="flex flex-col gap-2 lg:items-end flex-shrink-0 mt-1 lg:mt-0">
            {currentRole && (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-md bg-bg-hover border border-border flex items-center justify-center flex-shrink-0">
                  <Briefcase size={15} className="text-text-faint" />
                </div>
                <div className="lg:text-right">
                  <p className="text-[13px] font-semibold text-text-muted leading-snug">{currentRole.company}</p>
                </div>
              </div>
            )}
            {firstEdu && (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-md bg-bg-hover border border-border flex items-center justify-center flex-shrink-0">
                  <GraduationCap size={15} className="text-text-faint" />
                </div>
                <div className="lg:text-right">
                  <p className="text-[13px] font-semibold text-text-muted leading-snug">{firstEdu.school}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Action Buttons ──────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2.5 mt-4 pt-4 border-t border-border">
              {isOwner ? (
                <>
                  <button
                    onClick={() => navigate('/settings')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-accent text-white text-sm font-semibold hover:bg-accent-hover transition-all shadow-glow-accent min-h-[40px]"
                  >
                    <Edit2 size={14} /> Edit Profile
                  </button>
                  <button
                    onClick={() => navigate('/activity')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md border border-border text-text-primary bg-bg-hover hover:bg-bg-active text-sm font-semibold transition-all min-h-[40px]"
                  >
                    <BarChart2 size={14} /> Analytics
                  </button>
                  <button
                    onClick={handleShareProfile}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md border border-border text-text-muted hover:text-text-primary hover:bg-bg-hover transition-all min-h-[40px]"
                  >
                    <Copy size={14} /> Share
                  </button>
                </>
              ) : (
                <>
                  {isBlocked ? (
                    <button
                      onClick={() => unblockMutation.mutate()}
                      disabled={unblockMutation.isPending}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-semantic-destructive text-white text-sm font-semibold hover:bg-red-600 transition-all min-h-[40px]"
                    >
                      <Ban size={14} /> Unblock User
                    </button>
                  ) : (
                    <ConnectionActions userId={profile._id} />
                  )}
                  <button
                    onClick={handleShareProfile}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md border border-border text-text-muted hover:text-text-primary hover:bg-bg-hover transition-all min-h-[40px]"
                  >
                    <Copy size={14} /> Share
                  </button>

                  {/* Dropdown for Block and Report */}
                  <div className="relative">
                    <button
                      onClick={() => setShowDropdown(!showDropdown)}
                      className="inline-flex items-center justify-center p-2.5 rounded-md border border-border text-text-muted hover:text-text-primary hover:bg-bg-hover transition-all min-h-[40px] min-w-[40px] relative z-30"
                      title="More Options"
                    >
                      <MoreHorizontal size={16} />
                    </button>
                    {showDropdown && (
                      <>
                        <div className="fixed inset-0 z-20" onClick={() => setShowDropdown(false)} />
                        <div className="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-bg-overlay border border-border z-30 py-1">
                          {isBlocked ? (
                            <button
                              onClick={() => {
                                setShowDropdown(false);
                                unblockMutation.mutate();
                              }}
                              className="flex items-center gap-2 w-full text-left px-4 py-2 text-xs font-semibold text-text-primary hover:bg-bg-hover hover:text-accent transition-colors"
                            >
                              <Ban size={14} /> Unblock User
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setShowDropdown(false);
                                  blockMutation.mutate();
                                }}
                                className="flex items-center gap-2 w-full text-left px-4 py-2 text-xs font-semibold text-semantic-destructive hover:bg-bg-hover hover:text-red-500 transition-colors"
                              >
                                <Ban size={14} /> Block User
                              </button>
                              <button
                                onClick={() => {
                                  setShowDropdown(false);
                                  setReportModalOpen(true);
                                }}
                                className="flex items-center gap-2 w-full text-left px-4 py-2 text-xs font-semibold text-[#FF4D6D] hover:bg-bg-hover hover:text-red-500 transition-colors"
                              >
                                <ShieldAlert size={14} /> Report Profile
                              </button>
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}
        </div>
      </div>
      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        reportedUser={profile._id}
      />
    </div>
  );
}
