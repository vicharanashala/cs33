const express = require('express');
const router = express.Router();
const FAQ = require('../models/FAQ');

const CATEGORIES = ['general', 'technical', 'billing', 'policy', 'other'];

const getAll = async (req, res, next) => {
  try {
    const counts = await FAQ.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);
    const result = CATEGORIES.map((cat) => ({
      name: cat,
      count: counts.find((c) => c._id === cat)?.count || 0,
    }));
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

router.get('/', getAll);

module.exports = router;