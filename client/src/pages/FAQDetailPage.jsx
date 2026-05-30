import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { format } from 'timeago.js';
import {
  ChevronUp, ChevronDown, Bookmark, BookmarkCheck, Flag, Edit2, Trash2,
  CheckCircle, MessageSquare, Eye, AlertTriangle, X, Send,
} from 'lucide-react';
import { faqs, users } from '../services/api';
import ShareButton from '../components/faq/ShareButton';
import useDocumentMeta from '../hooks/useDocumentMeta';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import toast from 'react-hot-toast';

const REPORT_REASONS = [
  'Spam or advertising',
  'Inappropriate content',
  'Incorrect information',
  'Duplicate question',
  'Offensive or harmful',
  'Other',
];

const getAvatarUrl = (author) =>
  author?.avatar ||
  `https://ui-avatars.com/api/?name=${encodeURIComponent(author?.name || 'U')}&background=3b82f6&color=fff&size=40`;

const VoteButtons = ({ votes, voters, onVote, disabled }) => {
  const { user } = useAuth();
  const userVote = user && voters
    ? voters.find((v) => v.user === user.id || v.user?._id === user.id)?.vote || 0
    : 0;

  return (
    <div className="flex flex-col items-center gap-0.5">
      <button
        onClick={() => onVote(1)}
        disabled={disabled}
        className={`p-1 rounded hover:bg-[var(--surface)] transition-colors ${userVote === 1 ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'} ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
      >
        <ChevronUp size={22} strokeWidth={2.5} />
      </button>
      <span className={`font-bold text-sm ${userVote !== 0 ? (userVote === 1 ? 'text-[var(--primary)]' : 'text-[var(--error)]') : 'text-[var(--text)]'}`}>
        {votes || 0}
      </span>
      <button
        onClick={() => onVote(-1)}
        disabled={disabled}
        className={`p-1 rounded hover:bg-[var(--surface)] transition-colors ${userVote === -1 ? 'text-[var(--error)]' : 'text-[var(--text-muted)]'} ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
      >
        <ChevronDown size={22} strokeWidth={2.5} />
      </button>
    </div>
  );
};

const Comment = ({ comment, onDelete, canDelete }) => (
  <div className="flex gap-2 py-2 border-t border-[var(--border)]">
    <img src={getAvatarUrl(comment.author)} className="w-6 h-6 rounded-full mt-0.5 flex-shrink-0 object-cover" alt="" />
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-[var(--text)]">{comment.author?.name}</span>
        <span className="text-xs text-[var(--text-muted)]">{format(new Date(comment.createdAt), { locale: 'en' })}</span>
        {canDelete && (
          <button onClick={() => onDelete(comment._id)} className="ml-auto text-[var(--text-muted)] hover:text-[var(--error)] transition-colors">
            <X size={12} />
          </button>
        )}
      </div>
      <p className="text-sm text-[var(--text-muted)] mt-0.5">{comment.body}</p>
    </div>
  </div>
);

const AnswerCard = ({ answer, faqAuthorId, currentUser, onVote, onAccept, onDelete, onAddComment, onDeleteComment }) => {
  const { user } = useAuth();
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const canDelete = user && (answer.author?._id === user.id || answer.author === user.id || user.role === 'moderator' || user.role === 'admin');
  const canEdit = user && (answer.author?._id === user.id || answer.author === user.id);

  const handleComment = async () => {
    if (!commentText.trim()) return;
    setSubmitting(true);
    let isMounted = true;
    try {
      await onAddComment(answer._id, commentText.trim());
      if (!isMounted) return;
      setCommentText('');
      setShowCommentInput(false);
    } catch (err) {
      if (!isMounted) return;
      toast.error(err.message || 'Failed to add comment');
    } finally {
      if (isMounted) setSubmitting(false);
    }
  };

  return (
    <div className={`bg-[var(--card-bg)] border rounded-lg p-5 ${answer.isAccepted ? 'border-[var(--success)] bg-[var(--success)]/10' : 'border-[var(--border)]'}`}>
      {answer.isAccepted && (
        <div className="flex items-center gap-1 text-[var(--success)] text-xs font-semibold mb-3">
          <CheckCircle size={14} /> Accepted Answer
        </div>
      )}

      <div className="flex gap-4">
        <VoteButtons
          votes={answer.votes}
          voters={answer.voters}
          onVote={(v) => onVote(answer._id, v)}
          disabled={!user}
        />

        <div className="flex-1 min-w-0">
          <div className="prose prose-sm max-w-none text-[var(--text)] mb-4"><ReactMarkdown>{answer.body}</ReactMarkdown></div>

          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <img src={getAvatarUrl(answer.author)} className="w-7 h-7 rounded-full object-cover" alt="" />
              <div className="text-sm">
                <span className="font-medium text-[var(--text)]">{answer.author?.name}</span>
                {answer.author?.reputation != null && (
                  <span className="text-[var(--text-muted)] text-xs ml-1">★ {answer.author.reputation}</span>
                )}
              </div>
              <span className="text-xs text-[var(--text-muted)]">
                {format(new Date(answer.createdAt), { locale: 'en' })}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {user && faqAuthorId && (user.id === faqAuthorId || user._id === faqAuthorId) && !answer.isAccepted && (
                <button
                  onClick={() => onAccept(answer._id)}
                  className="flex items-center gap-1 text-xs text-[var(--success)] hover:text-[var(--success)] font-medium transition-colors"
                >
                  <CheckCircle size={13} /> Accept
                </button>
              )}
              {canEdit && (
                <button className="text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"><Edit2 size={13} /></button>
              )}
              {canDelete && (
                <button onClick={() => onDelete(answer._id)} className="text-[var(--text-muted)] hover:text-[var(--error)] transition-colors">
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Comments */}
          {answer.comments?.length > 0 && (
            <div className="mt-3 border-t border-[var(--border)] pt-2">
              {answer.comments.map((c) => (
                <Comment
                  key={c._id}
                  comment={c}
                  onDelete={(cid) => onDeleteComment(answer._id, cid)}
                  canDelete={user && (c.author?._id === user.id || c.author === user.id || user.role === 'moderator' || user.role === 'admin')}
                />
              ))}
            </div>
          )}

          {/* Add comment */}
          {user && (
            <div className="mt-3 border-t border-[var(--border)] pt-2">
              {!showCommentInput ? (
                <button
                  onClick={() => setShowCommentInput(true)}
                  className="text-xs text-[var(--primary)] hover:underline flex items-center gap-1"
                >
                  <MessageSquare size={12} /> Add a comment
                </button>
              ) : (
                <div className="flex gap-2 items-end">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment..."
                    maxLength={500}
                    rows={2}
                    className="flex-1 text-sm border border-[var(--border)] rounded p-2 resize-none focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                  />
                  <button
                    onClick={handleComment}
                    disabled={submitting || !commentText.trim()}
                    className="p-2 text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded disabled:opacity-40 transition-colors"
                  >
                    <Send size={14} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const FAQDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { socket } = useSocket();

  const [faq, setFaq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  const [answerBody, setAnswerBody] = useState('');
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const lastAddedAnswerId = useRef(null);
  const isSubmittingRef = useRef(false);

  // Socket setup — reuse shared context socket
  useEffect(() => {
    if (!id || !socket) return;

    socket.emit('faq:join', id);

    let isMounted = true;

    socket.on('faq:voted', ({ votes }) => {
      if (!isMounted) return;
      setFaq((prev) => prev ? { ...prev, votes } : prev);
    });

    socket.on('faq:newAnswer', ({ answer }) => {
      if (!isMounted) return;
      if (answer._id === lastAddedAnswerId.current) {
        lastAddedAnswerId.current = null;
        return;
      }
      setFaq((prev) => {
        if (!prev) return prev;
        if (prev.answers.some((a) => a._id === answer._id)) return prev;
        return { ...prev, answers: [...prev.answers, answer] };
      });
      // Only toast for other users' answers — our own answer shows "Answer posted!" already
      const isOwnAnswer = answer.author?._id === user?.id || answer.author === user?.id;
      if (!isOwnAnswer) toast.success('New answer posted!');
    });

    socket.on('faq:answerVoted', ({ answerId, votes }) => {
      if (!isMounted) return;
      setFaq((prev) => {
        if (!prev) return prev;
        return { ...prev, answers: prev.answers.map((a) => a._id === answerId ? { ...a, votes } : a) };
      });
    });

    socket.on('answer:accepted', ({ answerId }) => {
      if (!isMounted) return;
      setFaq((prev) => {
        if (!prev) return prev;
        return { ...prev, answers: prev.answers.map((a) => ({ ...a, isAccepted: a._id === answerId })) };
      });
    });

    return () => {
      isMounted = false;
      socket.emit('faq:leave', id);
      socket.off('faq:voted');
      socket.off('faq:newAnswer');
      socket.off('faq:answerVoted');
      socket.off('answer:accepted');
    };
  }, [id, socket]);

  // Fetch FAQ
  useEffect(() => {
    if (!id) return;
    const fetchFAQ = async () => {
      try {
        const res = await faqs.getOne(id);
        setFaq(res.data.data);
      } catch (err) {
        setError(err.message || 'Failed to load FAQ');
      } finally {
        setLoading(false);
      }
    };
    fetchFAQ();
  }, [id]);

  const canEdit = user && faq && (
    faq.author?._id === user.id ||
    faq.author === user.id ||
    user.role === 'moderator' ||
    user.role === 'admin'
  );

  // ── Hook: must be called unconditionally, before any early returns ──────────
  useDocumentMeta({
    title: faq ? faq.question : 'Loading FAQ...',
    description: faq
      ? (faq.body || '').replace(/[#*`_~[\]()!>-]/g, '').replace(/\n+/g, ' ').trim().slice(0, 160)
      : '',
  });

  const handleFAQVote = async (vote) => {
    if (!user) { toast.error('Login to vote'); return; }
    if (!faq?._id) { console.error('[vote] faq._id is missing'); return; }
    try {
      console.log('[vote] id:', faq._id, '| vote:', vote);
      const res = await faqs.vote(faq._id, { vote });
      setFaq((prev) => prev ? { ...prev, votes: res.data.data.votes } : prev);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleAnswerVote = async (answerId, vote) => {
    if (!user) { toast.error('Login to vote'); return; }
    try {
      const res = await faqs.voteAnswer(faq._id, answerId, { vote });
      setFaq((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          answers: prev.answers.map((a) => a._id === answerId ? { ...a, votes: res.data.data.votes } : a),
        };
      });
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleAccept = async (answerId) => {
    try {
      await faqs.acceptAnswer(faq._id, answerId);
      setFaq((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          answers: prev.answers.map((a) => ({ ...a, isAccepted: a._id === answerId })),
        };
      });
      toast.success('Answer accepted!');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteAnswer = async (answerId) => {
    if (!confirm('Delete this answer?')) return;
    try {
      await faqs.deleteAnswer(faq._id, answerId);
      setFaq((prev) => prev ? { ...prev, answers: prev.answers.filter((a) => a._id !== answerId) } : prev);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleAddComment = async (answerId, body) => {
    const res = await faqs.addComment(faq._id, { body, answerId });
    setFaq((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        answers: prev.answers.map((a) =>
          a._id === answerId ? { ...a, comments: res.data?.comments || a.comments } : a
        ),
      };
    });
  };

  const handleDeleteComment = async (answerId, commentId) => {
    try {
      await faqs.deleteComment(faq._id, commentId, { answerId });
      setFaq((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          answers: prev.answers.map((a) =>
            a._id === answerId
              ? { ...a, comments: a.comments.filter((c) => c._id !== commentId) }
              : a
          ),
        };
      });
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleSave = async () => {
    if (!user) { toast.error('Login to save'); return; }
    try {
      await users.saveFAQ(faq._id);
      setSaved((s) => !s);
      toast.success(saved ? 'Removed from saved' : 'Saved!');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleReport = async (e) => {
    e.preventDefault();
    if (!reportReason) return;
    setSubmittingReport(true);
    try {
      await faqs.report(faq._id, { reason: reportReason, details: reportDetails });
      toast.success('Report submitted. Thank you!');
      setShowReport(false);
      setReportReason('');
      setReportDetails('');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmittingReport(false);
    }
  };

  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    // Yield to event loop so both StrictMode renders hit the same ref state.
    // The first call sets the ref to true synchronously; the second will see it
    // and return before making any network request.
    await Promise.resolve();
    if (isSubmittingRef.current) return;
    if (answerBody.trim().length < 30) {
      toast.error('Answer must be at least 30 characters');
      return;
    }
    isSubmittingRef.current = true;
    setSubmittingAnswer(true);
    let isMounted = true;
    try {
      const res = await faqs.addAnswer(faq._id, { body: answerBody.trim() });
      if (!isMounted) return;
      const newAnswer = res.data.data;
      lastAddedAnswerId.current = newAnswer._id;
      setFaq((prev) => {
        if (!prev) return prev;
        // Discard if answer already exists (dedup against socket event + StrictMode double-call)
        if (prev.answers?.some((a) => a._id === newAnswer._id)) return prev;
        return { ...prev, answers: [...prev.answers, newAnswer] };
      });
      setAnswerBody('');
      toast.success('Answer posted!');
    } catch (err) {
      if (!isMounted) return;
      toast.error(err.message);
    } finally {
      if (isMounted) {
        setSubmittingAnswer(false);
        isSubmittingRef.current = false;
      }
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-4">
        <div className="h-8 bg-[var(--surface)] rounded w-2/3 animate-pulse" />
        <div className="h-4 bg-[var(--surface)] rounded w-1/3 animate-pulse" />
        <div className="h-32 bg-[var(--surface)] rounded animate-pulse mt-6" />
        <div className="h-20 bg-[var(--surface)] rounded animate-pulse" />
      </div>
    );
  }

  if (error || !faq) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-[var(--error)] font-medium">{error || 'FAQ not found'}</p>
        <Link to="/faqs" className="text-[var(--primary)] hover:underline mt-3 inline-block">← Back to FAQs</Link>
      </div>
    );
  }

  const sortedAnswers = [...(faq.answers || [])].sort((a, b) => {
    if (a.isAccepted && !b.isAccepted) return -1;
    if (!a.isAccepted && b.isAccepted) return 1;
    return (b.votes || 0) - (a.votes || 0);
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex gap-8">
        {/* Main content */}
        <div className="flex-1 min-w-0">

          {/* Question — desktop vote buttons */}
          <div className="hidden md:flex gap-4 mb-6">
            <VoteButtons
              votes={faq.votes}
              voters={faq.voters}
              onVote={handleFAQVote}
              disabled={!user}
            />
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-[var(--text-h)] leading-snug">{faq.question}</h1>
              <div className="flex items-center gap-3 mt-2 text-sm text-[var(--text-muted)] flex-wrap">
                <span className="flex items-center gap-1">
                  <img src={getAvatarUrl(faq.author)} className="w-6 h-6 rounded-full object-cover" alt="" />
                  <span className="text-[var(--text-muted)] font-medium">{faq.author?.name}</span>
                  {faq.author?.reputation != null && <span className="text-yellow-500">★ {faq.author.reputation}</span>}
                </span>
                <span>{format(new Date(faq.createdAt), { locale: 'en' })}</span>
                <span className="flex items-center gap-0.5"><Eye size={13} /> {faq.views || 0} views</span>
                <span className="flex items-center gap-0.5"><MessageSquare size={13} /> {faq.answers?.length || 0} answers</span>
              </div>

              {faq.body && (
                <div className="mt-4 prose prose-blue max-w-none text-[var(--text)]">
                  <div className="prose prose-sm max-w-none text-[var(--text)]"><ReactMarkdown>{faq.body}</ReactMarkdown></div>
                </div>
              )}

              {/* Tags, category, wiki */}
              <div className="flex flex-wrap items-center gap-2 mt-4">
                {faq.tags?.map((t) => (
                  <Link key={t} to={`/faqs?tag=${t}`} className="px-2.5 py-0.5 bg-[var(--surface)] text-[var(--text-muted)] text-xs rounded-full hover:bg-[var(--border)] transition-colors">
                    {t}
                  </Link>
                ))}
                <span className="px-2.5 py-0.5 bg-[var(--primary)]/10 text-[var(--primary)] text-xs rounded-full capitalize font-medium">{faq.category}</span>
                {faq.isCommunityWiki && (
                  <span className="px-2.5 py-0.5 bg-purple-50 text-purple-600 text-xs rounded-full font-medium">Wiki</span>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 mt-4 flex-wrap">
                {user && (
                  <button
                    onClick={handleSave}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm transition-colors ${
                      saved ? 'bg-[var(--primary)]/10 border-[var(--primary)] text-[var(--primary)]' : 'border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--surface)]'
                    }`}
                  >
                    {saved ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
                    {saved ? 'Saved' : 'Save'}
                  </button>
                )}
                <ShareButton question={faq?.question} faqId={faq?._id} />
                <button
                  onClick={() => setShowReport((s) => !s)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--border)] text-[var(--text-muted)] text-sm hover:bg-[var(--surface)] transition-colors"
                >
                  <Flag size={14} /> Report
                </button>
                {canEdit && (
                  <>
                    <Link to={`/faqs/${faq?._id || ""}/edit`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--border)] text-[var(--text-muted)] text-sm hover:bg-[var(--surface)] transition-colors">
                      <Edit2 size={14} /> Edit
                    </Link>
                    <button onClick={() => { if (confirm('Delete this FAQ?')) navigate(`/faqs`); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--error)]/30 text-[var(--error)] text-sm hover:bg-[var(--error)]/10 transition-colors">
                      <Trash2 size={14} /> Delete
                    </button>
                  </>
                )}
              </div>

              {/* Report form */}
              {showReport && (
                <form onSubmit={handleReport} className="mt-4 p-4 border border-yellow-500/30 bg-yellow-500/10 rounded-lg max-w-sm">
                  <h4 className="font-semibold text-sm text-[var(--text)] mb-2 flex items-center gap-1"><AlertTriangle size={14} /> Report Content</h4>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full border border-[var(--border)] rounded p-2 text-sm mb-2 focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                    required
                  >
                    <option value="">Select a reason...</option>
                    {REPORT_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <textarea
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder="Additional details (optional)"
                    rows={2}
                    maxLength={500}
                    className="w-full border border-[var(--border)] rounded p-2 text-sm mb-2 resize-none focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                  />
                  <div className="flex gap-2">
                    <button type="submit" disabled={submittingReport} className="px-3 py-1.5 bg-[var(--error)] text-white text-sm rounded hover:opacity-90 disabled:opacity-50 transition-colors">
                      {submittingReport ? 'Submitting...' : 'Submit Report'}
                    </button>
                    <button type="button" onClick={() => setShowReport(false)} className="px-3 py-1.5 bg-[var(--surface)] text-[var(--text-muted)] text-sm rounded hover:bg-[var(--border)] transition-colors">
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Answers */}
          <div className="mt-8">
            <h2 className="text-xl font-bold text-[var(--text-h)] mb-4">
              {faq.answers?.length || 0} {faq.answers?.length === 1 ? 'Answer' : 'Answers'}
            </h2>
            <div className="space-y-4">
              {sortedAnswers.map((answer) => (
                <AnswerCard
                  key={answer._id}
                  answer={answer}
                  faqAuthorId={faq.author?._id || faq.author}
                  currentUser={user}
                  onVote={handleAnswerVote}
                  onAccept={handleAccept}
                  onDelete={handleDeleteAnswer}
                  onAddComment={handleAddComment}
                  onDeleteComment={handleDeleteComment}
                />
              ))}
            </div>
          </div>

          {/* Submit answer */}
          {user ? (
            <form id="answer-form" onSubmit={handleSubmitAnswer} className="mt-8 bg-[var(--bg)] border border-[var(--border)] rounded-lg p-5">
              <h3 className="font-semibold text-[var(--text-h)] mb-3">Your Answer</h3>
              <textarea
                value={answerBody}
                onChange={(e) => setAnswerBody(e.target.value)}
                placeholder="Write your answer... (min 30 characters)"
                rows={6}
                maxLength={5000}
                className="w-full border border-[var(--border)] rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-sm text-[var(--text)]"
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-[var(--text-muted)]">{answerBody.length} / 5000 · min 30</span>
                <button
                  type="submit"
                  disabled={submittingAnswer || answerBody.trim().length < 30}
                  className="px-5 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50 transition-colors"
                >
                  {submittingAnswer ? 'Posting...' : 'Post Answer'}
                </button>
              </div>
            </form>
          ) : (
            <div className="mt-8 text-center py-6 bg-[var(--surface)] rounded-lg border border-[var(--border)]">
              <p className="text-[var(--text-muted)] text-sm">
                <Link to="/login" state={{ from: location }} className="text-[var(--primary)] hover:underline font-medium">Login</Link>
                {' '}to post an answer
              </p>
            </div>
          )}
        </div>

        {/* Sidebar — related FAQs */}
        {faq.relatedFAQs?.length > 0 && (
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <h3 className="font-semibold text-[var(--text)] mb-3 text-sm">Related FAQs</h3>
            <div className="space-y-2">
              {faq.relatedFAQs.map((related) => (
                <Link key={related._id} to={`/faqs/${related?._id || ""}`}
                  className="block text-sm text-[var(--primary)] hover:text-[var(--primary)] hover:underline line-clamp-2">
                  {related.question}
                </Link>
              ))}
            </div>
          </aside>
        )}
      </div>
    </div>
  );

      {/* Floating vote bar — mobile only */}
      {user && (
        <div className="floating-vote-bar">
          <div className="flex items-center gap-1">
            <button onClick={() => handleFAQVote(1)}
              className="p-2 text-[var(--primary)] hover:bg-[var(--surface)] rounded-lg transition-colors">
              <ChevronUp size={20} strokeWidth={2.5} />
            </button>
            <span className="font-bold text-base text-[var(--text)] min-w-[32px] text-center">
              {faq.votes || 0}
            </span>
            <button onClick={() => handleFAQVote(-1)}
              className="p-2 text-[var(--text-muted)] hover:bg-[var(--surface)] rounded-lg transition-colors">
              <ChevronDown size={20} strokeWidth={2.5} />
            </button>
          </div>
          <button
            onClick={() => document.getElementById('answer-form')?.scrollIntoView({ behavior: 'smooth' })}
            className="flex items-center gap-2 px-5 py-2.5 bg-[var(--primary)] text-white text-sm font-semibold rounded-full hover:opacity-90 transition-opacity"
          >
            <MessageSquare size={15} /> Answer
          </button>
        </div>
      )}
};

export default FAQDetailPage;