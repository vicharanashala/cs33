const express = require('express');
const router = express.Router();
const { isAdmin } = require('../../middleware/auth');
const User = require('../../models/User');
const AppError = require('../../utils/AppError');

const getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await User.paginate({}, {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      select: '-passwordHash',
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

const updateRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(id, { role }, { new: true }).select('-passwordHash');
    if (!user) return next(new AppError('User not found', 404));
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

router.get('/:id',  isAdmin, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash');
    if (!user) return next(new AppError('User not found', 404));
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

router.get('/',    isAdmin, getAll);
router.put('/:id', isAdmin, updateRole);

module.exports = router;