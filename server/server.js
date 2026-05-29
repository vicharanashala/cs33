require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
const cors = require('cors');
const expressMongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const initSocket = require('./config/socket');
const { sendWeeklyDigest } = require('./utils/weeklyDigest');

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// ── Hardened Helmet ──────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'"],
      styleSrc:   ["'self'", "'unsafe-inline'"],
      imgSrc:     ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", CLIENT_URL],
      frameAncestors: ["'none'"],
      formAction: ["'self'"],
    },
  },
  // Explicitly disable iframe embedding (X-Frame-Options alternative)
  crossOriginEmbedderPolicy: false,
}));

// ── Additional security headers (Helmet doesn't set all of these by default) ──
app.use((req, res, next) => {
  // X-Content-Type-Options: prevent MIME sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // X-Frame-Options: prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  // Referrer-Policy: control referrer information
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Strict-Transport-Security (enforced over HTTPS in production)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

app.use(cors({
  origin: CLIENT_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(expressMongoSanitize({ replaceWith: '_' }));

// ── Global rate limiter (fallback — per-route ones override per-path) ─────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests. Please try again later.' },
});
app.use('/api/', globalLimiter);

// ── Auth rate limiter (stricter) ──────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { success: false, error: 'Too many attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth', authLimiter);

// ── FAQ creation rate limiter: 5 per hour per IP ──────────────────────────────
const createFAQLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  keyGenerator: (req) => req.ip,
  message: { success: false, error: 'FAQ creation limit reached (5/hour). Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Answer creation rate limiter: 10 per hour per IP ─────────────────────────
const addAnswerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => req.ip,
  message: { success: false, error: 'Answer limit reached (10/hour). Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Report rate limiter: 3 per hour per IP ───────────────────────────────────
const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  keyGenerator: (req) => req.ip,
  message: { success: false, error: 'Report limit reached (3/hour). Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Make rate limiters available to routes via req.io.to-like pattern
// Attach to app.locals so routes can reference them
app.locals.limiters = { createFAQLimiter, addAnswerLimiter, reportLimiter };

// ── Socket.io ─────────────────────────────────────────────────────────────────
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: CLIENT_URL, credentials: true },
});
initSocket(io);

app.use((req, _res, next) => {
  req.io = io;
  next();
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/faqs',          require('./routes/faqs'));
app.use('/api/users',         require('./routes/user'));
app.use('/api/categories',    require('./routes/category'));
app.use('/api/comments',      require('./routes/comment'));
app.use('/api/upload',        require('./routes/upload'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/stats',         require('./routes/stats'));
app.use('/api/admin',         require('./routes/admin'));
app.use('/api/admin/faqs',    require('./routes/admin/faq'));
app.use('/api/admin/users',   require('./routes/admin/user'));
app.use('/api/admin/dashboard', require('./routes/admin/dashboard'));

// ── 404 ────────────────────────────────────────────────────────────────────────
app.use((req, _res, next) => next(new AppError(`Route ${req.originalUrl} not found`, 404)));
app.use(require('./middleware/errorHandler'));

server.listen(PORT, async () => {
  await connectDB();
  console.log(`Server running on port ${PORT}`);

  setInterval(() => {
    sendWeeklyDigest().catch((err) =>
      console.error('Weekly digest error:', err.message)
    );
  }, 7 * 24 * 60 * 60 * 1000);
});

module.exports = { app, io, server };