import * as Icons from 'lucide-react';

/**
 * Centered empty-state placeholder.
 *
 * @param {object} props
 * @param {string}  props.icon        - Tabler icon name, e.g. 'Inbox' or 'Search'
 * @param {string}  props.title       - Heading text
 * @param {string}  props.message     - Supporting description
 * @param {string}  [props.actionLabel] - Optional CTA button label
 * @param {Function} [props.onAction]  - Optional callback for the CTA button
 */
const EmptyState = ({ icon = 'Inbox', title, message, actionLabel, onAction }) => {
  // Dynamic icon lookup — lucide-react exports all icons as named exports
  const Icon = Icons[icon] || Icons.Inbox;

  return (
    <div className="flex flex-col items-center justify-center text-center px-4 py-16">
      <div className="w-14 h-14 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mb-4">
        <Icon size={24} className="text-[var(--text-muted)]" />
      </div>
      <h3 className="text-base font-semibold text-[var(--text-h)] mb-1.5">{title}</h3>
      <p className="text-sm text-[var(--text-muted)] max-w-xs leading-relaxed">{message}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-5 px-5 py-2.5 bg-[var(--primary)] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;