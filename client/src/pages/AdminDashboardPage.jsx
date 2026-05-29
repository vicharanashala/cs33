import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow, format } from 'timeago.js';
import {
  LayoutDashboard, Users, FileQuestion, AlertTriangle,
  TrendingUp, Search, Loader2, Shield, Trash2, Ban, CheckCircle,
  XCircle, ChevronUp, ChevronDown, Pin, PinOff,
} from 'lucide-react';
import { admin, faqs } from '../services/api';
import toast from 'react-hot-toast';

// ── Confirm dialog ────────────────────────────────────────────────────────────
const ConfirmDialog = ({ title, message, onConfirm, onCancel, danger }) => (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 mb-5">{message}</p>
      <div className="flex items-center justify-end gap-3">
        <button onClick={onCancel}
          className="px-4 py-2 bg-gray-100 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors">
          Cancel
        </button>
        <button onClick={onConfirm}
          className={`px-4 py-2 text-white text-sm font-semibold rounded-lg transition-colors ${
            danger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
          }`}>
          Confirm
        </button>
      </div>
    </div>
  </div>
);

// ── Stat card ─────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color = 'blue', subtitle }) => (
  <div className="bg-[var(--bg)] rounded-xl border border-[var(--border)] p-4 sm:p-5">
    <div className="flex items-center justify-between mb-3">
      <span className="text-xs sm:text-sm text-[var(--text-muted)] font-medium">{label}</span>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-${color}-50`}>
        <Icon size={16} className={`text-${color}-600`} />
      </div>
    </div>
    <p className="text-2xl sm:text-3xl font-bold text-[var(--text-h)]">{value?.toLocaleString() ?? '—'}</p>
    {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
  </div>
);

// ── Role badge ─────────────────────────────────────────────────────────────────
const RoleBadge = ({ role }) => {
  const map = {
    admin:      { bg: 'bg-red-50',    text: 'text-red-700',   border: 'border-red-200'    },
    moderator:  { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    user:       { bg: 'bg-gray-50',   text: 'text-gray-600',   border: 'border-gray-200'   },
  };
  const s = map[role] || map.user;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full border capitalize ${s.bg} ${s.text} ${s.border}`}>
      {role === 'admin' && <Shield size={10} />}
      {role}
    </span>
  );
};

// ── Bulk approve bar ───────────────────────────────────────────────────────────
const BulkApproveBar = ({ selected, onApprove, onClear }) =>
  selected.size > 0 && (
    <div className="sticky top-16 z-10 bg-blue-600 text-white px-4 py-2.5 flex items-center justify-between rounded-lg shadow-lg mb-4">
      <span className="text-sm font-medium">{selected.size} FAQ{selected.size > 1 ? 's' : ''} selected</span>
      <div className="flex items-center gap-2">
        <button onClick={onApprove}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-blue-600 text-sm font-semibold rounded-lg hover:bg-blue-50 transition-colors">
          <CheckCircle size={14} /> Approve Selected
        </button>
        <button onClick={onClear}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 text-blue-100 text-sm rounded-lg hover:bg-blue-800 transition-colors">
          <XCircle size={14} /> Clear
        </button>
      </div>
    </div>
  );

