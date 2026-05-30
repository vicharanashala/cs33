import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'timeago.js';
import {
  Flag, CheckCircle, XCircle, Clock, AlertTriangle, Eye,
  Loader2, Ban, Shield,
} from 'lucide-react';
import { faqs } from '../services/api';
import { getReports, reviewReport } from '../services/api';
import toast from 'react-hot-toast';

// ── Reject modal ────────────────────────────────────────────────────────────────
const RejectModal = ({ faq, onConfirm, onCancel }) => {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <h3 className="text-lg font-bold text-[var(--text-h)] mb-1">Reject FAQ</h3>
        <p className="text-sm text-[var(--text-muted)] mb-4">"{faq?.question || faq?.target?.question || 'this FAQ'}"</p>
        <label className="block text-sm font-medium text-[var(--text)] mb-1.5">
          Rejection reason <span className="text-[var(--error)]">*</span>
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="Explain why this FAQ is being rejected..."
          className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
        />
        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={() => onConfirm(faq._id, reason)}
            disabled={!reason.trim()}
            className="px-4 py-2 bg-[var(--error)] text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition-colors"
          >
            Confirm Rejection
          </button>
          <button onClick={onCancel}
            className="px-4 py-2 bg-[var(--surface)] text-[var(--text-muted)] text-sm font-medium rounded-lg hover:bg-[var(--surface)] transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Action modal for Reports tab ────────────────────────────────────────────────
const ActionModal = ({ report, onAction, onCancel }) => {
  const [rejectOpen, setRejectOpen] = useState(false);

  const handleApprove = async () => {
    try {
      await faqs.updateStatus(report.faqId, 'approved');
      await reviewReport(report._id, 'reviewed');
      onAction(report._id);
      toast.success('FAQ approved and report marked reviewed');
    } catch (err) {
      toast.error(err.message || 'Failed to approve');
    }
  };

  const handleReject = async (id, reason) => {
    try {
      await faqs.updateStatus(report.faqId, 'rejected', reason);
      await reviewReport(report._id, 'reviewed');
      onAction(report._id);
      toast.success('FAQ rejected and report marked reviewed');
    } catch (err) {
      toast.error(err.message || 'Failed to reject');
    }
  };

  if (rejectOpen) {
    return (
      <RejectModal
        faq={{ _id: report.faqId, question: report.target?.question }}
        onConfirm={handleReject}
        onCancel={() => setRejectOpen(false)}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <h3 className="text-lg font-bold text-[var(--text-h)] mb-1">Take Action</h3>
        <p className="text-sm text-[var(--text-muted)] mb-1">
          Report: <span className="uppercase text-xs font-bold">{report.reason}</span>
        </p>
        {report.target?.question && (
          <p className="text-sm text-[var(--text)] mb-4 line-clamp-2">"{report.target.question}"</p>
        )}
        {report.details && (
          <p className="text-xs text-[var(--text-muted)] mb-4 italic">{report.details}</p>
        )}
        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={handleApprove}
            className="px-4 py-2 bg-[var(--success)] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-colors"
          >
            Approve FAQ
          </button>
          <button
            onClick={() => setRejectOpen(true)}
            className="px-4 py-2 bg-[var(--error)] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-colors"
          >
            Reject FAQ
          </button>
          <button onClick={onCancel}
            className="px-4 py-2 bg-[var(--surface)] text-[var(--text-muted)] text-sm font-medium rounded-lg hover:bg-[var(--surface)] transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// ── FAQ card used in Pending / Flagged tabs ────────────────────────────────────
const FAQRow = ({ faq, onApprove, onReject, variant = 'pending' }) => {
  const [rejectOpen, setRejectOpen] = useState(false);

  const handleApprove = async () => {
    try {
      await faqs.updateStatus(faq._id, 'approved');
      onApprove(faq._id);
      toast.success('FAQ approved!');
    } catch (err) {
      toast.error(err.message || 'Failed to approve');
    }
  };

  const handleReject = async (id, reason) => {
    try {
      await faqs.updateStatus(id, 'rejected', reason);
      onReject(id);
      toast.success('FAQ rejected');
    } catch (err) {
      toast.error(err.message || 'Failed to reject');
    }
  };

  // In flagged tab: "Unflag" sets back to pending
  // In pending tab: "Flag" sets to flagged
  const handleFlag = async () => {
    try {
      const newStatus = variant === 'flagged' ? 'pending' : 'flagged';
      await faqs.updateStatus(faq._id, newStatus);
      onReject(faq._id);
      toast.success(variant === 'flagged' ? 'FAQ unflagged' : 'FAQ flagged for review');
    } catch (err) {
      toast.error(err.message || 'Failed to update');
    }
  };

  return (
    <>
      <div className="bg-white border border-[var(--border)] rounded-xl p-4 hover:shadow-sm transition-shadow">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <Link to={`/faqs/${faq?._id || ""}`} target="_blank"
              className="font-semibold text-[var(--text-h)] hover:text-[var(--primary)] transition-colors line-clamp-2">
              {faq.question}
            </Link>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-[var(--text-muted)] flex-wrap">
              <span className="flex items-center gap-1">
                <img src={faq.author?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(faq.author?.name || 'U')}&size=16`}
                  alt="" className="w-4 h-4 rounded-full" />
                {faq.author?.name || 'Unknown'}
              </span>
              <span className="flex items-center gap-1"><Clock size={11} />
                {faq.createdAt ? format(new Date(faq.createdAt), { locale: 'en' }) : 'recently'}
              </span>
              {faq.category && <span className="capitalize px-2 py-0.5 bg-[var(--surface)] rounded-full">{faq.category}</span>}
              {faq.tags?.map((t) => (
                <span key={t} className="px-2 py-0.5 bg-[var(--primary)]/10 text-[var(--primary)] rounded-full text-[10px]">{t}</span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Link to={`/faqs/${faq?._id || ""}`} target="_blank"
              className="p-1.5 text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded-lg transition-colors"
              title="Preview">
              <Eye size={15} />
            </Link>
            <button onClick={handleApprove}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[var(--success)] bg-[var(--success)]/10 border border-[var(--success)] rounded-lg hover:bg-[var(--success)]/10 transition-colors"
              title="Approve">
              <CheckCircle size={13} /> Approve
            </button>
            <button onClick={() => setRejectOpen(true)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[var(--error)] bg-[var(--error)]/10 border border-[var(--error)] rounded-lg hover:bg-[var(--error)]/10 transition-colors"
              title="Reject">
              <XCircle size={13} /> Reject
            </button>
            <button onClick={handleFlag}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[var(--primary)] bg-[var(--primary)]/10 border border-[var(--primary)] rounded-lg hover:bg-[var(--primary)]/20 transition-colors"
              title={variant === 'flagged' ? 'Unflag (restore to pending)' : 'Flag FAQ'}>
              {variant === 'flagged' ? <><Ban size={13} /> Unflag</> : <><Flag size={13} /> Flag</>}
            </button>
          </div>
        </div>
      </div>

      {rejectOpen && (
        <RejectModal
          faq={faq}
          onConfirm={handleReject}
          onCancel={() => setRejectOpen(false)}
        />
      )}
    </>
  );
};

// ── Report row ────────────────────────────────────────────────────────────────
const ReportRow = ({ report, onAction, onDismiss }) => {
  const [dismissing, setDismissing] = useState(false);
  const [actionOpen, setActionOpen] = useState(false);

  const handleDismiss = async () => {
    setDismissing(true);
    try {
      await reviewReport(report._id, 'dismissed');
      onDismiss(report._id);
      toast.success('Report dismissed');
    } catch (err) {
      toast.error(err.message || 'Failed to dismiss');
    } finally {
      setDismissing(false);
    }
  };

  const REASON_COLORS = {
    spam:        'bg-[var(--surface)] text-[var(--text)]',
    inappropriate: 'bg-orange-100 text-orange-700',
    duplicate:   'bg-[var(--primary)]/10 text-[var(--primary)]',
    off_topic:   'bg-[var(--accent)]/10 text-purple-700',
    other:       'bg-[var(--surface)] text-[var(--text-muted)]',
  };

  return (
    <>
      <div className="bg-white border border-[var(--border)] rounded-xl p-4 hover:shadow-sm transition-shadow">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`px-2 py-0.5 text-xs font-bold uppercase rounded-full ${
                REASON_COLORS[report.reason] || REASON_COLORS.other
              }`}>
                {report.reason || 'other'}
              </span>
              {report.status === 'pending' && (
                <span className="flex items-center gap-1 text-xs text-yellow-600">
                  <Clock size={11} /> Pending
                </span>
              )}
            </div>
            {report.details && (
              <p className="text-sm text-[var(--text-muted)] line-clamp-2 mb-2">{report.details}</p>
            )}
            <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
              <span>Reported by <strong className="text-[var(--text-muted)]">{report.reporter?.name || 'Unknown'}</strong></span>
              <span>{report.createdAt ? format(new Date(report.createdAt), { locale: 'en' }) : ''}</span>
              {report.targetType && (
                <span className="capitalize">on {report.targetType}</span>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            {report.faqId && (
              <Link to={`/faqs/${report.faqId || ""}`} target="_blank"
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[var(--primary)] bg-[var(--primary)]/10 border border-[var(--primary)] rounded-lg hover:bg-[var(--primary)]/10 transition-colors">
                <Eye size={13} /> View FAQ
              </Link>
            )}
            <div className="flex items-center gap-2">
              <button onClick={handleDismiss} disabled={dismissing}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] bg-[var(--surface)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface)] disabled:opacity-50 transition-colors">
                {dismissing ? <Loader2 size={11} className="animate-spin" /> : null}
                Dismiss
              </button>
              <button onClick={() => setActionOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[var(--error)] bg-[var(--error)]/10 border border-[var(--error)] rounded-lg hover:bg-[var(--error)]/10 transition-colors">
                <Flag size={12} /> Take Action
              </button>
            </div>
          </div>
        </div>
      </div>

      {actionOpen && (
        <ActionModal
          report={report}
          onAction={onAction}
          onCancel={() => setActionOpen(false)}
        />
      )}
    </>
  );
};

// ── Empty state ────────────────────────────────────────────────────────────────
const EmptyState = ({ icon: Icon, title, subtitle }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <div className="w-14 h-14 bg-[var(--surface)] rounded-full flex items-center justify-center mb-4">
      <Icon size={24} className="text-[var(--text-muted)]" />
    </div>
    <h3 className="font-semibold text-[var(--text)]">{title}</h3>
    <p className="text-sm text-[var(--text-muted)] mt-1">{subtitle}</p>
  </div>
);

// ── ModQueuePage ───────────────────────────────────────────────────────────────
const ModQueuePage = () => {
  const [tab, setTab]           = useState('pending');
  const [pending, setPending]   = useState([]);
  const [flagged, setFlagged]   = useState([]);
  const [reports, setReports]   = useState([]);
  const [loading, setLoading]   = useState(true);

  const loadAll = async () => {
    setLoading(true);
    let isMounted = true;
    try {
      const [pRes, rRes] = await Promise.all([
        faqs.getAll({ status: 'pending', limit: 50 }),
        getReports('pending'),
      ]);
      if (!isMounted) return;
      setPending(pRes.data.data ?? []);
      setReports(rRes.data ?? []);
    } catch {
      if (!isMounted) return;
      toast.error('Failed to load queue');
    } finally {
      if (isMounted) setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  // Load flagged separately when switching to that tab
  useEffect(() => {
    if (tab !== 'flagged') return;
    let isMounted = true;
    faqs.getAll({ status: 'flagged', limit: 50 })
      .then((res) => { if (isMounted) setFlagged(res.data.data ?? []); })
      .catch(() => { if (isMounted) toast.error('Failed to load flagged'); });
    return () => { isMounted = false; };
  }, [tab]);

  const removeFAQ = (id, list, setList) =>
    setList((l) => l.filter((f) => f._id !== id));

  const dismissReport = (id) =>
    setReports((r) => r.filter((rep) => rep._id !== id));

  const TABS = [
    { key: 'pending', label: 'Pending', icon: Clock,          count: pending.length },
    { key: 'flagged', label: 'Flagged', icon: Flag,           count: flagged.length },
    { key: 'reports', label: 'Reports', icon: AlertTriangle,  count: reports.length },
  ];

  return (
    <div className="min-h-screen bg-[var(--surface)]">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
            <Shield size={20} className="text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-h)]">Moderation Queue</h1>
            <p className="text-sm text-[var(--text-muted)]">Review community content and reports</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-[var(--border)] overflow-hidden">
          <div className="flex border-b border-[var(--border)]">
            {TABS.map(({ key, label, icon: Icon, count }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold transition-colors ${
                  tab === key
                    ? 'text-[var(--primary)] bg-[var(--primary)]/10 border-b-2 border-[var(--primary)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-muted)] border-b-2 border-transparent'
                }`}
              >
                <Icon size={15} />
                {label}
                {count > 0 && (
                  <span className={`min-w-[20px] h-5 px-1.5 text-[11px] font-bold rounded-full flex items-center justify-center ${
                    tab === key ? 'bg-[var(--primary)] text-white' : 'bg-[var(--surface)] text-[var(--text-muted)]'
                  }`}>
                    {count > 99 ? '99+' : count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="p-4 space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 size={22} className="animate-spin text-[var(--primary)]" />
              </div>
            ) : tab === 'pending' && (
              pending.length === 0 ? (
                <EmptyState icon={CheckCircle} title="Queue is clear" subtitle="No FAQs awaiting review" />
              ) : (
                pending.map((faq) => (
                  <FAQRow
                    key={faq._id}
                    faq={faq}
                    variant="pending"
                    onApprove={(id) => removeFAQ(id, pending, setPending)}
                    onReject={(id) => removeFAQ(id, pending, setPending)}
                  />
                ))
              )
            )}

            {tab === 'flagged' && (
              flagged.length === 0 ? (
                <EmptyState icon={CheckCircle} title="No flagged content" subtitle="All clear — no flagged FAQs" />
              ) : (
                flagged.map((faq) => (
                  <FAQRow
                    key={faq._id}
                    faq={faq}
                    variant="flagged"
                    onApprove={(id) => removeFAQ(id, flagged, setFlagged)}
                    onReject={(id) => removeFAQ(id, flagged, setFlagged)}
                  />
                ))
              )
            )}

            {tab === 'reports' && (
              reports.length === 0 ? (
                <EmptyState icon={CheckCircle} title="No pending reports" subtitle="All reports have been reviewed" />
              ) : (
                reports.map((report) => (
                  <ReportRow
                    key={report._id}
                    report={report}
                    onAction={dismissReport}
                    onDismiss={dismissReport}
                  />
                ))
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModQueuePage;