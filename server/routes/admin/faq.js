const express = require('express');
const router = express.Router();
const { isAdmin } = require('../../middleware/auth');
const FAQ = require('../../models/FAQ');
const AppError = require('../../utils/AppError');

const getAll = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = status ? { status } : {};
    const result = await FAQ.paginate(query, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { createdAt: -1 },
      populate: 'author',
    });
    return res.json({
      success: true,
      data: result.docs,
      pagination: {
        currentPage: result.page,
        totalPages: result.totalPages,
        totalItems: result.totalDocs,
      },
    });
  } catch (err) {
    return next(err);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['approved', 'rejected', 'closed'].includes(status)) {
      return next(new AppError('Status must be approved, rejected, or closed', 400));
    }

    const faq = await FAQ.findByIdAndUpdate(id, { status }, { new: true });
    if (!faq) return next(new AppError('FAQ not found', 404));

    return res.json({ success: true, data: faq });
  } catch (err) {
    return next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    const faq = await FAQ.findByIdAndDelete(id);
    if (!faq) return next(new AppError('FAQ not found', 404));

    return res.json({ success: true });
  } catch (err) {
    return next(err);
  }
};

router.get('/',      isAdmin, getAll);
router.put('/:id',   isAdmin, updateStatus);
router.delete('/:id', isAdmin, remove);

module.exports = router;