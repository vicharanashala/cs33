const { body, param, query, validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

// ── Validation result handler ─────────────────────────────────────────────────
const validate = (req, _res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  const formatted = errors.array().map((e) => ({
    field: e.path,
    message: e.msg,
  }));

  const fs = require('fs');
  fs.appendFileSync('C:/Users/cheru/validate-trace.log',
    new Date().toISOString() + ' ' + req.path + ' body=' + JSON.stringify(req.body) +
    ' errors=' + JSON.stringify(formatted) + '\n');

  return next(new AppError('Validation failed', 422, formatted));
};

// ── Reusable chains ───────────────────────────────────────────────────────────
const ObjectIdParam = (field = 'id') =>
  param(field)
    .isMongoId()
    .withMessage(`Invalid ${field}`);

const Str255 = (field, min, max) =>
  body(field)
    .optional()
    .isString()
    .isLength({ min: min ?? 1, max: max ?? 255 })
    .withMessage(`${field} must be a string ${min ?? 1}–${max ?? 255} chars`);

const isBoolean = (field) =>
  body(field)
    .optional()
    .isBoolean()
    .withMessage(`${field} must be true or false`);

// ── Auth validators ───────────────────────────────────────────────────────────
const registerRules = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage('Name must be 2–80 characters'),
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  // FIX: notEmpty() + trim() prevents whitespace-only passwords from passing
  body('password')
    .notEmpty()
    .trim()
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be 8–128 characters'),
  validate,
];

const loginRules = [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  validate,
];

const forgotPasswordRules = [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  validate,
];

const resetPasswordRules = [
  param('token')
    .isString()
    .isLength({ min: 32, max: 64 })
    .withMessage('Invalid reset token'),
  body('password')
    .notEmpty()
    .trim()
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be 8–128 characters'),
  validate,
];

// ── FAQ validators ─────────────────────────────────────────────────────────────
const FAQ_CATEGORIES = ['general', 'technical', 'billing', 'policy', 'other'];

const createFAQRules = [
  body('question')
    .trim()
    .isLength({ min: 15, max: 300 })
    .withMessage('Question must be 15–300 characters'),
  body('category')
    .trim()
    .toLowerCase()
    .isIn(FAQ_CATEGORIES)
    .withMessage(`Category must be one of: ${FAQ_CATEGORIES.join(', ')}`),
  body('body')
    .optional()
    .isString()
    .isLength({ max: 50000 })
    .withMessage('Body must be under 50000 characters'),
  body('tags')
    .optional()
    .isArray({ max: 5 })
    .withMessage('Maximum 5 tags allowed'),
  body('tags.*')
    .optional()
    .isString()
    .isLength({ min: 1, max: 30 })
    .withMessage('Each tag must be 1–30 characters')
    .matches(/^[a-zA-Z0-9-_]+$/)
    .withMessage('Tags may only contain letters, numbers, hyphens and underscores'),
  validate,
];

const updateFAQRules = [
  ObjectIdParam('id'),
  body('question')
    .optional()
    .trim()
    .isLength({ min: 15, max: 300 })
    .withMessage('Question must be 15–300 characters'),
  body('category')
    .optional()
    .trim()
    .toLowerCase()
    .isIn(FAQ_CATEGORIES)
    .withMessage(`Category must be one of: ${FAQ_CATEGORIES.join(', ')}`),
  body('body')
    .optional()
    .isString()
    .isLength({ max: 50000 })
    .withMessage('Body must be under 50000 characters'),
  body('tags')
    .optional()
    .isArray({ max: 5 })
    .withMessage('Maximum 5 tags allowed'),
  body('tags.*')
    .optional()
    .isString()
    .isLength({ min: 1, max: 30 })
    .withMessage('Each tag must be 1–30 characters'),
  validate,
];

// ── Answer validators ─────────────────────────────────────────────────────────
const addAnswerRules = [
  ObjectIdParam('id'),
  body('body')
    .trim()
    .isLength({ min: 30, max: 5000 })
    .withMessage('Answer must be 30–5000 characters'),
  validate,
];

const updateAnswerRules = [
  ObjectIdParam('id'),
  ObjectIdParam('aid'),
  body('body')
    .trim()
    .isLength({ min: 30, max: 5000 })
    .withMessage('Answer must be 30–5000 characters'),
  validate,
];

// ── Comment validators ─────────────────────────────────────────────────────────
const addCommentRules = [
  ObjectIdParam('id'),
  body('body')
    .trim()
    .isLength({ min: 2, max: 2000 })
    .withMessage('Comment must be 2–2000 characters'),
  validate,
];

// ── Report validators ─────────────────────────────────────────────────────────
const reportRules = [
  ObjectIdParam('id'),
  body('reason')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Reason must be 10–1000 characters'),
  validate,
];

// ── User validators ────────────────────────────────────────────────────────────
const updateProfileRules = [
  ObjectIdParam('id'),
  Str255('name', 2, 80),
  Str255('bio', 0, 500),
  body('avatar')
    .optional()
    .isURL()
    .withMessage('Avatar must be a valid URL'),
  isBoolean('notifyOnAnswer'),
  isBoolean('notifyOnComment'),
  validate,
];

const changePasswordRules = [
  ObjectIdParam('id'),
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .notEmpty()
    .trim()
    .isLength({ min: 8, max: 128 })
    .withMessage('New password must be 8–128 characters'),
  validate,
];

// ── Pagination query validator (reused across list endpoints) ──────────────────
const paginationRules = [
  query('page')
    .optional()
    .toInt()
    .custom((v) => v >= 1)
    .withMessage('page must be a positive integer'),
  query('limit')
    .optional()
    .toInt()
    .custom((v) => v >= 1 && v <= 100)
    .withMessage('limit must be 1–100'),
  validate,
];

module.exports = {
  validate,
  registerRules,
  loginRules,
  forgotPasswordRules,
  resetPasswordRules,
  createFAQRules,
  updateFAQRules,
  addAnswerRules,
  updateAnswerRules,
  addCommentRules,
  reportRules,
  updateProfileRules,
  changePasswordRules,
  paginationRules,
  FAQ_CATEGORIES,
  ObjectIdParam,
};