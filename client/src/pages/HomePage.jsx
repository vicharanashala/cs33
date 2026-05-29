import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'timeago.js';
import { faqs } from '../services/api';
import { stats } from '../services/api';

const CategoryIcon = ({ category }) => {
  const icons = {
    general:   '💬',
    technical: '🔧',
    billing:   '💰',
    policy:    '📋',
    other:     '📌',
  };
  return <span>{icons[category] || '📌'}</span>;
};

const StatusBadge = ({ status }) => {
  const map = {
    pending:   { label: 'Pending',   cls: 'bg-yellow-100 text-yellow-700' },
    approved:  { label: 'Approved',  cls: 'bg-green-100 text-green-700' },
    rejected:  { label: 'Rejected',  cls: 'bg-red-100 text-red-700' },
    flagged:   { label: 'Flagged',   cls: 'bg-orange-100 text-orange-700' },
  };
  const b = map[status] || map.pending;
  return <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${b.cls}`}>{b.label}</span>;
};

const HomePage = () => {
  const [statsData, setStatsData] = useState({ faqCount: 0, userCount: 0, answerCount: 0 });
  const [trending, setTrending] = useState([]);
  const [pinned, setPinned] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, trendingRes, pinnedRes] = await Promise.all([
          stats.get(),
          faqs.getTrending(),
          faqs.getAll({ sort: 'newest', limit: 5 }),
        ]);
        setStatsData(statsRes.data.data);
        setTrending(trendingRes.data.data || []);
        setPinned(pinnedRes.data.data.filter((f) => f.isPinned) || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Community FAQ Portal</h1>
          <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
            Ask questions, share knowledge, and learn from the community. Submit your own FAQs and help others find answers.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/faqs"
              className="px-6 py-3 bg-white text-blue-700 font-semibold rounded-lg hover:bg-blue-50 transition-colors">
              Browse FAQs
            </Link>
            <Link to="/faqs/submit"
              className="px-6 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-colors">
              Ask a Question
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-6 text-center">
          {[
            { label: 'FAQs',         value: statsData.faqCount },
            { label: 'Answers',      value: statsData.answerCount },
            { label: 'Community',    value: statsData.userCount },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <p className="text-3xl font-bold text-blue-600">{loading ? '—' : value.toLocaleString()}</p>
              <p className="text-gray-500 mt-1 text-sm">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pinned */}
      {pinned.length > 0 && (
        <section className="py-10 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              📌 Pinned FAQs
            </h2>
            <div className="space-y-3">
              {pinned.map((faq) => (
                <Link key={faq._id} to={`/faqs/${faq._id}`}
                  className="block bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{faq.question}</h3>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(faq.author?.name || 'U')}&size=20`}
                            className="w-5 h-5 rounded-full" alt="" />
                          {faq.author?.name}
                        </span>
                        <span>{formatDistanceToNow(new Date(faq.createdAt), { locale: 'en' })}</span>
                        <span>👍 {faq.votes}</span>
                        <span>💬 {faq.answers?.length || 0}</span>
                      </div>
                    </div>
                    <span className="text-xl"><CategoryIcon category={faq.category} /></span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Trending — horizontal scroll */}
      <section className="py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">🔥 Trending FAQs</h2>
          {loading ? (
            <div className="flex gap-4 overflow-hidden">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-64 flex-shrink-0 bg-white rounded-xl border border-gray-200 p-4 h-36 animate-pulse" />
              ))}
            </div>
          ) : trending.length === 0 ? (
            <p className="text-gray-400 text-center py-10">No FAQs yet. Be the first to ask!</p>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide -mx-4 px-4">
              {trending.map((faq, i) => {
                const score = faq.hotScore || 0;
                // Map score to 1-5 stars
                const stars = score >= 200 ? 5 : score >= 80 ? 4 : score >= 30 ? 3 : score >= 10 ? 2 : 1;
                return (
                  <Link key={faq._id} to={`/faqs/${faq._id}`}
                    className="w-64 flex-shrink-0 bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg hover:border-blue-200 transition-all flex flex-col justify-between">
                    {/* Rank */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className={`text-3xl font-black ${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-amber-600' : 'text-gray-300'}`}>
                        #{i + 1}
                      </span>
                      {/* Star rating */}
                      <div className="flex gap-0.5 flex-shrink-0">
                        {[...Array(5)].map((_, si) => (
                          <svg key={si} width="11" height="11" viewBox="0 0 24 24" fill={si < stars ? '#f59e0b' : '#e5e7eb'}>
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                    {/* Question */}
                    <p className="text-sm font-semibold text-gray-800 leading-snug line-clamp-3 flex-1">
                      {faq.question.length > 80 ? faq.question.slice(0, 77) + '...' : faq.question}
                    </p>
                    {/* Stats */}
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <span>👍</span>{faq.votes || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <span>💬</span>{faq.answers?.length || 0}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 px-4 bg-blue-50 border-t border-blue-100">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-3">Have something to share?</h2>
          <p className="text-gray-600 mb-6">Join the community and help others by submitting your own FAQ.</p>
          <Link to="/faqs/submit"
            className="inline-block px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
            Submit an FAQ
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;