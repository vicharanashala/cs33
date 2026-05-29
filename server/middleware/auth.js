const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');

const isAuthenticated = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('You are not logged in', 401));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return next(new AppError('User no longer exists', 401));
    if (user.isSuspended) return next(new AppError('Your account has been suspended.', 403));

    req.user = user;
    next();
  } catch {
    return next(new AppError('Invalid or expired token', 401));
  }
};

const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return next();

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (user && !user.isSuspended) req.user = user;
  } catch {
    // Silently ignore invalid token on optional routes
  }

  next();
};

const isModerator = (req, res, next) => {
  if (!req.user || !['moderator', 'admin'].includes(req.user.role)) {
    return next(new AppError('Access denied. Moderator or admin required.', 403));
  }
  next();
};

const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return next(new AppError('Access denied. Admin required.', 403));
  }
  next();
};

module.exports = { isAuthenticated, optionalAuth, isModerator, isAdmin };