import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { HelpCircle, X, Plus, Eye, EyeOff, CheckCircle, Loader2, AlertTriangle, ExternalLink, Check } from 'lucide-react';
import { faqs } from '../services/api';
import toast from 'react-hot-toast';

const CATEGORIES = ['general', 'technical', 'billing', 'policy', 'other'];
const MAX_TAGS = 5;

const TagInput = ({ tags, onAdd, onRemove }) => {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    faqs.getAll({ limit: 100 })
      .then((res) => {
        const t = [...new Set(res.data.data?.flatMap((f) => f.tags || []) || [])];
        setAllTags(t);
      })
      .catch(() => {});
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
      {/* Tag chips + input */}
      <div className="flex flex-wrap gap-1.5 p-2 border border-gray-300 rounded-lg min-h-[44px] focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
        {tags.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full">
            {t}
            <button type="button" onClick={() => onRemove(t)} className="hover:text-blue-800"><X size={11} /></button>
          </span>
        ))}
        {tags.length < MAX_TAGS && (
          <input
            type="text"
            value={input}
            onChange={(e) => { setInput(e.target.value); setShowSuggestions(true); }}
            onKeyDown={handleKeyDown}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            onFocus={() => setShowSuggestions(true)}
            placeholder={tags.length === 0 ? 'Type a tag and press Enter or comma...' : ''}
            className="flex-1 min-w-[160px] text-sm border-none outline-none bg-transparent placeholder-gray-400"
          />
        )}
      </div>

      {/* Autocomplete dropdown */}
      {showSuggestions && filtered.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
          {filtered.map((t) => (
            <button
              key={t}
              type="button"
              onMouseDown={() => addTag(t)}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors"
            >
              {t}
            </button>
          ))}
        </div>
      )}
      {showSuggestions && input.length > 0 && filtered.length === 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
          <button type="button" onMouseDown={() => addTag(input)} className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors">
            Add "{input}" as new tag
          </button>
        </div>
      )}
    </div>
  );
};

const SubmitFAQPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ question: '', body: '', category: '', tags: [] });
  const [errors, setErrors] = useState({});
  const [showPreview, setShowPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Duplicate detection
  const [similarFAQs, setSimilarFAQs] = useState([]);
  const [duplicateConfirmed, setDuplicateConfirmed] = useState(false);
  const [checkingDupe, setCheckingDupe] = useState(false);
  const dupeTimerRef = useRef(null);

  const checkSimilar = useCallback(async (q) => {
    if (q.trim().length < 20) {
      setSimilarFAQs([]);
      setDuplicateConfirmed(false);
      return;
    }
    setCheckingDupe(true);
    try {
      const res = await faqs.search(q);
      // Filter out near-identical (same slug or very similar question)
      const similar = (res.data.data || []).filter((f) => {
        const sim = f.question?.toLowerCase();
        const current = q.toLowerCase();
        // Show if more than 40% word overlap
        if (!sim) return false;
        const words = current.split(/\s+/).filter((w) => w.length > 3);
        const overlap = words.filter((w) => sim.includes(w)).length;
        return overlap >= Math.max(2, words.length * 0.4);
      });
      setSimilarFAQs(similar);
      if (similar.length > 0) setDuplicateConfirmed(false);
    } catch {}
    finally { setCheckingDupe(false); }
  }, []);

  // Debounced duplicate check on question change
  const handleQuestionChange = (value) => {
    set('question', value);
    clearTimeout(dupeTimerRef.current);
    dupeTimerRef.current = setTimeout(() => checkSimilar(value), 500);
  };

  const validate = () => {
    const e = {};
    if (!form.question.trim()) e.question = 'Question is required';
    else if (form.question.trim().length < 15) e.question = 'Must be at least 15 characters';
    if (!form.category) e.category = 'Please select a category';
    if (similarFAQs.length > 0 && !duplicateConfirmed) {
      e.duplicate = 'Please check the similar questions below and confirm this is not a duplicate.';
    }
    return e;
  };

  const set = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);
    try {
      const res = await faqs.create(form);
      toast.success('Your question is submitted for review!');
      setTimeout(() => navigate('/faqs'), 2000);
    } catch (err) {
      toast.error(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <HelpCircle size={20} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ask the Community</h1>
            <p className="text-sm text-gray-500">Fill in the details below to submit your FAQ</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-6">

          {/* Question */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Question <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={form.question}
                onChange={(e) => handleQuestionChange(e.target.value)}
                placeholder="e.g. How do I reset my password?"
                maxLength={300}
                className={`w-full border rounded-lg px-4 py-2.5 pr-16 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.question ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
              />
              <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${form.question.length > 280 ? 'text-red-400' : 'text-gray-400'}`}>
                {form.question.length}/300
              </span>
            </div>
            {errors.question && <p className="mt-1 text-sm text-red-500 flex items-center gap-1"><X size={13} />{errors.question}</p>}

            {/* Similar questions warning */}
            {similarFAQs.length > 0 && (
              <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2 mb-2">
                  <AlertTriangle size={15} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-yellow-800">
                      {checkingDupe ? 'Checking for similar questions...' : `Similar question${similarFAQs.length > 1 ? 's' : ''} found`}
                    </p>
                    <p className="text-xs text-yellow-700 mt-0.5">
                      Please check these existing FAQs before submitting
                    </p>
                  </div>
                </div>
                <div className="space-y-1.5 ml-7">
                  {similarFAQs.map((f) => (
                    <div key={f._id} className="flex items-center justify-between gap-2">
                      <a
                        href={`/faqs/${f._id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 flex-1 min-w-0"
                      >
                        {f.question}
                        <ExternalLink size={11} className="flex-shrink-0" />
                      </a>
                    </div>
                  ))}
                </div>
                <label className="flex items-start gap-2 mt-3 ml-7 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={duplicateConfirmed}
                    onChange={(e) => setDuplicateConfirmed(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-yellow-400 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs text-yellow-800 leading-snug">
                    I've checked the above questions and confirmed this is <strong>not a duplicate</strong>
                  </span>
                </label>
                {errors.duplicate && (
                  <p className="mt-1 text-xs text-red-500 flex items-center gap-1 ml-7">
                    <X size={11} />{errors.duplicate}
                  </p>
                )}
              </div>
            )}
            {form.question.length >= 20 && similarFAQs.length === 0 && !checkingDupe && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-green-600">
                <Check size={13} /> No similar questions found
              </div>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
              className={`w-full border rounded-lg px-4 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.category ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
            >
              <option value="">Select a category...</option>
              {CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
            {errors.category && <p className="mt-1 text-sm text-red-500 flex items-center gap-1"><X size={13} />{errors.category}</p>}
          </div>

          {/* Body with preview */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-semibold text-gray-700">Details <span className="text-gray-400 font-normal">(optional)</span></label>
              <button
                type="button"
                onClick={() => setShowPreview((p) => !p)}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600 transition-colors"
              >
                {showPreview ? <><EyeOff size={13} /> Edit</> : <><Eye size={13} /> Preview</>}
              </button>
            </div>

            {showPreview ? (
              <div className="border border-gray-300 rounded-lg p-4 min-h-[160px] bg-gray-50 prose prose-sm max-w-none text-gray-700">
                {form.body ? <ReactMarkdown>{form.body}</ReactMarkdown> : <p className="text-gray-400 italic">Nothing to preview yet...</p>}
              </div>
            ) : (
              <div>
                <textarea
                  value={form.body}
                  onChange={(e) => set('body', e.target.value)}
                  placeholder="Add more context, code examples, or links..."
                  rows={7}
                  maxLength={5000}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y text-gray-800"
                />
                <p className="text-right mt-1 text-xs text-gray-400">{form.body.length}/5000</p>
              </div>
            )}
          </div>

          {/* Tags */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-semibold text-gray-700">Tags <span className="text-gray-400 font-normal">(up to {MAX_TAGS})</span></label>
              <span className="text-xs text-gray-400">{tags.length}/{MAX_TAGS}</span>
            </div>
            <TagInput
              tags={form.tags}
              onAdd={(t) => set('tags', [...form.tags, t])}
              onRemove={(t) => set('tags', form.tags.filter((x) => x !== t))}
            />
            <p className="mt-1 text-xs text-gray-400">Press Enter or comma to add a tag. Suggestions appear as you type.</p>
          </div>

          {/* Submit */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {submitting && <Loader2 size={15} className="animate-spin" />}
              {submitting ? 'Submitting...' : 'Submit Question'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/faqs')}
              className="px-6 py-2.5 bg-gray-100 text-gray-600 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubmitFAQPage;