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
    className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-ring-2 focus-ring-blue-500 focus-ring-offset-2 ${
      checked ? 'bg-blue-600' : 'bg-gray-200'
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
    if (user) {
      setForm({ name: user.name || '', bio: user.bio || '', avatar: user.avatar || '' });
      setNotifyOnAnswer(!!user.notifyOnAnswer);
      setNotifyOnComment(!!user.notifyOnComment);
    }
  }, [user]);

  const set = (field, val) => setForm((f) => ({ ...f, [field]: val }));

  const handleAvatarFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Max file size is 5MB'); return; }
    if (!file.type.startsWith('image/')) { toast.error('Only image files allowed'); return; }
    setUploadingAvatar(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await upload.image(fd);
      const url = res.data.url;
      setForm((f) => ({ ...f, avatar: url }));
      toast.success('Avatar uploaded!');
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploadingAvatar(false);
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
      updateUser(res.data.data);
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
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={showPw[name] ? 'text' : 'password'}
          value={passwords[name]}
          onChange={(e) => setPasswords((p) => ({ ...p, [name]: e.target.value }))}
          className="w-full border border-gray-300 rounded-lg pl-4 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
          autoComplete="new-password"
        />
        <button type="button" onClick={() => setShowPw((s) => ({ ...s, [name]: !s[name] }))}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          {showPw[name] ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
            <Camera size={18} className="text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Profile</h1>
        </div>

        <form onSubmit={handleSubmit} noValidate className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">

          {/* Avatar */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">Profile Photo</label>
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
                  className="px-4 py-2 text-sm bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
                >
                  {uploadingAvatar ? 'Uploading...' : 'Upload Photo'}
                </button>
                <p className="text-xs text-gray-400 mt-1.5">JPG, PNG, WebP — max 5MB</p>
              </div>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Display Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              minLength={2} maxLength={50}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
            />
          </div>

          {/* Bio */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-semibold text-gray-700">Bio</label>
              <span className="text-xs text-gray-400">{form.bio.length}/300</span>
            </div>
            <textarea
              value={form.bio}
              onChange={(e) => set('bio', e.target.value)}
              rows={3} maxLength={300}
              placeholder="Tell the community about yourself..."
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-800"
            />
          </div>

          {/* Notification preferences */}
          <div className="border-t border-gray-100 pt-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <Bell size={15} /> Notification Preferences
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Notify on new answers</p>
                  <p className="text-xs text-gray-400">Get notified when someone answers your questions</p>
                </div>
                <Toggle checked={notifyOnAnswer} onChange={setNotifyOnAnswer} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Notify on comments</p>
                  <p className="text-xs text-gray-400">Get notified on comments for your content</p>
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
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {submitting && <Loader2 size={15} className="animate-spin" />}
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
            <button type="button" onClick={() => navigate(-1)}
              className="px-6 py-2.5 bg-gray-100 text-gray-600 font-semibold rounded-lg hover:bg-gray-200 transition-colors">
              Cancel
            </button>
          </div>
        </form>

        {/* Change password */}
        <form onSubmit={handlePasswordChange} noValidate
          className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Lock size={15} /> Change Password
          </h3>

          <PwField name="current" label="Current Password" />
          <PwField name="newPw"   label="New Password" />
          <PwField name="confirm" label="Confirm New Password" />

          <div className="flex items-center gap-3">
            <button type="submit" disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 text-sm border border-gray-300 text-gray-600 font-medium rounded-lg hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
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