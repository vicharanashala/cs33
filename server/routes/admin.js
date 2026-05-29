const express = require('express');
const router = express.Router();
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const User = require('../models/User');
const FAQ = require('../models/FAQ');
const Report = require('../models/Report');
const AppError = require('../utils/AppError');

// All admin routes require authentication + admin role
router.use(isAuthenticated, isAdmin);

// ── GET /api/admin/stats ───────────────────────────────────────────────────────
router.get('/stats', async (req, res, next) => {
  try {
    const now = new Date();
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const todayStart = new Date(now.setHours(0, 0, 0, 0));

    const [
      userCount,
      newUsersThisWeek,
      faqCount,
      pendingCount,
      reportsToday,
      userRoleBreakdown,
      faqStatusBreakdown,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: weekAgo } }),
      FAQ.countDocuments(),
      FAQ.countDocuments({ status: 'pending' }),
      Report.countDocuments({ createdAt: { $gte: todayStart } }),
      User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
      FAQ.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    ]);

    res.json({
      success: true,
      data: {
        totalUsers: userCount,
        newUsersThisWeek,
        totalFAQs: faqCount,
        pendingFAQs: pendingCount,
        reportsToday,
        userRoleBreakdown: userRoleBreakdown.filter((r) => r._id),
        faqStatusBreakdown: faqStatusBreakdown.filter((s) => s._id),
      },
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/admin/users ──────────────────────────────────────────────────────
router.get('/users', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const query = search
      ? {
          $or: [
            { name:  { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
          ],
        }
      : {};

    const result = await User.paginate(query, {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      select: '-passwordHash',
    });

    res.json({
      success: true,
      data: result.docs,
      pagination: {
        currentPage: result.page,
        totalPages: result.totalPages,
        totalItems: result.totalDocs,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ── PUT /api/admin/users/:id/role ────────────────────────────────────────────
router.put('/users/:id/role', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'moderator', 'admin'].includes(role)) {
      return next(new AppError('Invalid role', 400));
    }

    // Prevent self-demotion
    if (id === req.user._id.toString() && role !== 'admin') {
      return next(new AppError('Cannot demote yourself', 400));
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true, runValidators: true }
    ).select('-passwordHash');

    if (!updatedUser) return next(new AppError('User not found', 404));

    res.json({ success: true, data: updatedUser });
  } catch (err) {
    next(err);
  }
});

// ── PUT /api/admin/users/:id/suspend ─────────────────────────────────────────
router.put('/users/:id/suspend', async (req, res, next) => {
  try {
    const { id } = req.params;

    if (id === req.user._id.toString()) {
      return next(new AppError('Cannot suspend yourself', 400));
    }

    const user = await User.findById(id);
    if (!user) return next(new AppError('User not found', 404));

    user.isSuspended = !user.isSuspended;
    await user.save();

    res.json({
      success: true,
      data: { _id: user._id, isSuspended: user.isSuspended },
      message: user.isSuspended ? 'User suspended' : 'User unsuspended',
    });
  } catch (err) {
    next(err);
  }
});

// ── DELETE /api/admin/users/:id ──────────────────────────────────────────────
router.delete('/users/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    if (id === req.user._id.toString()) {
      return next(new AppError('Cannot delete yourself', 400));
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) return next(new AppError('User not found', 404));

    // Clean up: remove this user from saved lists and following
    await Promise.all([
      User.updateMany({ savedFAQs: id }, { $pull: { savedFAQs: id } }),
      User.updateMany({ following: id }, { $pull: { following: id } }),
      FAQ.deleteMany({ author: id }),
      Report.deleteMany({ reporter: id }),
    ]);

    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;