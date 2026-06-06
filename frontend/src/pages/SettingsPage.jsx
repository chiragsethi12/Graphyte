import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { User, Lock, Shield, Camera, Save, Eye, EyeOff, X, Image as ImageIcon, Bookmark } from 'lucide-react';
import api from '../lib/axios';
import { useAuth } from '../context/AuthContext';
import MainLayout from '../components/layout/MainLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import toast from 'react-hot-toast';

const TABS = [
  { key: 'profile', label: 'Edit Profile', icon: User },
  { key: 'account', label: 'Account', icon: Lock },
  { key: 'privacy', label: 'Privacy', icon: Shield },
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = "image/jpeg,image/jpg,image/png,image/webp";

function EditProfileTab() {
  const { user, setUser } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: user?.name || '',
    username: user?.username || '',
    headline: user?.headline || '',
    about: user?.about || user?.bio || '',
    location: user?.location || '',
    website: user?.website || '',
    skills: (user?.skills || []).join(', '),
    interests: (user?.interests || []).join(', '),
  });
  const [profilePic, setProfilePic] = useState(null);
  const [bannerPic, setBannerPic] = useState(null);
  const [removeProfilePic, setRemoveProfilePic] = useState(false);
  const [removeBannerPic, setRemoveBannerPic] = useState(false);

  const hasPhotoChanges = !!profilePic || !!bannerPic || removeProfilePic || removeBannerPic;

  const updateMutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'skills' || k === 'interests') {
          fd.append(k, JSON.stringify(v.split(',').map((s) => s.trim()).filter(Boolean)));
        } else {
          fd.append(k, v);
        }
      });
      if (profilePic) {
        fd.append('profilePic', profilePic);
      } else if (removeProfilePic) {
        fd.append('profilePic', '');
      }
      if (bannerPic) {
        fd.append('bannerPic', bannerPic);
      } else if (removeBannerPic) {
        fd.append('bannerPic', '');
      }

      return api.put('/users/update', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: (res) => {
      const data = res?.data || res;
      setUser(data.user);
      queryClient.invalidateQueries({
        predicate: (query) => Array.isArray(query.queryKey) && query.queryKey[0] === 'profile',
      });
      setProfilePic(null);
      setBannerPic(null);
      setRemoveProfilePic(false);
      setRemoveBannerPic(false);
      toast.success('Profile updated!');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Update failed'),
  });

  const handleProfilePicChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Image must be under 5MB');
      e.target.value = '';
      return;
    }
    setProfilePic(file);
    setRemoveProfilePic(false);
  };

  const handleBannerPicChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Image must be under 5MB');
      e.target.value = '';
      return;
    }
    setBannerPic(file);
    setRemoveBannerPic(false);
  };

  const handleRemoveProfilePic = () => {
    if (profilePic) {
      setProfilePic(null);
    } else if (user?.profilePic) {
      setRemoveProfilePic(true);
    }
  };

  const handleRemoveBannerPic = () => {
    if (bannerPic) {
      setBannerPic(null);
    } else if (user?.bannerPic) {
      setRemoveBannerPic(true);
    }
  };

  // Determine displayed avatar source
  const displayedProfilePic = removeProfilePic ? null : (profilePic ? URL.createObjectURL(profilePic) : user?.profilePic);
  const displayedBannerPic = removeBannerPic ? null : (bannerPic ? URL.createObjectURL(bannerPic) : user?.bannerPic);

  const showProfilePicRemove = profilePic || (user?.profilePic && !removeProfilePic);
  const showBannerPicRemove = bannerPic || (user?.bannerPic && !removeBannerPic);

  const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  return (
    <div className="space-y-5">
      {/* Photos */}
      <div className="relative">
        <div className="h-28 bg-bg-base border border-border rounded-card overflow-hidden relative">
          {displayedBannerPic && (
            <img
              src={displayedBannerPic}
              className="w-full h-full object-cover"
              alt=""
            />
          )}
          {/* Unsaved banner indicator */}
          {(bannerPic || removeBannerPic) && (
            <div className="absolute top-2 left-2 px-2 py-0.5 bg-amber-400/20 border border-amber-400/30 text-amber-300 text-[10px] font-bold rounded-full">
              Unsaved
            </div>
          )}
          <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
            {showBannerPicRemove && (
              <button
                type="button"
                onClick={handleRemoveBannerPic}
                className="p-1.5 bg-bg-overlay/80 rounded-lg cursor-pointer hover:bg-semantic-destructive/10 border border-border/30 transition-colors"
                title="Remove banner"
              >
                <X size={14} className="text-semantic-destructive" />
              </button>
            )}
            <label className="p-1.5 bg-bg-overlay/80 rounded-lg cursor-pointer hover:bg-bg-active border border-border/30 transition-colors">
              <Camera size={14} className="text-text-primary" />
              <input
                type="file"
                className="hidden"
                accept={ACCEPTED_IMAGE_TYPES}
                onChange={handleBannerPicChange}
              />
            </label>
          </div>
        </div>
        <div className="absolute -bottom-8 left-6">
          <div className="relative">
            <div className={`${(profilePic || removeProfilePic) ? 'ring-2 ring-amber-450' : ''} rounded-full`}>
              <Avatar
                src={displayedProfilePic}
                name={user?.name}
                size="xl"
              />
            </div>
            {/* Unsaved dot on avatar */}
            {(profilePic || removeProfilePic) && (
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-amber-450 border-2 border-bg-elevated rounded-full" title="Unsaved change" />
            )}
            <label className="absolute bottom-0 right-0 p-1.5 bg-bg-overlay border border-border rounded-full shadow-md cursor-pointer hover:bg-bg-active transition-colors">
              <Camera size={12} className="text-text-primary" />
              <input
                type="file"
                className="hidden"
                accept={ACCEPTED_IMAGE_TYPES}
                onChange={handleProfilePicChange}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Photo status area */}
      <div className="pt-8 space-y-1">
        <div className="flex items-center gap-3 flex-wrap">
          {profilePic && (
            <span className="inline-flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
              <ImageIcon size={11} />
              Photo ready to save
            </span>
          )}
          {removeProfilePic && (
            <span className="inline-flex items-center gap-1.5 text-xs text-semantic-destructive bg-semantic-destructive/10 border border-semantic-destructive/20 px-2.5 py-1 rounded-full">
              <X size={11} />
              Photo will be removed
            </span>
          )}
          {bannerPic && (
            <span className="inline-flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
              <ImageIcon size={11} />
              Banner ready to save
            </span>
          )}
          {removeBannerPic && (
            <span className="inline-flex items-center gap-1.5 text-xs text-semantic-destructive bg-semantic-destructive/10 border border-semantic-destructive/20 px-2.5 py-1 rounded-full">
              <X size={11} />
              Banner will be removed
            </span>
          )}
        </div>
        {showProfilePicRemove && (
          <button
            type="button"
            onClick={handleRemoveProfilePic}
            className="text-xs text-semantic-destructive hover:text-red-400 hover:underline transition-colors"
          >
            Remove Photo
          </button>
        )}
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-text-muted mb-1 block">Full Name</label>
            <input
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              className="input-base"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-text-muted mb-1 block">Username</label>
            <input
              value={form.username}
              onChange={(e) => update('username', e.target.value)}
              className="input-base"
              placeholder="john-doe"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-text-muted mb-1 block">Headline</label>
          <input
            value={form.headline}
            onChange={(e) => update('headline', e.target.value)}
            className="input-base"
            placeholder="Senior Software Engineer at Google"
            maxLength={220}
          />
        </div>

        <div>
          <label className="text-xs font-medium text-text-muted mb-1 block">About</label>
          <textarea
            value={form.about}
            onChange={(e) => update('about', e.target.value)}
            className="input-base min-h-[100px] resize-y"
            placeholder="Tell people about yourself..."
            maxLength={2600}
          />
          <p className="text-[10px] text-text-faint text-right mt-0.5">{form.about.length}/2600</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-text-muted mb-1 block">Location</label>
            <input
              value={form.location}
              onChange={(e) => update('location', e.target.value)}
              className="input-base"
              placeholder="San Francisco, CA"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-text-muted mb-1 block">Website</label>
            <input
              value={form.website}
              onChange={(e) => update('website', e.target.value)}
              className="input-base"
              placeholder="https://yoursite.com"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-text-muted mb-1 block">
            Skills (comma-separated)
          </label>
          <input
            value={form.skills}
            onChange={(e) => update('skills', e.target.value)}
            className="input-base"
            placeholder="React, Node.js, MongoDB, TypeScript"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-text-muted mb-1 block">
            Interests (comma-separated)
          </label>
          <input
            value={form.interests}
            onChange={(e) => update('interests', e.target.value)}
            className="input-base"
            placeholder="AI, Web3, Product Design"
          />
        </div>

        <Button
          variant="primary"
          onClick={() => updateMutation.mutate()}
          loading={updateMutation.isPending}
          className="flex items-center gap-2"
        >
          {hasPhotoChanges ? <Camera size={14} /> : <Save size={14} />}
          Save Changes{hasPhotoChanges ? ' (includes photo)' : ''}
        </Button>
      </div>
    </div>
  );
}

