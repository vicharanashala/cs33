import { useState, useRef, useEffect } from 'react';
import { Share2, Check, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { FaTwitter, FaWhatsapp } from 'react-icons/fa';



const BASE_URL = import.meta.env.VITE_CLIENT_URL || window.location.origin;

const ShareButton = ({ question, faqId }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const pageUrl = `${BASE_URL}/faqs/${faqId}`;
  const encodedTitle = encodeURIComponent(question || '');
  const encodedUrl   = encodeURIComponent(pageUrl);

  const copyLink = () => {
    navigator.clipboard.writeText(pageUrl).then(() => {
      toast.success('Link copied!');
      setOpen(false);
    }).catch(() => toast.error('Failed to copy'));
  };

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`;
  const whatsappUrl = `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-muted)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface)] hover:text-[var(--text-h)] transition-colors"
        aria-label="Share"
      >
        <Share2 size={15} />
        Share
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-52 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl shadow-lg z-50 py-1 overflow-hidden">
          <button
            onClick={copyLink}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-[var(--text)] hover:bg-[var(--surface)] transition-colors"
          >
            <Check size={15} className="text-[var(--success)] flex-shrink-0" />
            Copy link
          </button>

          <hr className="my-1 border-[var(--border)]" />

          <a
            href={twitterUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-[var(--text)] hover:bg-[var(--surface)] transition-colors"
            onClick={() => setOpen(false)}
          >
            <FaTwitter size={15} className="text-sky-500" />

            {/* <Twitter size={15} className="text-sky-500 flex-shrink-0" /> */}
            Share on X (Twitter)
          </a>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-[var(--text)] hover:bg-[var(--surface)] transition-colors"
            onClick={() => setOpen(false)}
          >
            <MessageCircle size={15} className="text-[var(--success)] flex-shrink-0" />
            Share on WhatsApp
          </a>
        </div>
      )}
    </div>
  );
};

export default ShareButton;