// ── AdminDashboardPage ─────────────────────────────────────────────────────────
const AdminDashboardPage = () => {
  // Stats
  const [stats, setStats]               = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Users
  const [users, setUsers]               = useState([]);
  const [userTotal, setUserTotal]       = useState(0);
  const [usersPage, setUsersPage]       = useState(1);
  const [userSearch, setUserSearch]     = useState('');
  const [usersLoading, setUsersLoading] = useState(true);

  // Pending FAQs (for bulk approve + pin/close controls)
  const [pendingFAQs, setPendingFAQs]   = useState([]);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [selected, setSelected]         = useState(new Set());

  // Confirmation dialog
  const [confirm, setConfirm]           = useState(null); // { id, action, label }

  // ── Fetch stats ─────────────────────────────────────────────────────────────
  const loadStats = useCallback(async () => {
    try {
      const res = await admin.getStats();
      setStats(res.data.data);
    } catch {
      toast.error('Failed to load stats');
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // ── Fetch users ─────────────────────────────────────────────────────────────
  const loadUsers = useCallback(async (page = 1, search = userSearch) => {
    setUsersLoading(true);
    try {
      const res = await admin.getUsers({ page, limit: 15, search });
      setUsers(res.data.data);
      setUserTotal(res.data.pagination?.totalItems || 0);
      setUsersPage(page);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  }, [userSearch]);

  // ── Fetch pending FAQs ──────────────────────────────────────────────────────
  const loadPending = useCallback(async () => {
    setPendingLoading(true);
    try {
      const res = await faqs.getAll({ status: 'pending', limit: 50 });
      setPendingFAQs(res.data.data || []);
    } catch {
      toast.error('Failed to load pending FAQs');
    } finally {
      setPendingLoading(false);
    }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { loadUsers(); }, [loadUsers]);
  useEffect(() => { loadPending(); }, [loadPending]);

  // ── Debounced user search ───────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => loadUsers(1, userSearch), 350);
    return () => clearTimeout(t);
  }, [userSearch]);

  // ── User actions ───────────────────────────────────────────────────────────
  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await admin.updateRole(userId, newRole);
      setUsers((u) => u.map((x) => x._id === userId ? res.data.data : x));
      toast.success('Role updated');
    } catch (err) {
      toast.error(err.message || 'Failed to update role');
      loadUsers(usersPage); // refresh to reset dropdown
    }
  };

  const handleSuspend = async (userId) => {
    try {
      const res = await admin.suspendUser(userId);
      setUsers((u) => u.map((x) => x._id === userId ? { ...x, isSuspended: res.data.data.isSuspended } : x));
      toast.success(res.data.message);
    } catch (err) {
      toast.error(err.message || 'Failed');
    }
  };

  const handleDelete = async (userId) => {
    try {
      await admin.deleteUser(userId);
      setUsers((u) => u.filter((x) => x._id !== userId));
      setUserTotal((t) => t - 1);
      toast.success('User deleted');
      setConfirm(null);
    } catch (err) {
      toast.error(err.message || 'Failed to delete user');
    }
  };

  // ── Bulk approve ───────────────────────────────────────────────────────────
  const toggleSelect = (id) => {
    setSelected((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleBulkApprove = async () => {
    const ids = [...selected];
    try {
      await Promise.all(ids.map((id) => faqs.updateStatus(id, 'approved')));
      setPendingFAQs((f) => f.filter((faq) => !selected.has(faq._id)));
      setSelected(new Set());
      loadStats(); // refresh stats
      toast.success(`${ids.length} FAQ${ids.length > 1 ? 's' : ''} approved`);
    } catch (err) {
      toast.error('Some approvals may have failed');
    }
  };

  // ── Per-FAQ actions ─────────────────────────────────────────────────────────
  const handlePinToggle = async (faq) => {
    try {
      await faqs.togglePin(faq._id);
      setPendingFAQs((f) => f.filter((x) => x._id !== faq._id));
      toast.success(faq.isPinned ? 'Unpinned' : 'Pinned');
    } catch (err) {
      toast.error(err.message || 'Failed');
    }
  };

  const handleCloseFAQ = async (faq) => {
    try {
      await faqs.updateStatus(faq._id, 'closed');
      setPendingFAQs((f) => f.filter((x) => x._id !== faq._id));
      toast.success('FAQ closed');
    } catch (err) {
      toast.error(err.message || 'Failed');
    }
  };

  const handleApproveOne = async (faq) => {
    try {
      await faqs.updateStatus(faq._id, 'approved');
      setPendingFAQs((f) => f.filter((x) => x._id !== faq._id));
      loadStats();
      toast.success('FAQ approved');
    } catch (err) {
      toast.error(err.message || 'Failed');
    }
  };

  const totalPages = Math.ceil(userTotal / 15);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
            <LayoutDashboard size={20} className="text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-sm text-gray-500">Manage users, content, and site settings</p>
          </div>
        </div>

        {/* ── Stats row ─────────────────────────────────────────────────── */}
        {statsLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 h-28 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <StatCard icon={Users}         label="Total Users"     value={stats?.totalUsers}     color="blue"   subtitle={`${stats?.newUsersThisWeek || 0} new this week`} />
            <StatCard icon={FileQuestion}  label="Total FAQs"      value={stats?.totalFAQs}     color="green"  />
            <StatCard icon={AlertTriangle} label="Pending FAQs"    value={stats?.pendingFAQs}   color="yellow" />
            <StatCard icon={AlertTriangle} label="Reports Today"   value={stats?.reportsToday}   color="red"    />
            <StatCard icon={TrendingUp}    label="New Users (7d)"  value={stats?.newUsersThisWeek} color="purple" />
          </div>
        )}

        {/* ── Pending FAQs bulk approve ───────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <h2 className="text-base font-bold text-[var(--text-h)] mb-4 flex items-center gap-2">
            <AlertTriangle size={16} className="text-yellow-500" />
            Pending Approval
            {pendingFAQs.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full">
                {pendingFAQs.length}
              </span>
            )}
          </h2>

          <BulkApproveBar
            selected={selected}
            onApprove={handleBulkApprove}
            onClear={() => setSelected(new Set())}
          />

          {pendingLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : pendingFAQs.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No pending FAQs — all clear!</p>
          ) : (
            <div className="space-y-2">
              {pendingFAQs.map((faq) => (
                <div key={faq._id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    selected.has(faq._id) ? 'border-blue-400 bg-blue-50' : 'border-gray-100 hover:border-gray-200'
                  }`}>
                  <input
                    type="checkbox"
                    checked={selected.has(faq._id)}
                    onChange={() => toggleSelect(faq._id)}
                    className="w-4 h-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-blue-500"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 line-clamp-1">{faq.question}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      by {faq.author?.name || 'Unknown'} · {faq.category}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => handleApproveOne(faq)}
                      className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg" title="Approve">
                      <CheckCircle size={15} />
                    </button>
                    <button onClick={() => handlePinToggle(faq)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title={faq.isPinned ? 'Unpin' : 'Pin'}>
                      {faq.isPinned ? <PinOff size={15} /> : <Pin size={15} />}
                    </button>
                    <button onClick={() => handleCloseFAQ(faq)}
                      className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg" title="Close">
                      <XCircle size={15} />
                    </button>
                    <Link to={`/faqs/${faq._id}`} target="_blank"
                      className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                      ↗
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── User management table ───────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between gap-4">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Users size={16} /> User Management
              <span className="text-xs font-normal text-gray-400">{userTotal} total</span>
            </h2>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search users..."
                className="pl-8 pr-4 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
              />
            </div>
          </div>

          {usersLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="hidden md:table-header-group bg-[var(--surface)] border-b border-[var(--border)]">
                    <tr>
                      <th className="text-left px-4 sm:px-6 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider hidden md:table-cell">User</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Reputation</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Active</th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)] md:divide-none">
                    {users.map((u) => (
                      <tr key={u._id} className={`hover:bg-gray-50 transition-colors ${u.isSuspended ? 'opacity-60 bg-red-50/30' : ''}`}>
                        <td className="hidden md:table-cell px-6 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=3b82f6&color=fff&size=32`}
                              alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 truncate">{u.name}</p>
                              <p className="text-xs text-gray-400 truncate">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3.5">
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u._id, e.target.value)}
                            className="text-xs border border-gray-200 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400"
                          >
                            <option value="user">user</option>
                            <option value="moderator">moderator</option>
                            <option value="admin">admin</option>
                          </select>
                        </td>
                        <td className="px-6 py-3.5">
                          <span className="font-semibold text-gray-700">{u.reputation || 0}</span>
                        </td>
                        <td className="px-6 py-3.5 text-xs text-gray-400">
                          {u.createdAt ? format(new Date(u.createdAt), 'MMM d, yyyy') : '—'}
                        </td>
                        <td className="px-6 py-3.5 text-xs text-gray-400">
                          {u.updatedAt ? formatDistanceToNow(new Date(u.updatedAt), { locale: 'en' }) : '—'}
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="flex items-center justify-end gap-1">
                            {u.isSuspended ? (
                              <button
                                onClick={() => handleSuspend(u._id)}
                                className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Unsuspend"
                              >
                                <CheckCircle size={14} />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleSuspend(u._id)}
                                className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                                title="Suspend"
                              >
                                <Ban size={14} />
                              </button>
                            )}
                            <button
                              onClick={() => setConfirm({ id: u._id, action: 'delete', label: `Delete ${u.name}? This cannot be undone.` })}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete user"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between">
                  <p className="text-xs text-[var(--text-muted)]">
                    Page {usersPage} of {totalPages}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => loadUsers(usersPage - 1)}
                      disabled={usersPage <= 1}
                      className="px-3 py-1 text-xs border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-40"
                    >
                      ← Prev
                    </button>
                    <button
                      onClick={() => loadUsers(usersPage + 1)}
                      disabled={usersPage >= totalPages}
                      className="px-3 py-1 text-xs border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-40"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Confirm dialog */}
      {confirm && (
        <ConfirmDialog
          title="Delete User"
          message={confirm.label}
          danger
          onConfirm={() => handleDelete(confirm.id)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
};

export default AdminDashboardPage;