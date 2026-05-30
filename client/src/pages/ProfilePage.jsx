import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { format } from 'timeago.js';
import {
  User, Star, Calendar, MessageSquare, ThumbsUp, CheckCircle,
  Award, Trophy, ChevronDown, Loader2,
} from 'lucide-react';
import { users } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import useDocumentMeta from '../hooks/useDocumentMeta';
import useAsync from '../hooks/useAsync';
import Spinner from '../components/common/Spinner';
import EmptyState from '../components/common/EmptyState';

const BADGE_COLORS = {
  first_step:  { bg: 'bg-orange-50',   border: 'border-orange-200',  text: 'text-orange-700' },
  contributor: { bg: 'bg-[var(--primary)]/10',     border: 'border-[var(--primary)]',    text: 'text-[var(--primary)]' },
  veteran:     { bg: 'bg-purple-50',   border: 'border-purple-200',  text: 'text-purple-700' },
  expert:      { bg: 'bg-indigo-50',   border: 'border-indigo-200',  text: 'text-indigo-700' },
  legend:      { bg: 'bg-yellow-50',   border: 'border-yellow-200',  text: 'text-yellow-700' },
};

const MEDAL_COLORS = { 0: 'text-yellow-500', 1: 'text-[var(--text-muted)]', 2: 'text-amber-600' };

