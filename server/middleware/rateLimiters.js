const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

// ── Per-route rate limiters ───────────────────────────────────────────────────
// These are defined here rather than in server.js so that routes can import
// them without creating a circular require of the main server entry point.

// Key generator: per-user (by id) for authenticated requests, per-IP fallback
const userOrIpKey = (req) => {
  if (req.user?._id) return String(req.user._id);
  return ipKeyGenerator(req.ip);
};

// POST /api/faqs — 5 per hour per user
const createFAQLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyGenerator: userOrIpKey,
  message: { success: false, error: 'FAQ creation limit reached (5/hour). Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.user?.role === 'admin',
});

// POST /api/faqs/:id/answers — 10 per hour per user
const addAnswerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  keyGenerator: userOrIpKey,
  message: { success: false, error: 'Answer limit reached (10/hour). Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/faqs/:id/report — 3 per hour per user
const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  keyGenerator: userOrIpKey,
  message: { success: false, error: 'Report limit reached (3/hour). Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { createFAQLimiter, addAnswerLimiter, reportLimiter };