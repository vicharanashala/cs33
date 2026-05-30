import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Edit2, X, Eye, EyeOff, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { faqs } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const CATEGORIES = ['general', 'technical', 'billing', 'policy', 'other'];
const MAX_TAGS = 5;

// ── Shared TagInput (duplicated here to keep components self-contained) ─────────
const TagInput = ({ tags, onAdd, onRemove }) => {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const ref = useRef(null);

  useEffect(() => {
    const fetchTags = () => {
      faqs.getAll({ limit: 100 })
        .then((res) => {
          const t = [...new Set((res.data.data ?? []).flatMap((f) => f.tags ?? []) ?? [])];
          setAllTags(t);
        })
        .catch(() => {});
    };
    fetchTags();
  }, []);

  const handleKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault();
      addTag(input.trim());
    }
    if (e.key === 'Backspace' && !input && tags.length > 0) {
      onRemove(tags[tags.length - 1]);
    }
  };

  const addTag = (val) => {
    const t = val.toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (!t || tags.includes(t) || tags.length >= MAX_TAGS || t.length > 20) return;
    onAdd(t);
    setInput('');
    setSuggestions([]);
  };

  const filtered = input.length > 0
    ? allTags.filter((t) => t.includes(input.toLowerCase()) && !tags.includes(t)).slice(0, 6)
    : [];

  return (
    <div className="relative" ref={ref}>
      <div className="flex flex-wrap gap-1.5 p-2 border border-[var(--border)] rounded-lg min-h-[44px] focus-within:ring-2 focus-within:ring-[var(--primary)] focus-within:border-[var(--primary)]">
        {tags.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 bg-[var(--primary)]/10 text-[var(--primary)] text-xs rounded-full">
            {t}
            <button type="button" onClick={() => onRemove(t)} className="hover:text-[var(--primary)]"><X size={11} /></button>
          </span>
        ))}
        {tags.length < MAX_TAGS && (
          <input
            type="text"
            value={input}
            onChange={(e) => { setInput(e.target.value); setSuggestions([]); }}
            onKeyDown={handleKeyDown}
            onBlur={() => setTimeout(() => setSuggestions(false), 150)}
            onFocus={() => setSuggestions(true)}
            placeholder={tags.length === 0 ? 'Type a tag and press Enter or comma...' : ''}
            className="flex-1 min-w-[160px] text-sm border-none outline-none bg-transparent placeholder-gray-400"
          />
        )}
      </div>
      {suggestions && filtered.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-[var(--border)] rounded-lg shadow-lg">
          {filtered.map((t) => (
            <button key={t} type="button" onMouseDown={() => addTag(t)}
              className="w-full text-left px-3 py-2 text-sm text-[var(--text)] hover:bg-[var(--primary)]/10 transition-colors">{t}</button>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Revision history collapsible ───────────────────────────────────────────────
const RevisionHistory = ({ history }) => {
  const [open, setOpen] = useState(false);
  if (!history || history.length === 0) return null;
  return (
    <div className="border border-[var(--border)] rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-[var(--surface)] hover:bg-[var(--surface)] transition-colors text-sm font-medium text-[var(--text-muted)]"
      >
        <span>📜 Revision History ({history.length} edit{history.length > 1 ? 's' : ''})</span>
        {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
      </button>
      {open && (
        <div className="divide-y divide-gray-100">
          {[...history].reverse().map((rev, i) => (
            <div key={i} className="px-4 py-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[var(--text-muted)]">
                  {new Date(rev.editedAt).toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-[var(--text)]">{rev.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── EditFAQPage ────────────────────────────────────────────────────────────────
const EditFAQPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ question: '', body: '', category: '', tags: [] });
  const [errors, setErrors] = useState({});
  const [showPreview, setShowPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [originalFaq, setOriginalFaq] = useState(null);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    const fetchFAQ = async () => {
      try {
        const res = await faqs.getOne(id);
        if (!isMounted) return;
        const faq = res.data.data;

        const isOwner = faq.author?._id === user?.id || faq.author === user?.id;
        const isMod = user?.role === 'moderator' || user?.role === 'admin';
        if (!isOwner && !isMod) {
          if (!isMounted) return;
          toast.error('Not authorized to edit this FAQ');
          navigate('/');
          return;
        }

        if (!isMounted) return;
        setForm({ question: faq.question, body: faq.body || '', category: faq.category, tags: faq.tags || [] });
        setOriginalFaq(faq);
      } catch {
        if (!isMounted) return;
        toast.error('Failed to load FAQ');
        navigate('/');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchFAQ();
    return () => { isMounted = false; };
  }, [id, user, navigate]);

  const set = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.question.trim()) e.question = 'Question is required';
    else if (form.question.trim().length < 15) e.question = 'Must be at least 15 characters';
    if (!form.category) e.category = 'Please select a category';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);
    try {
      await faqs.update(id, form);
      toast.success('FAQ updated successfully!');
      navigate(`/faqs/${id}`);
    } catch (err) {
      toast.error(err.message || 'Update failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[var(--surface)] flex items-center justify-center">
      <Loader2 size={28} className="animate-spin text-[var(--primary)]" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--surface)] py-10 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
            <Edit2 size={20} className="text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-h)]">Edit FAQ</h1>
            <p className="text-sm text-[var(--text-muted)]">Update your question and community details</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-6">

          {/* Question */}
          <div>
            <label className="block text-sm font-semibold text-[var(--text)] mb-1.5">
              Question <span className="text-[var(--error)]">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={form.question}
                onChange={(e) => set('question', e.target.value)}
                maxLength={300}
                className={`w-full border rounded-lg px-4 py-2.5 pr-16 text-[var(--text-h)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] ${errors.question ? 'border-[var(--error)] bg-[var(--error)]/10' : 'border-[var(--border)]'}`}
              />
              <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${form.question.length > 280 ? 'text-[var(--error)]' : 'text-[var(--text-muted)]'}`}>
                {form.question.length}/300
              </span>
            </div>
            {errors.question && <p className="mt-1 text-sm text-[var(--error)] flex items-center gap-1"><X size={13} />{errors.question}</p>}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-[var(--text)] mb-1.5">
              Category <span className="text-[var(--error)]">*</span>
            </label>
            <select
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
              className={`w-full border rounded-lg px-4 py-2.5 text-[var(--text-h)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] ${errors.category ? 'border-[var(--error)] bg-[var(--error)]/10' : 'border-[var(--border)]'}`}
            >
              <option value="">Select a category...</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
            {errors.category && <p className="mt-1 text-sm text-[var(--error)] flex items-center gap-1"><X size={13} />{errors.category}</p>}
          </div>

          {/* Body */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-semibold text-[var(--text)]">Details <span className="text-[var(--text-muted)] font-normal">(optional)</span></label>
              <button type="button" onClick={() => setShowPreview((p) => !p)}
                className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors">
                {showPreview ? <><EyeOff size={13} /> Edit</> : <><Eye size={13} /> Preview</>}
              </button>
            </div>
            {showPreview ? (
              <div className="border border-[var(--border)] rounded-lg p-4 min-h-[160px] bg-[var(--surface)] prose prose-sm max-w-none text-[var(--text)]">
                {form.body ? <ReactMarkdown>{form.body}</ReactMarkdown> : <p className="text-[var(--text-muted)] italic">Nothing to preview yet...</p>}
              </div>
            ) : (
              <div>
                <textarea
                  value={form.body}
                  onChange={(e) => set('body', e.target.value)}
                  rows={7} maxLength={5000}
                  className="w-full border border-[var(--border)] rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-y text-[var(--text-h)]"
                />
                <p className="text-right mt-1 text-xs text-[var(--text-muted)]">{form.body.length}/5000</p>
              </div>
            )}
          </div>

          {/* Tags */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-semibold text-[var(--text)]">Tags <span className="text-[var(--text-muted)] font-normal">(up to {MAX_TAGS})</span></label>
              <span className="text-xs text-[var(--text-muted)]">{form.tags.length}/{MAX_TAGS}</span>
            </div>
            <TagInput
              tags={form.tags}
              onAdd={(t) => set('tags', [...form.tags, t])}
              onRemove={(t) => set('tags', form.tags.filter((x) => x !== t))}
            />
          </div>

          {/* Revision history */}
          {originalFaq?.revisionHistory?.length > 0 && (
            <RevisionHistory history={originalFaq.revisionHistory} />
          )}

          {/* Submit */}
          <div className="flex items-center gap-3 pt-2">
            <button type="submit" disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-[var(--primary)] text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
              {submitting && <Loader2 size={15} className="animate-spin" />}
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
            <Link to={`/faqs/${id}`}
              className="px-6 py-2.5 bg-[var(--surface)] text-[var(--text-muted)] font-semibold rounded-lg hover:bg-[var(--surface)] transition-colors">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditFAQPage;