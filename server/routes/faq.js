const express = require('express');
const router = express.Router();
const { optionalAuth, isAuthenticated, isModerator } = require('../middleware/auth');
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

router.get('/',                optionalAuth, getAll);
router.get('/:idOrSlug',       optionalAuth, getOne);
router.post('/',               isAuthenticated, create);
router.put('/:id',             isAuthenticated, update);
router.delete('/:id',          isAuthenticated, remove);
router.patch('/:id/pin',       isAuthenticated, isModerator, togglePin);
router.patch('/:id/wiki',      isAuthenticated, isModerator, toggleWiki);

router.post('/:id/vote',       isAuthenticated, voteFAQ);
router.post('/:id/report',     isAuthenticated, reportContent);
router.post('/:id/answers',    isAuthenticated, addAnswer);
router.put('/:id/answers/:answerId',  isAuthenticated, updateAnswer);
router.delete('/:id/answers/:answerId', isAuthenticated, deleteAnswer);
router.patch('/:id/answers/:answerId/accept', isAuthenticated, acceptAnswer);

router.post('/:id/comments',   isAuthenticated, addComment);
router.delete('/:id/comments/:commentId', isAuthenticated, deleteComment);

module.exports = router;