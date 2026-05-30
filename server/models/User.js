const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoosePaginate = require('mongoose-paginate-v2');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    username: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      maxlength: [30, 'Username cannot exceed 30 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      select: false,
    },
    passwordHash: {
      type: String,
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'moderator', 'admin'],
      default: 'user',
    },
    isSuspended: {
      type: Boolean,
      default: false,
    },
    avatar: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      maxlength: [300, 'Bio cannot exceed 300 characters'],
    },
    reputation: {
      type: Number,
      default: 0,
    },
    badges: [
      {
        name: String,
        awardedAt: { type: Date, default: Date.now },
      },
    ],
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    savedFAQs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FAQ',
      },
    ],
    notifyOnAnswer: {
      type: Boolean,
      default: true,
    },
    notifyOnComment: {
      type: Boolean,
      default: true,
    },
    notifications: [
      {
        type: {
          type: String,
          enum: ['answer', 'comment', 'vote', 'accept', 'badge', 'follow'],
        },
        message: String,
        faqId: { type: mongoose.Schema.Types.ObjectId, ref: 'FAQ' },
        read: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerifyToken: {
      type: String,
      select: false,
    },
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpire: {
      type: Date,
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  }
);

// ── Plugin ─────────────────────────────────────────────────────────────────────
userSchema.plugin(mongoosePaginate);

// ── Index ──────────────────────────────────────────────────────────────────────
userSchema.index({ email: 1 });

// ── Pre-save: hash password ────────────────────────────────────────────────────
// Accepts `password` (plain) OR `passwordHash` (already hashed).
// If `password` is set directly, hash it. If `passwordHash` is modified, hash it.
userSchema.pre('save', async function () {
  if (this.isModified('password') && !this.isModified('passwordHash')) {
    // Plain-text password was set via `password` virtual or direct assignment
    this.passwordHash = await bcrypt.hash(this.password, 10);
    this.password = undefined; // don't persist plain text
  } else if (this.isModified('passwordHash')) {
    this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
  }
});

// ── Methods ────────────────────────────────────────────────────────────────────
userSchema.methods.matchPassword = async function (plain) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.methods.generateJWT = function () {
  return jwt.sign(
    { id: this._id, role: this.role, name: this.name, username: this.username },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

module.exports = mongoose.model('User', userSchema);