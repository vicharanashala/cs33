import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'timeago.js';
import { Rss, ThumbsUp, MessageSquare, Users, Loader2, TrendingUp } from 'lucide-react';
import { users } from '../services/api';
import toast from 'react-hot-toast';

const SuggestedUsers = ({ onFollow }) => {
  const [list, setList] = useState([]);
  useEffect(() => {
    users.getLeaderboard()
      .then((res) => setList(res.data?.slice(0, 5) || []))
      .catch(() => {});
  }, []);

  const handleFollow = async (userId) => {
    let isMounted = true;
    try {
      await users.follow(userId);
      if (!isMounted) return;
      setList((l) => l.filter((u) => u._id !== userId));
      onFollow();
    } catch (err) {
      if (!isMounted) return;
      toast.error(err.message || 'Failed to follow');
    }
  };

  if (list.length === 0) return null;

  return (
    <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border)] p-5">
      <h3 className="font-semibold text-[var(--text-h)] mb-3 flex items-center gap-2">
        <Users size={16} className="text-[var(--primary)]" />
        People to follow
      </h3>
      <div className="space-y-3">
        {list.map((u) => (
          <div key={u._id} className="flex items-center justify-between gap-3">
            <Link to={`/profile/${u._id}`} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
              <img
                src={u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=3b82f6&color=fff&size=32`}
                alt={u.name} className="w-8 h-8 rounded-full object-cover"
              />
              <div>
                <p className="text-sm font-medium text-[var(--text-h)]">{u.name}</p>
                <p className="text-xs text-[var(--text-muted)]">{u.reputation} rep</p>
              </div>
            </Link>
            <button
              onClick={() => handleFollow(u._id)}
              className="text-xs px-3 py-1 bg-[var(--primary)] text-white font-medium rounded-full hover:opacity-90 transition-colors"
            >
              + Follow
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const ActivityFeedPage = () => {
  const [items, setItems]     = useState([]);
  const [page, setPage]       = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = async (p = 1, append = false) => {
    if (p === 1) setLoading(true);
    else setLoadingMore(true);

    let isMounted = true;
    try {
      const res = await users.getFeed();
      if (!isMounted) return;
      const data = Array.isArray(res.data?.data) ? res.data.data : [];
      // Each item: { _id, question, author, createdAt, votes, answerCount }
      if (append) {
        setItems((prev) => {
          if (!isMounted) return prev;
          const existingIds = new Set(prev.map((i) => i._id));
          const newItems = data.filter((i) => !existingIds.has(i._id));
          return [...prev, ...newItems];
        });
      } else {
        setItems(data);
      }
      setHasMore(data.length === 20); // if backend returns 20, assume more exist
    } catch (err) {
      if (!isMounted) return;
      toast.error('Failed to load feed');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    load(1).finally(() => { if (!isMounted) return; });
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-[var(--primary)]/10 rounded-full flex items-center justify-center">
            <Rss size={20} className="text-[var(--primary)]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-h)]">Activity Feed</h1>
            <p className="text-sm text-[var(--text-muted)]">Questions from people you follow</p>
          </div>
        </div>

        {/* Feed or empty state */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-[var(--card-bg)] rounded-xl animate-pulse border border-[var(--border)]" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-[var(--surface)] rounded-full flex items-center justify-center mx-auto mb-4">
              <Rss size={28} className="text-[var(--text-muted)]" />
            </div>
            <h3 className="font-semibold text-[var(--text)] mb-1">Your feed is quiet</h3>
            <p className="text-sm text-[var(--text-muted)] mb-6">Follow other users to see their questions here</p>
            <SuggestedUsers onFollow={() => load(1)} />
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {items.map((faq) => (
                <div key={faq._id}
                  className="bg-[var(--card-bg)] rounded-xl border border-[var(--border)] p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start gap-3">
                    <Link to={`/profile/${faq.author?._id}`} className="flex-shrink-0 hover:opacity-80 transition-opacity">
                      <img
                        src={faq.author?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(faq.author?.name || 'U')}&background=3b82f6&color=fff&size=36`}
                        alt={faq.author?.name || 'User'}
                        className="w-9 h-9 rounded-full object-cover"
                      />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Link to={`/profile/${faq.author?._id}`}
                          className="text-xs font-medium text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors">
                          {faq.author?.name || 'Unknown'}
                        </Link>
                        <span className="text-xs text-[var(--text-muted)]">·</span>
                        <span className="text-xs text-[var(--text-muted)]">
                          {faq.createdAt ? format(new Date(faq.createdAt), { locale: 'en' }) : ''}
                        </span>
                      </div>
                      <Link to={`/faqs/${faq?._id || ""}`}
                        className="block text-sm font-semibold text-[var(--text-h)] hover:text-[var(--primary)] transition-colors line-clamp-2">
                        {faq.question}
                      </Link>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                          <ThumbsUp size={12} /> {faq.votes || 0}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                          <MessageSquare size={12} /> {faq.answerCount || 0}
                        </span>
                        {faq.tags?.slice(0, 3).map((t) => (
                          <span key={t} className="text-[10px] px-2 py-0.5 bg-[var(--primary)]/10 text-[var(--primary)] rounded-full">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Load more */}
            {hasMore && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={() => { setPage((p) => p + 1); load(page + 1, true); }}
                  disabled={loadingMore}
                  className="flex items-center gap-2 px-6 py-2.5 bg-[var(--card-bg)] border border-[var(--border)] text-[var(--text-muted)] text-sm font-medium rounded-lg hover:bg-[var(--surface)] disabled:opacity-50 transition-colors"
                >
                  {loadingMore && <Loader2 size={14} className="animate-spin" />}
                  {loadingMore ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ActivityFeedPage;