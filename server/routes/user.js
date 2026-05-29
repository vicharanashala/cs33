const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const {
  getProfile,
  updateProfile,
  changePassword,
  followUser,
  unfollowUser,
  saveFAQ,
  getSavedFAQs,
  getActivityFeed,
  getUserActivity,
  getLeaderboard,
} = require('../controllers/userController');

router.get('/:idOrUsername', getProfile);

router.put('/:id/profile',    isAuthenticated, updateProfile);
router.put('/:id/password',   isAuthenticated, changePassword);

router.post('/:id/follow',    isAuthenticated, followUser);
router.delete('/:id/follow',  isAuthenticated, unfollowUser);

router.post('/saved/:faqId',  isAuthenticated, saveFAQ);
router.get('/saved',          isAuthenticated, getSavedFAQs);

router.get('/feed/activity',  isAuthenticated, getActivityFeed);
router.get('/:idOrUsername/activity', getUserActivity);
router.get('/:idOrUsername/answers',  getUserAnswers);
router.get('/leaderboard',      getLeaderboard);

module.exports = router;