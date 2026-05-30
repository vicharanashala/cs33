import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import { users } from '../services/api';
import { useAuth } from '../context/AuthContext';
import useAsync from '../hooks/useAsync';
import Spinner from '../components/common/Spinner';
import EmptyState from '../components/common/EmptyState';

const MEDAL = {
  0: { icon: '🥇', bg: 'bg-[var(--card-bg)]', border: 'border-[var(--primary)]', text: 'text-[var(--primary)]' },
  1: { icon: '🥈', bg: 'bg-[var(--surface)]', border: 'border-[var(--border)]',  text: 'text-[var(--text-muted)]'  },
  2: { icon: '🥉', bg: 'bg-[var(--card-bg)]', border: 'border-[var(--accent)]',  text: 'text-[var(--accent)]'      },
};

const LeaderboardPage = () => {
  const { user } = useAuth();
  // Fetch leaderboard data on mount
  const { data, loading, error } = useAsync(
    () => users.getLeaderboard().then((r) => r.data.data ?? []),
    []
  );

  const board = data ?? [];
  const myRank = user
    ? board.find((u) => u._id === user.id || u._id === user._id) ?? null
    : null;

  return (
    <div className="min-h-screen bg-[var(--surface)]">
      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
            <Trophy size={20} className="text-yellow-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-h)]">Leaderboard</h1>
            <p className="text-sm text-[var(--text-muted)]">Top contributors by reputation</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : error ? (
          <EmptyState icon="AlertCircle" title="Failed to load leaderboard"
            message={error?.response?.data?.error || error?.message}
            actionLabel="Retry" onAction={() => window.location.reload()} />
        ) : (
          <>
            {/* Top 3 podium */}
            {board.slice(0, 3).map((u, i) => (
              <div key={u._id}
                className={`relative rounded-2xl border p-5 mb-4 ${MEDAL[i].bg} ${MEDAL[i].border}`}>
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{MEDAL[i].icon}</span>
                  <Link to={`/profile/${u._id}`} className="flex items-center gap-3 flex-1 hover:opacity-80 transition-opacity">
                    <img
                      src={u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=3b82f6&color=fff&size=48`}
                      alt={u.name} className="w-12 h-12 rounded-full object-cover ring-2 ring-white"
                    />
                    <div>
                      <p className="font-bold text-[var(--text-h)]">{u.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {u.badges?.slice(0, 2).map((b, bi) => (
                          <span key={bi} className="text-xs px-2 py-0.5 bg-[var(--card-bg)]/70 rounded-full text-[var(--text-muted)]">
                            {b.name?.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  </Link>
                  <div className="text-right flex-shrink-0">
                    <p className="text-2xl font-bold text-[var(--primary)]">{u.reputation?.toLocaleString()}</p>
                    <p className="text-xs text-[var(--text-muted)]">{u.faqCount || 0} FAQs</p>
                  </div>
                </div>
              </div>
            ))}

            {/* Ranked list 4+ */}
            <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border)] overflow-hidden divide-y divide-gray-100">
              {board.slice(3).map((u, idx) => {
                const rank = idx + 4;
                const isMe = user && (u._id === user.id || u._id === user._id);
                return (
                  <Link key={u._id} to={`/profile/${u._id}`}
                    className={`flex items-center gap-4 px-5 py-3.5 hover:bg-[var(--surface)] transition-colors ${isMe ? 'bg-[var(--primary)]/10' : ''}`}>
                    <span className="w-7 text-center font-mono text-sm font-semibold text-[var(--text)] flex-shrink-0">
                      #{rank}
                    </span>
                    <img
                      src={u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=3b82f6&color=fff&size=36`}
                      alt={u.name} className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isMe ? 'text-[var(--primary)]' : 'text-[var(--text-h)]'}`}>
                        {u.name} {isMe && <span className="text-xs text-[var(--primary)]">(you)</span>}
                      </p>
                      {u.badges?.length > 0 && (
                        <div className="flex items-center gap-1 mt-0.5">
                          {u.badges.slice(0, 2).map((b, bi) => (
                            <span key={bi} className="text-[10px] px-1.5 py-0.5 bg-[var(--primary)]/10 text-[var(--primary)] rounded-full">
                              {b.name?.replace('_', ' ')}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-[var(--text-h)]">{u.reputation?.toLocaleString()}</p>
                      <p className="text-[11px] text-[var(--text-muted)]">{u.faqCount || 0} FAQs</p>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* My rank (outside top 10) */}
            {myRank && (
              <div className="mt-4 rounded-2xl border-2 border-dashed border-[var(--primary)] bg-[var(--primary)]/10 px-5 py-3.5 flex items-center gap-4">
                <span className="w-7 text-center font-mono text-sm font-semibold text-[var(--primary)] flex-shrink-0">
                  #{board.length + 1}+
                </span>
                <img
                  src={myRank.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(myRank.name)}&background=3b82f6&color=fff&size=36`}
                  alt={myRank.name} className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--primary)]">You</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-[var(--primary)]">{myRank.reputation?.toLocaleString()}</p>
                  <p className="text-[11px] text-[var(--primary)]">your score</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default LeaderboardPage;