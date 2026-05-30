const crypto = require('crypto');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { sendEmail } = require('../utils/sendEmail');

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return next(new AppError('Email already registered', 400));

    const emailVerifyToken = crypto.randomBytes(32).toString('hex');

    // Use `password` field (not passwordHash) so the pre-save hook hashes it
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      emailVerifyToken,
    });

    const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${emailVerifyToken}`;
    await sendEmail({
      to: user.email,
      subject: 'Verify your FAQ Portal account',
      text: `Click to verify: ${verifyUrl}`,
      html: `<a href="${verifyUrl}">Click to verify your email</a>`,
    });

    const token = user.generateJWT();

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        reputation: user.reputation,
      },
    });
  } catch (err) {
    if (err.code === 11000) return next(new AppError('Email already registered', 400));
    return next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    if (!user) return next(new AppError('Invalid email or password', 401));

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return next(new AppError('Invalid email or password', 401));

    // Reject suspended users — they must not get a JWT
    if (user.isSuspended) {
      return next(new AppError('Your account has been suspended.', 403));
    }

    user.lastActive = new Date();
    await user.save({ validateBeforeSave: false });

    const token = user.generateJWT();

    return res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        reputation: user.reputation,
      },
    });
  } catch (err) {
    return next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = req.user;
    return res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
        reputation: user.reputation,
        badges: user.badges,
        emailVerified: user.emailVerified,
        following: user.following,
        savedFAQs: user.savedFAQs,
        notifyOnAnswer: user.notifyOnAnswer,
        notifyOnComment: user.notifyOnComment,
        createdAt: user.createdAt,
        lastActive: user.lastActive,
      },
    });
  } catch (err) {
    return next(err);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    await sendEmail({
      to: user.email,
      subject: 'Reset your FAQ Portal password',
      text: `Click to reset: ${resetUrl}`,
      html: `<a href="${resetUrl}">Click to reset your password</a>`,
    });

    return res.json({ success: true, message: 'Password reset email sent' });
  } catch (err) {
    return next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) return next(new AppError('Invalid or expired reset token', 400));

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    const newToken = user.generateJWT();
    return res.json({ success: true, token: newToken, message: 'Password reset successful' });
  } catch (err) {
    return next(err);
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({ emailVerifyToken: token });
    if (!user) return next(new AppError('Invalid verification token', 400));

    user.emailVerified = true;
    user.emailVerifyToken = undefined;
    await user.save();

    return res.json({ success: true, message: 'Email verified successfully' });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  verifyEmail,
};