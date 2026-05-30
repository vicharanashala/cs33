const express = require('express');
const router = express.Router();
const { isModerator } = require('../middleware/auth');
const FAQ = require('../models/FAQ');
const AppError = require('../utils/AppError');

// PUT /api/mod/faqs/:id/status — moderators and admins can approve/reject
router.put('/faqs/:id/status', isModerator, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['approved', 'rejected', 'pending'].includes(status)) {
      return next(new AppError('Status must be approved, rejected, or pending', 400));
    }

    const faq = await FAQ.findByIdAndUpdate(id, { status }, { new: true });
    if (!faq) return next(new AppError('FAQ not found', 404));

    return res.json({ success: true, data: faq });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;