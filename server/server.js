require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
const cors = require('cors');
const { rateLimit } = require('express-rate-limit');
const connectDB = require('./config/db');
const initSocket = require('./config/socket');
const { sendWeeklyDigest } = require('./utils/weeklyDigest');
const AppError = require('./utils/AppError');

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// ── 1. Helmet (security headers) ─────────────────────────────────────────────
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
  crossOriginEmbedderPolicy: false,
}));

// ── 2. CORS ───────────────────────────────────────────────────────────────────
app.use(cors({
  origin: CLIENT_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── 3. Body parsers ───────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ── 4. Mongo query sanitisation ───────────────────────────────────────────────
function sanitizeForMongo(value) {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeForMongo(item));
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entryValue]) => [
        key.replace(/\$/g, '_').replace(/\./g, '_'),
        sanitizeForMongo(entryValue),
      ])
    );
  }
  return value;
}

app.use((req, _res, next) => {
  if (req.body)    req.body    = sanitizeForMongo(req.body);
  if (req.query)   req.query   = sanitizeForMongo(req.query);
  if (req.params)  req.params  = sanitizeForMongo(req.params);
  next();
});

// ── 5. Global rate limiter ────────────────────────────────────────────────────
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests. Please try again later.' },
}));

// ── 6. Auth rate limiter (stricter) ──────────────────────────────────────────
app.use('/api/auth', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { success: false, error: 'Too many attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
}));

// ── 7. Socket.IO — attached to http server, not express app ───────────────────
// http.createServer(app) must precede this; req.io is injected before routes
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: CLIENT_URL, credentials: true },
});
initSocket(io);

app.use((req, _res, next) => {
  req.io = io;
  next();
});

// ── 8. Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/faqs',          require('./routes/faqs'));
app.use('/api/users',         require('./routes/user'));
app.use('/api/categories',    require('./routes/category'));
app.use('/api/comments',      require('./routes/comment'));
app.use('/api/upload',        require('./routes/upload'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/stats',         require('./routes/stats'));
app.use('/api/mod',           require('./routes/mod'));
app.use('/api/reports',       require('./routes/reports'));
app.use('/api/admin',         require('./routes/admin'));
app.use('/api/admin/faqs',    require('./routes/admin/faq'));
app.use('/api/admin/users',   require('./routes/admin/user'));
app.use('/api/admin/dashboard', require('./routes/admin/dashboard'));

// ── 9. 404 + Global error handler (MUST be last) ─────────────────────────────
app.use((req, _res, next) => next(new AppError(`Route ${req.originalUrl} not found`, 404)));
app.use(require('./middleware/errorHandler'));

// ── Start: connectDB() called BEFORE server.listen() ─────────────────────────
const startServer = async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  setInterval(() => {
    sendWeeklyDigest().catch((err) =>
      console.error('Weekly digest error:', err.message)
    );
  }, 7 * 24 * 60 * 60 * 1000);
};

startServer();

module.exports = { app, io, server };