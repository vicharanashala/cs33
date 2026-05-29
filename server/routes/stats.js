const express = require('express');
const router = express.Router();
const FAQ = require('../models/FAQ');
const User = require('../models/User');

router.get('/', async (req, res, next) => {
  try {
    const [faqCount, userCount, answerCount] = await Promise.all([
      FAQ.countDocuments({ status: 'approved' }),
      User.countDocuments(),
      FAQ.aggregate([
        { $match: { status: 'approved' } },
        { $project: { answerCount: { $size: '$answers' } } },
        { $group: { _id: null, total: { $sum: '$answerCount' } } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        faqCount,
        userCount,
        answerCount: answerCount[0]?.total || 0,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;