const ProfilePage = () => {
  const { id } = useParams();
  const { user: currentUser } = useAuth();

  const [tab, setTab] = useState('questions');
  const [followState, setFollowState] = useState(null); // null=loading, true=following, false=not following

  // Fetch profile + leaderboard in parallel
  const { data: profileData, loading, error } = useAsync(
    () => Promise.all([
      users.getProfile(id).then((r) => r.data.data),
      users.getLeaderboard().then((r) => r.data.data).catch(() => []),
    ]).then(([profile, leaderboard]) => ({ profile, leaderboard })),
    [id]
  );

  const profile     = profileData?.profile ?? null;
  const leaderboard = profileData?.leaderboard ?? [];

  // Keep followState in sync with profile data
  useEffect(() => {
    if (profile?.isFollowing !== undefined) {
      setFollowState(!!profile.isFollowing);
    }
  }, [profile?.isFollowing]);

  useDocumentMeta({
    title: profile ? `${profile.name}${profile.role === 'admin' ? ' (Admin)' : profile.role === 'moderator' ? ' (Mod)' : ''}` : 'Profile',
    description: profile?.bio || (profile ? `${profile.name} on FAQ Portal` : ''),
  });

  // Tab data — each tab gets its own useAsync
  const tabApiMap = {
    questions: () => users.getUserActivity(id).then((r) => r.data.data ?? []),
    answers:   () => users.getUserAnswers(id).then((r) => {
      const raw = r.data.data;
      return Array.isArray(raw) ? raw : (raw?.answers ?? []);
    }),
    activity:  () => users.getUserActivity(id).then((r) => {
      const raw = r.data.data;
      return Array.isArray(raw) ? raw : (raw?.activity ?? raw ?? []);
    }),
  };
  const { data: tabData = [], loading: tabLoading } = useAsync(
    tabApiMap[tab] ?? tabApiMap.questions,
    [tab, id]
  );

  const handleFollow = async () => {
    if (!currentUser) { toast.error('Please log in to follow'); return; }
    if (isOwn) return;
    if (followState === null) return; // still loading
    const wasFollowing = followState;
    // Optimistic update
    setFollowState(!wasFollowing);
    try {
      if (wasFollowing) {
        await users.unfollow(id);
      } else {
        await users.follow(id);
      }
      // Re-fetch profile to sync server state (isFollowing, followerCount)
      const { data: newData } = await users.getProfile(id);
      if (newData?.data) {
        setFollowState(!!newData.data.isFollowing);
      }
    } catch (err) {
      // Revert on error
      setFollowState(wasFollowing);
      toast.error(err.response?.data?.error || err.message || 'Action failed');
    }
  };

  // Leaderboard rank
  const rank = leaderboard?.findIndex((u) => u._id === id);
  const inTop10 = rank !== -1;

  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <Spinner size="lg" />
    </div>
  );

  if (error) return (
    <EmptyState icon="UserX" title="User not found"
      message={error?.response?.data?.error || error?.message}
      actionLabel="Go back" onAction={() => window.history.back()} />
  );

  if (!profile) return (
    <EmptyState icon="UserX" title="User not found"
      message="This profile does not exist or has been removed."
      actionLabel="Go back" onAction={() => window.history.back()} />
  );

  const isOwn       = currentUser && (currentUser.id === id || currentUser._id === id);
  const isFollowing = followState === true; // true only when confirmed following
  const followLoading = followState === null && !isOwn && !!currentUser; // null on initial load

  const statCards = [
    { label: 'Questions Asked',    value: profile.questionCount || 0, icon: <MessageSquare size={16} /> },
    { label: 'Answers Given',      value: profile.answerCount   || 0, icon: <ThumbsUp      size={16} /> },
    { label: 'Accepted Answers',   value: profile.acceptedCount || 0, icon: <CheckCircle   size={16} /> },
  ];

  return (
    <div className="min-h-screen bg-[var(--surface)]">
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* ── Profile header card ─────────────────────────────────────── */}
        <div className="bg-[var(--bg)] rounded-2xl border border-[var(--border)] p-4 sm:p-6 mb-6">

          <div className="flex items-start gap-6">
            {/* Avatar */}
            <img
              src={profile.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=3b82f6&color=fff&size=96`}
              alt={profile.name}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover flex-shrink-0 ring-2 ring-[var(--border)]"
            />

            {/* Identity */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-h)]">{profile.name}</h1>
                {profile.role && profile.role !== 'user' && (
                  <span className={`px-2.5 py-0.5 text-xs rounded-full font-bold uppercase tracking-wide ${
                    profile.role === 'admin' ? 'bg-[var(--error)]/10 text-[var(--error)]' : 'bg-[var(--accent)]/10 text-[var(--accent)]'
                  }`}>{profile.role}</span>
                )}
                {/* Leaderboard rank badge */}
                {inTop10 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs rounded-full bg-[var(--card-bg)] text-[var(--primary)] border border-[var(--primary)] font-medium">
                    <Trophy size={11} className={MEDAL_COLORS[rank]} /> #{rank + 1} in Top 10
                  </span>
                )}
              </div>

              {profile.bio && <p className="text-[var(--text-muted)] text-sm mt-1.5 leading-relaxed">{profile.bio}</p>}

              <div className="flex items-center gap-5 mt-3 text-sm text-[var(--text-muted)] flex-wrap">
                <span className="flex items-center gap-1.5">
                  <Star size={14} className="text-yellow-400 fill-yellow-400" />
                  <strong className="text-[var(--text)]">{profile.reputation || 0}</strong> reputation
                </span>
                <span className="flex items-center gap-1.5">
                  <User size={14} />
                  <strong className="text-[var(--text)]">{profile.followerCount || 0}</strong> followers
                </span>
                <span className="flex items-center gap-1.5">
                  <User size={14} />
                  <strong className="text-[var(--text)]">{profile.followingCount || 0}</strong> following
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} />
                  Joined {format(new Date(profile.createdAt), { locale: 'en' })}
                </span>
              </div>
            </div>

            {/* Follow button */}
            {!isOwn && currentUser && (
              <button
                onClick={handleFollow}
                disabled={followLoading}
                className={`flex-shrink-0 px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                  followLoading
                    ? 'opacity-60 cursor-not-allowed'
                    : isFollowing
                      ? 'border-2 border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--error)] hover:text-[var(--error)]'
                      : 'bg-[var(--primary)] text-white hover:opacity-90 shadow-sm'
                }`}
              >
                {followLoading ? '...' : isFollowing ? 'Following' : '+ Follow'}
              </button>
            )}
          </div>

          {/* Badges */}
          {profile.badges?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t border-[var(--border)]">
              {profile.badges.map((b, i) => {
                const key = Object.keys(BADGE_COLORS).find((k) => BADGE_COLORS[k]) || 'first_step';
                const colors = BADGE_COLORS[b.name] || BADGE_COLORS.contributor;
                return (
                  <span key={i} className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs rounded-full border font-medium ${colors.bg} ${colors.border} ${colors.text}`}>
                    <Award size={12} /> {b.name.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Stats row ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          {statCards.map(({ label, value, icon }) => (
            <div key={label} className="bg-[var(--bg)] rounded-xl border border-[var(--border)] p-4 text-center">
              <div className="w-9 h-9 bg-[var(--primary)]/10 rounded-full flex items-center justify-center mx-auto mb-2 text-[var(--primary)]">
                {icon}
              </div>
              <p className="text-2xl font-bold text-[var(--text-h)]">{value.toLocaleString()}</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* ── Tabs ─────────────────────────────────────────────────────── */}
        <div className="bg-[var(--bg)] rounded-2xl border border-[var(--border)] overflow-hidden">
          <div className="flex border-b border-[var(--border)]">
            {['questions', 'answers', 'activity'].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-3 text-sm font-semibold capitalize transition-colors ${
                  tab === t
                    ? 'text-[var(--primary)] border-b-2 border-[var(--primary)] bg-[var(--primary)]/5'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)] border-b-2 border-transparent'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="p-4 min-h-[200px]">
            {tabLoading ? (
              <div className="flex justify-center py-12"><Spinner size="md" /></div>
            ) : tab === 'questions' && (
              <div className="space-y-3">
                {tabData.length === 0 && <p className="text-[var(--text-muted)] text-center py-10 text-sm">No questions yet</p>}
                {tabData.map((faq) => (
                  <Link key={faq._id} to={`/faqs/${faq?._id || ""}`}
                    className="flex items-center justify-between gap-4 p-4 border border-[var(--border)] rounded-xl hover:border-[var(--primary)] hover:bg-[var(--primary)]/10/30 transition-all group">
                    <div className="min-w-0">
                      <p className="font-medium text-[var(--text-h)] group-hover:text-[var(--primary)] transition-colors line-clamp-1">{faq.question}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-[var(--text-muted)]">
                        <span className="flex items-center gap-1"><ThumbsUp size={11} /> {faq.votes || 0}</span>
                        <span className="flex items-center gap-1"><MessageSquare size={11} /> {faq.answerCount || faq.answers?.length || 0}</span>
                        {faq.category && <span className="capitalize">in {faq.category}</span>}
                        {faq.status && faq.status !== 'approved' && (
                          <span className={`px-1.5 py-0.5 text-xs rounded-full capitalize ${
                            faq.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            faq.status === 'closed'   ? 'bg-[var(--error)]/10 text-[var(--error)]' : 'bg-[var(--surface)] text-[var(--text-muted)]'
                          }`}>{faq.status}</span>
                        )}
                      </div>
                    </div>
                    {faq.isPinned && <span className="text-xs text-[var(--primary)] font-medium flex-shrink-0">📌 Pinned</span>}
                  </Link>
                ))}
              </div>
            )}

            {tab === 'answers' && (
              <div className="space-y-3">
                {tabData.length === 0 && <p className="text-[var(--text-muted)] text-center py-10 text-sm">No answers yet</p>}
                {tabData.map((ans) => (
                  <Link key={ans._id} to={`/faqs/${ans.faq?._id || ""}`}
                    className="block p-4 border border-[var(--border)] rounded-xl hover:border-[var(--primary)] hover:bg-[var(--primary)]/10/30 transition-all group">
                    <p className="font-medium text-[var(--text-h)] group-hover:text-[var(--primary)] transition-colors line-clamp-2">
                      {ans.faq?.question || 'FAQ #' + (ans.faq?._id || ans.faq)}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-[var(--text-muted)]">
                      <span className="flex items-center gap-1"><ThumbsUp size={11} /> {ans.votes || 0}</span>
                      {ans.isAccepted && (
                        <span className="flex items-center gap-1 text-[var(--success)]">
                          <CheckCircle size={11} /> Accepted
                        </span>
                      )}
                      <span>{format(new Date(ans.createdAt), { locale: 'en' })}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {tab === 'activity' && (
              <div className="space-y-0">
                {tabData.length === 0 && <p className="text-[var(--text-muted)] text-center py-10 text-sm">No activity yet</p>}
                {tabData.map((event, i) => (
                  <div key={event._id || event.id || `act-${i}`} className="flex items-start gap-3 py-3 border-b border-[var(--border)] last:border-0">
                    <span className="text-xl flex-shrink-0 mt-0.5">{event.icon || '📌'}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-[var(--text)]">
                        <span className="font-medium text-[var(--text-h)]">{profile.name}</span>
                        {' '}{event.text}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">{format(new Date(event.createdAt), { locale: 'en' })}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProfilePage;