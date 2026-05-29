const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { uploadAvatar } = require('../controllers/uploadController');

router.post('/avatar', isAuthenticated, upload.single('avatar'), uploadAvatar);

module.exports = router;