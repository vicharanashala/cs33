import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'timeago.js';
import { Bookmark, ThumbsUp, MessageSquare, Eye, Loader2, BookmarkCheck } from 'lucide-react';
import { users } from '../services/api';
import toast from 'react-hot-toast';

const SavedFAQsPage = () => {
  const [faqs, setFaqs]   = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await users.getSaved();
      setFaqs((res.data.data ?? []));
    } catch {
      toast.error('Failed to load saved FAQs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    load().finally(() => { if (!isMounted) return; });
    return () => { isMounted = false; };
  }, []);

  const handleUnsave = async (faqId) => {
    try {
      await users.saveFAQ(faqId);
      setFaqs((f) => f.filter((faq) => {
        const id = faq._id || faq;
        return id !== faqId;
      }));
      toast.success('Removed from saved');
    } catch (err) {
      toast.error(err.message || 'Failed to remove');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--surface)]">
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
            <BookmarkCheck size={20} className="text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-h)]">Saved FAQs</h1>
            <p className="text-sm text-[var(--text-muted)]">{faqs.length} bookmarked question{faqs.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 bg-white rounded-xl animate-pulse border border-[var(--border)]" />
            ))}
          </div>
        ) : faqs.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-[var(--surface)] rounded-full flex items-center justify-center mx-auto mb-4">
              <Bookmark size={28} className="text-[var(--text-muted)]" />
            </div>
            <h3 className="font-semibold text-[var(--text)] mb-1">No saved FAQs yet</h3>
            <p className="text-sm text-[var(--text-muted)] mb-6">Bookmark questions to find them quickly later</p>
            <Link to="/faqs"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--primary)] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-colors">
              Browse FAQs
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {faqs.map((faq) => {
              const id = faq._id || faq;
              const question = faq.question || faq;
              const author = faq.author;
              const votes = faq.votes ?? 0;
              const answerCount = faq.answerCount ?? faq.answers?.length ?? 0;
              const views = faq.views ?? 0;
              const tags = faq.tags || [];
              const category = faq.category;
              const createdAt = faq.createdAt;

              return (
                <div key={id}
                  className="bg-white rounded-xl border border-[var(--border)] p-5 hover:shadow-sm transition-all group">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        {author && (
                          <Link to={`/profile/${author._id}`}
                            className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors">
                            <img
                              src={author.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(author.name)}&background=3b82f6&color=fff&size=20`}
                              alt="" className="w-5 h-5 rounded-full"
                            />
                            {author.name}
                          </Link>
                        )}
                        {createdAt && (
                          <span className="text-xs text-[var(--text-muted)]">
                            asked {format(new Date(createdAt), { locale: 'en' })}
                          </span>
                        )}
                        {category && (
                          <span className="text-xs px-2 py-0.5 bg-[var(--surface)] text-[var(--text-muted)] rounded-full capitalize">
                            {category}
                          </span>
                        )}
                      </div>

                      <Link to={`/faqs/${id}`}
                        className="block font-semibold text-[var(--text-h)] hover:text-[var(--primary)] transition-colors text-base leading-snug mb-2">
                        {question}
                      </Link>

                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {tags.map((t) => (
                            <span key={t} className="text-xs px-2 py-0.5 bg-[var(--primary)]/10 text-[var(--primary)] rounded-full">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
                        <span className="flex items-center gap-1">
                          <ThumbsUp size={12} className={votes > 0 ? 'text-[var(--success)]' : ''} /> {votes}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare size={12} /> {answerCount} answer{answerCount !== 1 ? 's' : ''}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye size={12} /> {views} view{views !== 1 ? 's' : ''}
                        </span>
                        {faq.isAccepted && (
                          <span className="flex items-center gap-1 text-[var(--success)] font-medium">
                            ✓ Accepted
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleUnsave(id)}
                        title="Remove bookmark"
                        className="p-2 text-[var(--primary)] bg-[var(--primary)]/10 hover:bg-[var(--error)]/10 hover:text-[var(--error)] rounded-lg transition-colors group-hover:opacity-100 opacity-60"
                      >
                        <Bookmark size={16} className="fill-current" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedFAQsPage;