const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const FAQ = require('../models/FAQ');
const AppError = require('../utils/AppError');

router.post('/:faqId', isAuthenticated, async (req, res, next) => {
  try {
    const { faqId } = req.params;
    const { body, answerId } = req.body;

    if (!body || body.trim().length < 2) {
      return next(new AppError('Comment must be at least 2 characters', 400));
    }

    const faq = await FAQ.findById(faqId);
    if (!faq) return next(new AppError('FAQ not found', 404));

    if (answerId) {
      const answer = faq.answers.id(answerId);
      if (!answer) return next(new AppError('Answer not found', 404));
      answer.comments.push({ body: body.trim(), author: req.user._id });
    } else {
      faq.comments.push({ body: body.trim(), author: req.user._id });
    }

    await faq.save();

    return res.json({ success: true, message: 'Comment added' });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;