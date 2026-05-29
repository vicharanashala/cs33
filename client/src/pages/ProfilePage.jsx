import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'timeago.js';
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
  contributor: { bg: 'bg-blue-50',     border: 'border-blue-200',    text: 'text-blue-700' },
  veteran:     { bg: 'bg-purple-50',   border: 'border-purple-200',  text: 'text-purple-700' },
  expert:      { bg: 'bg-indigo-50',   border: 'border-indigo-200',  text: 'text-indigo-700' },
  legend:      { bg: 'bg-yellow-50',   border: 'border-yellow-200',  text: 'text-yellow-700' },
};

const MEDAL_COLORS = { 0: 'text-yellow-500', 1: 'text-gray-400', 2: 'text-amber-600' };

const ProfilePage = () => {
  const { id } = useParams();
  const { user: currentUser } = useAuth();

  const [tab, setTab] = useState('questions');

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
    try {
      const isFollowing = profile.following?.includes(currentUser.id);
      if (isFollowing) {
        await users.unfollow(id);
        // Optimistically update the cached profile data
        if (profileData) {
          profileData.profile = {
            ...profile,
            following: profile.following.filter((f) => f !== currentUser.id),
            followerCount: Math.max(0, (profile.followerCount || 1) - 1),
          };
        }
      } else {
        await users.follow(id);
        if (profileData) {
          profileData.profile = {
            ...profile,
            following: [...(profile.following || []), currentUser.id],
            followerCount: (profile.followerCount || 0) + 1,
          };
        }
      }
    } catch (err) {
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

  const isOwn     = currentUser && (currentUser.id === id || currentUser._id === id);
  const isFollowing = currentUser && profile.following?.includes(currentUser.id);

  const statCards = [
    { label: 'Questions Asked',    value: profile.questionCount || 0, icon: <MessageSquare size={16} /> },
    { label: 'Answers Given',      value: profile.answerCount   || 0, icon: <ThumbsUp      size={16} /> },
    { label: 'Accepted Answers',   value: profile.acceptedCount || 0, icon: <CheckCircle   size={16} /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
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
                    profile.role === 'admin' ? 'bg-red-100 text-red-600' : 'bg-purple-100 text-purple-600'
                  }`}>{profile.role}</span>
                )}
                {/* Leaderboard rank badge */}
                {inTop10 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200 font-medium">
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
                  <strong className="text-gray-700">{profile.followerCount || 0}</strong> followers
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} />
                  Joined {formatDistanceToNow(new Date(profile.createdAt), { locale: 'en' })}
                </span>
              </div>
            </div>

            {/* Follow button */}
            {!isOwn && currentUser && (
              <button
                onClick={handleFollow}
                className={`flex-shrink-0 px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                  isFollowing
                    ? 'border-2 border-gray-300 text-gray-600 hover:border-red-300 hover:text-red-500'
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                }`}
              >
                {isFollowing ? 'Following' : '+ Follow'}
              </button>
            )}
          </div>

          {/* Badges */}
          {profile.badges?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t border-gray-100">
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
                {tabData.length === 0 && <p className="text-gray-400 text-center py-10 text-sm">No questions yet</p>}
                {tabData.map((faq) => (
                  <Link key={faq._id} to={`/faqs/${faq._id}`}
                    className="flex items-center justify-between gap-4 p-4 border border-gray-100 rounded-xl hover:border-blue-200 hover:bg-blue-50/30 transition-all group">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-1">{faq.question}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><ThumbsUp size={11} /> {faq.votes || 0}</span>
                        <span className="flex items-center gap-1"><MessageSquare size={11} /> {faq.answerCount || faq.answers?.length || 0}</span>
                        {faq.category && <span className="capitalize">in {faq.category}</span>}
                        {faq.status && faq.status !== 'approved' && (
                          <span className={`px-1.5 py-0.5 text-xs rounded-full capitalize ${
                            faq.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            faq.status === 'closed'   ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500'
                          }`}>{faq.status}</span>
                        )}
                      </div>
                    </div>
                    {faq.isPinned && <span className="text-xs text-blue-500 font-medium flex-shrink-0">📌 Pinned</span>}
                  </Link>
                ))}
              </div>
            )}

            {tab === 'answers' && (
              <div className="space-y-3">
                {tabData.length === 0 && <p className="text-gray-400 text-center py-10 text-sm">No answers yet</p>}
                {tabData.map((ans) => (
                  <Link key={ans._id} to={`/faqs/${ans.faq?._id || ans.faq}`}
                    className="block p-4 border border-gray-100 rounded-xl hover:border-blue-200 hover:bg-blue-50/30 transition-all group">
                    <p className="font-medium text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {ans.faq?.question || 'FAQ #' + (ans.faq?._id || ans.faq)}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><ThumbsUp size={11} /> {ans.votes || 0}</span>
                      {ans.isAccepted && (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle size={11} /> Accepted
                        </span>
                      )}
                      <span>{formatDistanceToNow(new Date(ans.createdAt), { locale: 'en' })}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {tab === 'activity' && (
              <div className="space-y-0">
                {tabData.length === 0 && <p className="text-gray-400 text-center py-10 text-sm">No activity yet</p>}
                {tabData.map((event, i) => (
                  <div key={i} className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
                    <span className="text-xl flex-shrink-0 mt-0.5">{event.icon || '📌'}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium text-gray-900">{profile.name}</span>
                        {' '}{event.text}
                        {event.faq && (
                          <> — <Link to={`/faqs/${event.faq._id}`} className="text-blue-500 hover:underline">{event.faq.question}</Link></>
                        )}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatDistanceToNow(new Date(event.createdAt), { locale: 'en' })}</p>
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