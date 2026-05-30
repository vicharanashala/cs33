const express = require('express');
const router = express.Router();
const { isAuthenticated, isModerator } = require('../middleware/auth');
const { getReports, reviewReport } = require('../controllers/reportController');

// GET /api/reports?status=pending
router.get('/', isAuthenticated, isModerator, getReports);

// PUT /api/reports/:id
router.put('/:id', isAuthenticated, isModerator, reviewReport);

module.exports = router;