function ChangePasswordSection() {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const { register, handleSubmit, watch, formState: { errors }, reset } = useForm();

  const changePwMutation = useMutation({
    mutationFn: (data) =>
      api.patch('/users/me/password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      }),
    onSuccess: () => {
      toast.success('Password changed!');
      reset();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update password'),
  });

  const onSubmit = (data) => {
    changePwMutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md pb-6 border-b border-border">
      <h3 className="font-bold text-text-primary text-sm font-display">Change Password</h3>
      <div>
        <label className="text-xs font-semibold text-text-muted mb-1 block">Current Password</label>
        <div className="relative">
          <input
            type={showCurrent ? 'text' : 'password'}
            {...register("currentPassword", { required: "Current password is required" })}
            className="w-full px-3 py-2 text-sm bg-bg-base border border-border text-text-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent pr-10 transition-all"
          />
          <button
            type="button"
            onClick={() => setShowCurrent((p) => !p)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-faint hover:text-text-primary transition-colors"
          >
            {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        {errors.currentPassword && <p className="text-xs text-semantic-destructive mt-1">{errors.currentPassword.message}</p>}
      </div>
      <div>
        <label className="text-xs font-semibold text-text-muted mb-1 block">New Password</label>
        <div className="relative">
          <input
            type={showNew ? 'text' : 'password'}
            {...register("newPassword", {
              required: "New password is required",
              minLength: { value: 6, message: "New password must be at least 6 characters" }
            })}
            className="w-full px-3 py-2 text-sm bg-bg-base border border-border text-text-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent pr-10 transition-all"
          />
          <button
            type="button"
            onClick={() => setShowNew((p) => !p)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-faint hover:text-text-primary transition-colors"
          >
            {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        {errors.newPassword && <p className="text-xs text-semantic-destructive mt-1">{errors.newPassword.message}</p>}
      </div>
      <div>
        <label className="text-xs font-semibold text-text-muted mb-1 block">Confirm New Password</label>
        <input
          type="password"
          {...register("confirmPassword", {
            required: "Please confirm your new password",
            validate: (value) => value === watch("newPassword") || "Passwords do not match"
          })}
          className="w-full px-3 py-2 text-sm bg-bg-base border border-border text-text-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
        />
        {errors.confirmPassword && <p className="text-xs text-semantic-destructive mt-1">{errors.confirmPassword.message}</p>}
      </div>
      <Button type="submit" variant="primary" loading={changePwMutation.isPending}>
        Update Password
      </Button>
    </form>
  );
}

function DeleteAccountSection() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, watch, formState: { errors } } = useForm();

  const deleteMutation = useMutation({
    mutationFn: (data) =>
      api.delete('/users/me', { data: { password: data.password } }),
    onSuccess: () => {
      toast.success('Account deleted successfully!');
      logout();
      navigate('/login');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Delete failed'),
  });

  const confirmText = watch("confirmText");
  const onSubmit = (data) => {
    deleteMutation.mutate(data);
  };

  return (
    <div className="pt-6 space-y-4 max-w-md">
      <div>
        <h3 className="font-bold text-semantic-destructive text-sm font-display">Danger Zone</h3>
        <p className="text-xs text-text-muted mt-0.5">Permanently delete your profile and all associated data.</p>
      </div>

      <div className="p-4 bg-semantic-destructive/5 border border-semantic-destructive/20 rounded-xl space-y-4">
        <p className="text-xs text-semantic-destructive font-medium leading-relaxed">
          Warning: This action is irreversible. All of your posts, comments, connections, messages, and notifications will be permanently purged from our databases.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-text-muted mb-1 block">
              Type <strong className="text-semantic-destructive bg-semantic-destructive/10 border border-semantic-destructive/20 px-1.5 py-0.5 rounded font-mono select-all">DELETE</strong> to confirm
            </label>
            <input
              type="text"
              {...register("confirmText", {
                required: "You must type DELETE to confirm",
                validate: (v) => v === "DELETE" || "You must type DELETE in all caps"
              })}
              placeholder="DELETE"
              className="w-full px-3 py-2 text-sm bg-bg-base border border-border text-text-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-semantic-destructive/50 focus:border-semantic-destructive transition-all font-mono"
            />
            {errors.confirmText && <p className="text-xs text-semantic-destructive mt-1">{errors.confirmText.message}</p>}
          </div>

          <div>
            <label className="text-xs font-semibold text-text-muted mb-1 block">Current Password</label>
            <input
              type="password"
              {...register("password", { required: "Your password is required to delete your account" })}
              className="w-full px-3 py-2 text-sm bg-bg-base border border-border text-text-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-semantic-destructive/50 focus:border-semantic-destructive transition-all"
            />
            {errors.password && <p className="text-xs text-semantic-destructive mt-1">{errors.password.message}</p>}
          </div>

          <Button
            type="submit"
            variant="primary"
            loading={deleteMutation.isPending}
            disabled={confirmText !== "DELETE"}
            className="w-full bg-semantic-destructive hover:bg-semantic-destructive/80 text-white font-semibold transition-all"
          >
            Permanently Delete Account
          </Button>
        </form>
      </div>
    </div>
  );
}

function AccountTab() {
  return (
    <div className="space-y-6">
      <ChangePasswordSection />
      <DeleteAccountSection />
    </div>
  );
}

function PrivacyTab() {
  const queryClient = useQueryClient();

  const { data: meData, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('/auth/me').then(r => r.data)
  });

  const toggleMutation = useMutation({
    mutationFn: (updates) => api.patch('/users/me', updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      toast.success('Privacy settings updated!');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update settings')
  });

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-6 bg-bg-hover rounded w-1/3" />
        <div className="h-12 bg-bg-hover rounded w-full" />
        <div className="h-12 bg-bg-hover rounded w-full" />
      </div>
    );
  }

  const user = meData?.user;
  const isPublic = user?.isPublic ?? true;
  const emailNotif = user?.emailNotifications ?? true;

  const handleTogglePublic = () => {
    toggleMutation.mutate({ isPublic: !isPublic });
  };

  const handleToggleEmail = () => {
    toggleMutation.mutate({ emailNotifications: !emailNotif });
  };

  return (
    <div className="space-y-6 max-w-md">
      <h3 className="font-bold text-text-primary text-sm font-display">Privacy Settings</h3>
      <div className="flex items-center justify-between p-3 bg-bg-base rounded-lg border border-border">
        <div>
          <p className="text-sm font-medium text-text-primary">Public Profile</p>
          <p className="text-xs text-text-muted">Others can find you in search results</p>
        </div>
        <button
          onClick={handleTogglePublic}
          disabled={toggleMutation.isPending}
          className={`w-10 h-5 rounded-full transition-colors relative ${isPublic ? 'bg-accent' : 'bg-border-muted'}`}
        >
          <span
            className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isPublic ? 'left-5' : 'left-0.5'}`}
          />
        </button>
      </div>
      <div className="flex items-center justify-between p-3 bg-bg-base rounded-lg border border-border">
        <div>
          <p className="text-sm font-medium text-text-primary">Email Notifications</p>
          <p className="text-xs text-text-muted">Receive email alerts for notifications</p>
        </div>
        <button
          onClick={handleToggleEmail}
          disabled={toggleMutation.isPending}
          className={`w-10 h-5 rounded-full transition-colors relative ${emailNotif ? 'bg-accent' : 'bg-border-muted'}`}
        >
          <span
            className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${emailNotif ? 'left-5' : 'left-0.5'}`}
          />
        </button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <MainLayout>
      <div className="max-w-[760px] mx-auto">
        <h1 className="text-2xl font-extrabold font-display text-text-primary mb-5">Settings</h1>

        <div className="flex flex-col sm:flex-row gap-4">
          {/* Tab sidebar */}
          <div className="sm:w-[200px] flex sm:flex-col gap-1">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full text-left min-h-[44px] ${
                  activeTab === key
                    ? 'bg-accent/10 text-accent font-semibold'
                    : 'text-text-muted hover:bg-bg-hover hover:text-text-primary'
                }`}
              >
                <Icon size={16} /> {label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <Card className="flex-1 p-6 bg-bg-elevated border border-border shadow-md">
            {activeTab === 'profile' && <EditProfileTab />}
            {activeTab === 'account' && <AccountTab />}
            {activeTab === 'privacy' && <PrivacyTab />}
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
