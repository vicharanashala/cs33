// FIX: Removed duplicate GET /:id route — it conflicts with admin.js GET /users
//     which matches /api/admin/users/:id first due to Express route specificity.
//     admin.js already handles single-user GET via /users/:id.

const express = require('express');
const router = express.Router();
const { isAdmin } = require('../../middleware/auth');
const User = require('../../models/User');
const AppError = require('../../utils/AppError');

const getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await User.paginate({}, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { createdAt: -1 },
      select: '-passwordHash',
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

const updateRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // FIX: explicit role enum validation in controller
    const validRoles = ['user', 'moderator', 'admin'];
    if (!role || !validRoles.includes(role)) {
      return next(new AppError(`Role must be one of: ${validRoles.join(', ')}`, 400));
    }

    const user = await User.findByIdAndUpdate(id, { role }, { new: true, runValidators: true }).select('-passwordHash');
    if (!user) return next(new AppError('User not found', 404));

    return res.json({ success: true, data: user });
  } catch (err) {
    return next(err);
  }
};

router.get('/',    isAdmin, getAll);
router.put('/:id', isAdmin, updateRole);

module.exports = router;