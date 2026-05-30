const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const CommentSchema = new mongoose.Schema(
  {
    body: {
      type: String,
      required: [true, 'Comment body is required'],
      maxlength: [500, 'Comment cannot exceed 500 characters'],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const AnswerSchema = new mongoose.Schema(
  {
    body: {
      type: String,
      required: [true, 'Answer body is required'],
      maxlength: [5000, 'Answer cannot exceed 5000 characters'],
      minlength: [30, 'Answer must be at least 30 characters'],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    votes: {
      type: Number,
      default: 0,
    },
    voters: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        vote: {
          type: Number,
          min: -1,
          max: 1,
        },
      },
    ],
    isAccepted: {
      type: Boolean,
      default: false,
    },
    comments: [CommentSchema],
    editHistory: [
      {
        body: String,
        editedAt: { type: Date, default: Date.now },
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const FAQSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: [true, 'Question is required'],
      trim: true,
      minlength: [15, 'Question must be at least 15 characters'],
      maxlength: [300, 'Question cannot exceed 300 characters'],
    },
    body: {
      type: String,
      maxlength: [5000, 'FAQ body cannot exceed 5000 characters'],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
        maxlength: [20, 'Tag cannot exceed 20 characters'],
      },
    ],
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['general', 'technical', 'billing', 'policy', 'other'],
      lowercase: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'closed', 'flagged'],
      default: 'pending',
    },
    votes: {
      type: Number,
      default: 0,
    },
    voters: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        vote: {
          type: Number,
          min: -1,
          max: 1,
        },
      },
    ],
    views: {
      type: Number,
      default: 0,
    },
    answers: [AnswerSchema],
    comments: [CommentSchema],
    revisionHistory: [
      {
        body: String,
        editedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        editedAt: { type: Date, default: Date.now },
      },
    ],
    isCommunityWiki: {
      type: Boolean,
      default: false,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    relatedFAQs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FAQ',
      },
    ],
    slug: {
      type: String,
      unique: true,
    },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    toJSON:     { virtuals: true },
    toObject:   { virtuals: true },
  }
);

// ── Plugins ────────────────────────────────────────────────────────────────────
FAQSchema.plugin(mongoosePaginate);

// ── Indexes ────────────────────────────────────────────────────────────────────
FAQSchema.index({ question: 'text', body: 'text', tags: 'text' });
FAQSchema.index({ createdAt: -1 });
FAQSchema.index({ 'answers.author': 1 });

// ── Virtual: hot score for trending ───────────────────────────────────────────
FAQSchema.virtual('hotScore').get(function () {
  const hoursOld = (Date.now() - this.createdAt) / 3600000;
  const answersCount = Array.isArray(this.answers) ? this.answers.length : 0;
  return ((this.votes || 0) * 3 + answersCount * 2 + (this.views || 0) * 0.1) /
    Math.pow(hoursOld + 2, 1.5);
});

// ── Pre-save: auto-generate unique slug ───────────────────────────────────────
// FIX: async hook must NOT use `next` parameter; use `return` instead of `return next()`
FAQSchema.pre('save', async function () {
  if (this.isModified('question') || !this.slug) {
    const base = this.question
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');

    let slug = base;
    let counter = 1;

    const self = this;
    const findUniqueSlug = async () => {
      const existing = await mongoose.model('FAQ').findOne({ slug });
      if (!existing || existing._id.equals(self._id)) return;
      slug = `${base}-${counter}`;
      counter++;
      return findUniqueSlug();
    };

    await findUniqueSlug();
    this.slug = slug;
  }
});

module.exports = mongoose.model('FAQ', FAQSchema);