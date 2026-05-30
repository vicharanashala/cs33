// Dead code — routes/faq.js is NOT mounted in server.js.
// Server.js mounts routes/faqs.js at /api/faqs instead.
// This file is kept for reference but must remain consistent if ever used.

// FIX: Vote changed from POST → PUT to match client-side api.js
// FIX: All write routes now have validator chains applied

const express = require('express');
const router = express.Router();
const { optionalAuth, isAuthenticated, isModerator } = require('../middleware/auth');
const {
  createFAQRules,
  updateFAQRules,
  addAnswerRules,
  updateAnswerRules,
  addCommentRules,
  reportRules,
  ObjectIdParam,
} = require('../middleware/validators');
const {
  getAll,
  getOne,
  create,
  update,
  remove,
  togglePin,
  toggleWiki,
  voteFAQ,
  addAnswer,
  updateAnswer,
  deleteAnswer,
  acceptAnswer,
  addComment,
  deleteComment,
  reportContent,
} = require('../controllers/faqController');

router.get('/',                            optionalAuth, getAll);
router.get('/:idOrSlug',                   optionalAuth, getOne);
router.post('/',                           isAuthenticated, createFAQRules, create);
router.put('/:id',                         isAuthenticated, updateFAQRules, update);
router.delete('/:id',                      isAuthenticated, ObjectIdParam('id'), remove);

// FIX: HTTP verb for vote changed POST → PUT
router.put('/:id/vote',                    isAuthenticated, voteFAQ);

// Toggle Pin / Wiki — moderator+ only
router.patch('/:id/pin',                   isAuthenticated, isModerator, ObjectIdParam('id'), togglePin);
router.patch('/:id/wiki',                  isAuthenticated, isModerator, ObjectIdParam('id'), toggleWiki);

// Answers
router.post('/:id/answers',                isAuthenticated, addAnswerRules, addAnswer);
router.put('/:id/answers/:answerId',       isAuthenticated, updateAnswerRules, updateAnswer);
router.delete('/:id/answers/:answerId',    isAuthenticated, ObjectIdParam('id'), ObjectIdParam('answerId'), deleteAnswer);
router.patch('/:id/answers/:answerId/accept', isAuthenticated, ObjectIdParam('id'), ObjectIdParam('answerId'), acceptAnswer);

// Comments
router.post('/:id/comments',               isAuthenticated, addCommentRules, addComment);
router.delete('/:id/comments/:commentId',  isAuthenticated, ObjectIdParam('id'), deleteComment);

// Reports
router.post('/:id/report',                 isAuthenticated, reportRules, reportContent);

module.exports = router;