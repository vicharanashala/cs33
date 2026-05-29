const express = require('express');
const router = express.Router();
const { isAdmin } = require('../../middleware/auth');
const User = require('../../models/User');
const FAQ = require('../../models/FAQ');
const Report = require('../../models/Report');

const getDashboard = async (req, res, next) => {
  try {
    const [
      faqStats,
      userStats,
      reportStats,
      recentFAQs,
      recentUsers,
    ] = await Promise.all([
      FAQ.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } },
        { $group: { _id: null, total: { $sum: '$count' }, roles: { $push: { role: '$_id', count: '$count' } } } },
      ]),
      Report.aggregate([
        { $match: { status: 'pending' } },
        { $count: 'pendingCount' },
      ]),
      FAQ.find().sort({ createdAt: -1 }).limit(5).populate('author', 'name'),
      User.find().sort({ createdAt: -1 }).limit(5).select('-passwordHash'),
    ]);

    const totalFAQs = faqStats.reduce((sum, s) => sum + s.count, 0);
    const pendingFAQs = faqStats.find((s) => s._id === 'pending')?.count || 0;
    const totalUsers = recentUsers.length; // approximate
    const pendingReports = reportStats[0]?.pendingCount || 0;

    res.json({
      success: true,
      data: {
        stats: {
          totalFAQs,
          pendingFAQs,
          totalUsers: recentUsers.length,
          pendingReports,
          faqStatusBreakdown: faqStats,
          userRoleBreakdown: recentUsers.length,
        },
        recentFAQs,
        recentUsers,
      },
    });
  } catch (err) {
    next(err);
  }
};

router.get('/', isAdmin, getDashboard);

module.exports = router;