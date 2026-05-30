const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const ReportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    targetType: {
      type: String,
      enum: ['faq', 'answer', 'comment'],
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    reason: {
      type: String,
      enum: ['spam', 'offensive', 'duplicate', 'misleading', 'other'],
      required: true,
    },
    details: {
      type: String,
      maxlength: [500, 'Details cannot exceed 500 characters'],
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'dismissed'],
      default: 'pending',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  }
);

ReportSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Report', ReportSchema);