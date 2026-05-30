const mongoose = require('mongoose');
const Report = require('../models/Report');
const AppError = require('../utils/AppError');

const getReports = async (req, res, next) => {
  try {
    const { status = 'pending', page = 1, limit = 20 } = req.query;

    const query = status ? { status } : {};

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: [
        { path: 'reporter', select: 'name email avatar' },
        { path: 'reviewedBy', select: 'name' },
      ],
    };

    const result = await Report.paginate(query, options);

    const reports = await Promise.all(
      result.docs.map(async (report) => {
        const obj = report.toObject();
        try {
          let targetModel;
          if (report.targetType === 'faq') targetModel = 'FAQ';
          else if (report.targetType === 'answer') targetModel = 'FAQ';
          else if (report.targetType === 'comment') targetModel = 'FAQ';

          if (targetModel && mongoose.Types.ObjectId.isValid(report.targetId)) {
            const target = await mongoose.model(targetModel).findById(report.targetId).select('question');
            obj.target = target;
          }
        } catch {
          obj.target = null;
        }
        return obj;
      })
    );

    return res.json({
      success: true,
      data: reports,
      pagination: {
        currentPage: result.page,
        totalPages: result.totalPages,
        totalItems: result.totalDocs,
        hasNextPage: result.hasNextPage,
        hasPrevPage: result.hasPrevPage,
      },
    });
  } catch (err) {
    return next(err);
  }
};

const reviewReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['reviewed', 'dismissed'].includes(status)) {
      return next(new AppError('Status must be "reviewed" or "dismissed"', 400));
    }

    const report = await Report.findById(id);
    if (!report) return next(new AppError('Report not found', 404));

    report.status = status;
    report.reviewedBy = req.user._id;
    await report.save();

    return res.json({ success: true, data: report });
  } catch (err) {
    return next(err);
  }
};

module.exports = { getReports, reviewReport };