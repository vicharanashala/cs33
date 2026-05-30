import { useState, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';

const MarkdownEditor = ({ value = '', onChange, placeholder = '', maxLength = 5000 }) => {
  const [showPreview, setShowPreview] = useState(false);
  const textareaRef = useRef(null);

  // ── helpers ─────────────────────────────────────────────────────────────────
  const wrapSelection = useCallback((before, after, placeholder = '') => {
    const ta = textareaRef.current;
    if (!ta) return;
    const { selectionStart: ss, selectionEnd: se } = ta;
    const selected = value.slice(ss, se);
    const insert = selected || placeholder;
    const newText =
      value.slice(0, ss) + before + insert + after + value.slice(se);
    onChange(newText);
    // Restore cursor after React re-render
    requestAnimationFrame(() => {
      ta.focus();
      const newCursor = ss + before.length + insert.length;
      ta.setSelectionRange(newCursor, newCursor);
    });
  }, [value, onChange]);

  const insertAtCursor = useCallback((text) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const { selectionStart: ss } = ta;
    const newText = value.slice(0, ss) + text + value.slice(ss);
    onChange(newText);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = ss + text.length;
      ta.setSelectionRange(pos, pos);
    });
  }, [value, onChange]);

  // ── toolbar actions ─────────────────────────────────────────────────────────
  const actions = [
    {
      label: 'Bold', title: 'Bold (Ctrl+B)',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
        </svg>
      ),
      run: () => wrapSelection('**', '**', 'bold text'),
    },
    {
      label: 'Italic', title: 'Italic (Ctrl+I)',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/>
          <line x1="15" y1="4" x2="9" y2="20"/>
        </svg>
      ),
      run: () => wrapSelection('_', '_', 'italic text'),
    },
    {
      label: 'Inline code', title: 'Inline code',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
        </svg>
      ),
      run: () => wrapSelection('`', '`', 'code'),
    },
    {
      label: 'Code block', title: 'Code block',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 10l4 2-4 2"/>
          <line x1="12" y1="16" x2="16" y2="16"/>
        </svg>
      ),
      run: () => wrapSelection('\n```\n', '\n```\n', 'code block'),
    },
    {
      label: 'Link', title: 'Link',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
        </svg>
      ),
      run: () => wrapSelection('[', '](url)', 'link text'),
    },
    {
      label: 'Bullet list', title: 'Bullet list',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/>
          <line x1="9" y1="18" x2="20" y2="18"/>
          <circle cx="4" cy="6" r="1.5" fill="currentColor" stroke="none"/>
          <circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none"/>
          <circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none"/>
        </svg>
      ),
      run: () => insertAtCursor('\n- '),
    },
  ];

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      insertAtCursor('  ');
    }
  };

  const charCount = value.length;
  const nearLimit = charCount >= maxLength - 100;

  return (
    <div className="border border-[var(--border)] rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-[var(--primary)] focus-within:border-[var(--primary)] transition-all">

      {/* Toolbar */}
      <div className="flex items-center justify-between px-2 py-1.5 bg-[var(--surface)] border-b border-[var(--border)] flex-wrap gap-1">
        <div className="flex items-center gap-0.5 flex-wrap">
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              title={action.title}
              onClick={action.run}
              className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--text-h)] hover:bg-[var(--surface)] transition-colors"
            >
              {action.icon}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setShowPreview((p) => !p)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
            showPreview
              ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
              : 'text-[var(--text-muted)] hover:bg-[var(--surface)]'
          }`}
        >
          {showPreview ? 'Edit' : 'Preview'}
        </button>
      </div>

      {/* Editor / Preview */}
      <div className={`relative ${showPreview ? 'flex' : ''}`}>
        {!showPreview ? (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            maxLength={maxLength}
            className="w-full px-4 py-3 text-[var(--text-h)] resize-none focus:outline-none bg-[var(--card-bg)]"
            style={{ minHeight: '180px' }}
          />
        ) : (
          <>
            {/* Side-by-side on desktop, stacked on mobile */}
            <div className="flex-1 flex flex-col sm:flex-row border-[var(--border)] overflow-auto"
              style={{ minHeight: '180px', maxHeight: '400px' }}>
              <div className="flex-1 border-r-0 sm:border-r border-b sm:border-b-0 border-[var(--border)] overflow-auto">
                <textarea
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Write in markdown..."
                  maxLength={maxLength}
                  className="w-full px-4 py-3 text-[var(--text)] resize-none focus:outline-none bg-[var(--bg)]"
                  style={{ minHeight: '180px', maxHeight: '400px' }}
                />
              </div>
              <div
                className="flex-1 overflow-auto px-4 py-3 prose prose-sm max-w-none text-[var(--text-muted)]"
                style={{ minHeight: '180px', maxHeight: '400px' }}
              >
                {value ? (
                  <ReactMarkdown>{value}</ReactMarkdown>
                ) : (
                  <p className="text-[var(--text-muted)] italic text-sm">Nothing to preview</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Char count */}
      <div className={`px-4 py-1.5 border-t border-[var(--border)] text-xs text-right ${
        nearLimit ? 'text-[var(--error)] font-semibold' : 'text-[var(--text-muted)]'
      }`}>
        {charCount.toLocaleString()} / {maxLength.toLocaleString()}
      </div>
    </div>
  );
};

export default MarkdownEditor;