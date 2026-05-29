import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, X, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'timeago.js';
import { notifications as notifApi } from '../../services/api';
import { useSocket } from '../../context/SocketContext';

const NotificationBell = () => {
  const { socket } = useSocket();
  const navigate = useNavigate();
  const ref = useRef(null);
  const [open, setOpen] = useState(false);
  const [list, setList] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch initial notifications
  useEffect(() => {
    notifApi.getAll()
      .then((res) => {
        setList(res.data.data || []);
        setUnread(res.data.unreadCount || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Socket subscription — prepend new notifications
  useEffect(() => {
    if (!socket) return;
    const onNew = (notif) => {
      setList((prev) => [notif, ...prev]);
      setUnread((n) => n + 1);
    };
    socket.on('notification:new', onNew);
    return () => socket.off('notification:new', onNew);
  }, [socket]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = () => setOpen((o) => !o);

  const handleOne = async (notif) => {
    if (!notif.isRead) {
      try { await notifApi.markRead(notif._id); } catch {}
      setList((l) => l.map((n) => n._id === notif._id ? { ...n, isRead: true } : n));
      setUnread((n) => Math.max(0, n - 1));
    }
    if (notif.faqId) navigate(`/faqs/${notif.faqId}`);
    setOpen(false);
  };

  const handleMarkAll = async () => {
    try {
      await notifApi.markAllRead();
      setList((l) => l.map((n) => ({ ...n, isRead: true })));
      setUnread(0);
    } catch {}
  };

  const visible = list.slice(0, 10);

  return (
    <div className="relative" ref={ref}>
      {/* Bell trigger */}
      <button
        onClick={handleOpen}
        className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-700">Notifications</span>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button
                  onClick={handleMarkAll}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  <CheckCheck size={13} /> Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={15} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 size={18} className="animate-spin text-blue-500" />
              </div>
            ) : visible.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-8">No notifications yet</p>
            ) : (
              visible.map((n) => (
                <button
                  key={n._id}
                  onClick={() => handleOne(n)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                    !n.isRead ? 'border-l-2 border-blue-500 bg-blue-50/40' : 'border-l-2 border-transparent'
                  }`}
                >
                  <p className="text-sm text-gray-700 leading-snug">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {n.createdAt ? formatDistanceToNow(new Date(n.createdAt), { locale: 'en' }) : ''}
                  </p>
                </button>
              ))
            )}
          </div>

          {/* Footer link */}
          {list.length > 10 && (
            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              className="block text-center text-xs text-blue-500 hover:text-blue-600 py-2.5 border-t border-gray-100 font-medium"
            >
              View all notifications
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;