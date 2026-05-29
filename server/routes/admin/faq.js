const express = require('express');
const router = express.Router();
const { isAdmin } = require('../../middleware/auth');
const FAQ = require('../../models/FAQ');

const getAll = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = status ? { status } : {};
    const result = await FAQ.paginate(query, {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: 'author',
    });
    res.json({ success: true, data: result.docs, pagination: {
      currentPage: result.page,
      totalPages: result.totalPages,
      totalItems: result.totalDocs,
    }});
  } catch (err) {
    next(err);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const faq = await FAQ.findByIdAndUpdate(id, { status }, { new: true });
    if (!faq) return next(new AppError('FAQ not found', 404));
    res.json({ success: true, data: faq });
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    const faq = await FAQ.findByIdAndDelete(id);
    if (!faq) return next(new AppError('FAQ not found', 404));
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

router.get('/',     isAdmin, getAll);
router.put('/:id',  isAdmin, updateStatus);
router.delete('/:id', isAdmin, remove);

module.exports = router;