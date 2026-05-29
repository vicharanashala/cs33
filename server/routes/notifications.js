const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const { getAll, markRead, deleteOne } = require('../controllers/notificationController');

router.get('/',     isAuthenticated, getAll);
router.patch('/read/all', isAuthenticated, markRead);
router.patch('/:id/read', isAuthenticated, markRead);
router.delete('/:id',     isAuthenticated, deleteOne);

module.exports = router;