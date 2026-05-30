import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Loader2, Eye, EyeOff, Bell, BellOff, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { users, upload } from '../services/api';
import toast from 'react-hot-toast';

const Toggle = ({ checked, onChange, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-ring-2 focus-ring-[var(--primary)] focus-ring-offset-[var(--ring-offset-bg)] ${
      checked ? 'bg-[var(--primary)]' : 'bg-[var(--surface)]'
    }`}
  >
    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
      checked ? 'translate-x-5' : 'translate-x-0'
    }`} />
  </button>
);

const EditProfilePage = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [form, setForm] = useState({ name: '', bio: '', avatar: '' });
  const [notifyOnAnswer,  setNotifyOnAnswer]  = useState(true);
  const [notifyOnComment, setNotifyOnComment] = useState(true);
  const [passwords, setPasswords] = useState({ current: '', newPw: '', confirm: '' });
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
  const [submitting, setSubmitting] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (!user) return;
    setForm({ name: user.name || '', bio: user.bio || '', avatar: user.avatar || '' });
    setNotifyOnAnswer(!!user.notifyOnAnswer);
    setNotifyOnComment(!!user.notifyOnComment);
  }, [user]);

  const set = (field, val) => setForm((f) => ({ ...f, [field]: val }));

  const handleAvatarFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Max file size is 5MB'); return; }
    if (!file.type.startsWith('image/')) { toast.error('Only image files allowed'); return; }
    setUploadingAvatar(true);
    let isMounted = true;
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await upload.image(fd);
      if (!isMounted) return;
      const url = res.data.url;
      setForm((f) => ({ ...f, avatar: url }));
      toast.success('Avatar uploaded!');
    } catch (err) {
      if (!isMounted) return;
      toast.error(err.message || 'Upload failed');
    } finally {
      if (isMounted) setUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || form.name.trim().length < 2) {
      toast.error('Name must be at least 2 characters'); return;
    }

    setSubmitting(true);
    try {
      const res = await users.updateProfile(user.id, {
        name: form.name.trim(),
        bio: form.bio.trim(),
        avatar: form.avatar.trim(),
        notifyOnAnswer,
        notifyOnComment,
      });
      updateUser(res.data);
      toast.success('Profile updated!');
      navigate(`/profile/${user.id}`);
    } catch (err) {
      toast.error(err.message || 'Update failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    const { current, newPw, confirm } = passwords;
    if (!current) { toast.error('Enter your current password'); return; }
    if (newPw.length < 8) { toast.error('New password must be at least 8 characters'); return; }
    if (newPw !== confirm) { toast.error('New passwords do not match'); return; }

    setSubmitting(true);
    try {
      await users.changePassword(user.id, { currentPassword: current, newPassword: newPw });
      toast.success('Password changed successfully!');
      setPasswords({ current: '', newPw: '', confirm: '' });
    } catch (err) {
      toast.error(err.message || 'Could not change password');
    } finally {
      setSubmitting(false);
    }
  };

  const PwField = ({ name, label }) => (
    <div>
      <label className="block text-sm font-medium text-[var(--text)] mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={showPw[name] ? 'text' : 'password'}
          value={passwords[name]}
          onChange={(e) => setPasswords((p) => ({ ...p, [name]: e.target.value }))}
          className="w-full border border-[var(--border)] rounded-lg pl-4 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-[var(--text-h)]"
          autoComplete="new-password"
        />
        <button type="button" onClick={() => setShowPw((s) => ({ ...s, [name]: !s[name] }))}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-muted)]">
          {showPw[name] ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--surface)] py-10 px-4">
      <div className="max-w-xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[var(--primary)]/10 rounded-full flex items-center justify-center">
            <Camera size={18} className="text-[var(--primary)]" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-h)]">Edit Profile</h1>
        </div>

        <form onSubmit={handleSubmit} noValidate className="bg-white rounded-2xl border border-[var(--border)] p-6 space-y-6">

          {/* Avatar */}
          <div>
            <label className="block text-sm font-semibold text-[var(--text)] mb-3">Profile Photo</label>
            <div className="flex items-center gap-5">
              <div className="relative flex-shrink-0">
                <img
                  src={form.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(form.name || 'U')}&background=3b82f6&color=fff&size=80`}
                  alt="Avatar preview"
                  className="w-20 h-20 rounded-2xl object-cover ring-2 ring-gray-100"
                />
                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center">
                    <Loader2 size={18} className="animate-spin text-white" />
                  </div>
                )}
              </div>
              <div>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarFile} className="hidden" />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="px-4 py-2 text-sm bg-[var(--surface)] text-[var(--text)] font-medium rounded-lg hover:bg-[var(--surface)] disabled:opacity-50 transition-colors"
                >
                  {uploadingAvatar ? 'Uploading...' : 'Upload Photo'}
                </button>
                <p className="text-xs text-[var(--text-muted)] mt-1.5">JPG, PNG, WebP — max 5MB</p>
              </div>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-[var(--text)] mb-1.5">Display Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              minLength={2} maxLength={50}
              className="w-full border border-[var(--border)] rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-[var(--text-h)]"
            />
          </div>

          {/* Bio */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-semibold text-[var(--text)]">Bio</label>
              <span className="text-xs text-[var(--text-muted)]">{form.bio.length}/300</span>
            </div>
            <textarea
              value={form.bio}
              onChange={(e) => set('bio', e.target.value)}
              rows={3} maxLength={300}
              placeholder="Tell the community about yourself..."
              className="w-full border border-[var(--border)] rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none text-[var(--text-h)]"
            />
          </div>

          {/* Notification preferences */}
          <div className="border-t border-[var(--border)] pt-5">
            <h3 className="text-sm font-semibold text-[var(--text)] mb-4 flex items-center gap-2">
              <Bell size={15} /> Notification Preferences
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[var(--text)]">Notify on new answers</p>
                  <p className="text-xs text-[var(--text-muted)]">Get notified when someone answers your questions</p>
                </div>
                <Toggle checked={notifyOnAnswer} onChange={setNotifyOnAnswer} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[var(--text)]">Notify on comments</p>
                  <p className="text-xs text-[var(--text-muted)]">Get notified on comments for your content</p>
                </div>
                <Toggle checked={notifyOnComment} onChange={setNotifyOnComment} />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-[var(--primary)] text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {submitting && <Loader2 size={15} className="animate-spin" />}
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
            <button type="button" onClick={() => navigate(-1)}
              className="px-6 py-2.5 bg-[var(--surface)] text-[var(--text-muted)] font-semibold rounded-lg hover:bg-[var(--surface)] transition-colors">
              Cancel
            </button>
          </div>
        </form>

        {/* Change password */}
        <form onSubmit={handlePasswordChange} noValidate
          className="bg-white rounded-2xl border border-[var(--border)] p-6 space-y-5">
          <h3 className="text-sm font-semibold text-[var(--text)] flex items-center gap-2">
            <Lock size={15} /> Change Password
          </h3>

          <PwField name="current" label="Current Password" />
          <PwField name="newPw"   label="New Password" />
          <PwField name="confirm" label="Confirm New Password" />

          <div className="flex items-center gap-3">
            <button type="submit" disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 text-sm border border-[var(--border)] text-[var(--text-muted)] font-medium rounded-lg hover:bg-[var(--surface)] disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
              {submitting ? <Loader2 size={13} className="animate-spin" /> : <Lock size={13} />}
              Update Password
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default EditProfilePage;