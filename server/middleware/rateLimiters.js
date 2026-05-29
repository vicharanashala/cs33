const rateLimit = require('express-rate-limit');

// ── Per-route rate limiters ───────────────────────────────────────────────────
// These are defined here rather than in server.js so that routes can import
// them without creating a circular require of the main server entry point.

// POST /api/faqs — 5 per hour per IP
const createFAQLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => req.ip,
  message: { success: false, error: 'FAQ creation limit reached (5/hour). Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.user?.role === 'admin', // admins bypass
});

// POST /api/faqs/:id/answers — 10 per hour per IP
const addAnswerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => req.ip,
  message: { success: false, error: 'Answer limit reached (10/hour). Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/faqs/:id/report — 3 per hour per IP
const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  keyGenerator: (req) => req.ip,
  message: { success: false, error: 'Report limit reached (3/hour). Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { createFAQLimiter, addAnswerLimiter, reportLimiter };