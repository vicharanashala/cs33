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
  ObjectIdParam,
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
router.get('/',               optionalAuth, paginationRules, getAll);
router.get('/search',         optionalAuth, paginationRules, search);
router.get('/trending',       optionalAuth, getTrending);

// FAQ detail & meta (must be after /search and /trending to avoid ID collision)
router.get('/:id/meta',       optionalAuth, getMeta);
router.get('/:id',            optionalAuth, getOne);

// ── FAQ creation with rate limit + validation ─────────────────────────────────
router.post(
  '/',
  isAuthenticated,
  require('../middleware/rateLimiters').createFAQLimiter,
  createFAQRules,
  create
);

// ── FAQ update & delete ────────────────────────────────────────────────────────
router.put('/:id',            isAuthenticated, updateFAQRules,        update);
router.delete('/:id',         isAuthenticated, ObjectIdParam('id'),   remove);

// ── Votes ─────────────────────────────────────────────────────────────────────
router.put('/:id/vote',       isAuthenticated, voteFAQ);
router.put('/:id/answers/:aid/vote', isAuthenticated, voteAnswer);

// ── Moderation (mod/admin only) ───────────────────────────────────────────────
router.put('/:id/pin',        isAuthenticated, isModerator, ObjectIdParam('id'),  togglePin);
router.put('/:id/wiki',       isAuthenticated, isModerator, ObjectIdParam('id'),  toggleWiki);
router.put('/:id/status',     isAuthenticated, isModerator, ObjectIdParam('id'),  updateStatus);

// ── Answers ────────────────────────────────────────────────────────────────────
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

router.delete(
  '/:id/answers/:aid',
  isAuthenticated,
  ObjectIdParam('id'),
  ObjectIdParam('aid'),
  deleteAnswer
);

router.put(
  '/:id/answers/:aid/accept',
  isAuthenticated,
  ObjectIdParam('id'),
  ObjectIdParam('aid'),
  acceptAnswer
);

// ── Comments ───────────────────────────────────────────────────────────────────
router.post(
  '/:id/comments',
  isAuthenticated,
  addCommentRules,
  addComment
);
router.delete(
  '/:id/comments/:cid',
  isAuthenticated,
  ObjectIdParam('id'),
  deleteComment
);

// ── Reports ────────────────────────────────────────────────────────────────────
router.post(
  '/:id/report',
  isAuthenticated,
  require('../middleware/rateLimiters').reportLimiter,
  reportRules,
  reportContent
);

module.exports = router;