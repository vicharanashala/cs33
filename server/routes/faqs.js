const express = require('express');
const router = express.Router();
const { isAuthenticated, isModerator, optionalAuth } = require('../middleware/auth');
const {
  createFAQRules,
  updateFAQRules,
  addAnswerRules,
  updateAnswerRules,
  addCommentRules,
  reportRules,
  paginationRules,
} = require('../middleware/validators');
const {
  getAll,
  search,
  getTrending,
  getMeta,
  getOne,
  create,
  update,
  remove,
  togglePin,
  toggleWiki,
  voteFAQ,
  voteAnswer,
  addAnswer,
  updateAnswer,
  deleteAnswer,
  acceptAnswer,
  addComment,
  deleteComment,
  reportContent,
  updateStatus,
} = require('../controllers/faqController');

// All public list/search endpoints — light pagination validation only
router.get('/search',  optionalAuth, paginationRules, search);
router.get('/trending', optionalAuth, getTrending);

// FAQ detail & meta (must be after /search and /trending to avoid ID collision)
router.get('/:id/meta', optionalAuth, getMeta);
router.get('/:id',      optionalAuth, getOne);

// ── Authenticated write operations — validation + rate limiting ───────────────

router.post(
  '/',
  isAuthenticated,
  require('../middleware/rateLimiters').createFAQLimiter,
  createFAQRules,
  create
);

router.put(
  '/:id',
  isAuthenticated,
  updateFAQRules,
  update
);

router.delete(
  '/:id',
  isAuthenticated,
  (req, _res, next) => {
    // Ensure the user owns the FAQ or is mod/admin
    const { isModerator } = require('../middleware/auth');
    // ownership check is in controller; middleware just enforces role for delete of others
    next();
  },
  remove
);

// ── Votes ─────────────────────────────────────────────────────────────────────
router.put('/:id/vote', isAuthenticated, voteFAQ);

// ── Moderation (mod/admin only) ───────────────────────────────────────────────
router.put('/:id/pin',   isAuthenticated, isModerator, togglePin);
router.put('/:id/wiki',  isAuthenticated, isModerator, toggleWiki);
router.put('/:id/status', isAuthenticated, isModerator, updateStatus);

// ── Answers ───────────────────────────────────────────────────────────────────
router.post(
  '/:id/answers',
  isAuthenticated,
  require('../middleware/rateLimiters').addAnswerLimiter,
  addAnswerRules,
  addAnswer
);

router.put(
  '/:id/answers/:aid',
  isAuthenticated,
  updateAnswerRules,
  updateAnswer
);

// Note: voteAnswer is a legacy endpoint — routed to voteFAQ for consistency
router.put('/:id/answers/:aid/vote', isAuthenticated, voteFAQ);
router.delete('/:id/answers/:aid',   isAuthenticated, deleteAnswer);
router.put('/:id/answers/:aid/accept', isAuthenticated, acceptAnswer);

// ── Comments ──────────────────────────────────────────────────────────────────
router.post(
  '/:id/comments',
  isAuthenticated,
  addCommentRules,
  addComment
);
router.delete('/:id/comments/:cid', isAuthenticated, deleteComment);

// ── Reports ───────────────────────────────────────────────────────────────────
router.post(
  '/:id/report',
  isAuthenticated,
  require('../middleware/rateLimiters').reportLimiter,
  reportRules,
  reportContent
);

module.exports = router;