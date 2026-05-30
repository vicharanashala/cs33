const errorHandler = (err, req, res, next) => {
  // AppError — use its own statusCode for operational errors
  if (err.isOperational) {
    const response = { success: false, message: err.message };
    if (err.data) response.errors = err.data;
    return res.status(err.statusCode).json(response);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  // Duplicate key (MongoDB code 11000)
  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      message: 'Email already exists',
    });
  }

  // Invalid ObjectId or other cast error
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Resource not found',
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired',
    });
  }

  // Unknown / non-operational errors — never leak details in production
  return res.status(500).json({
    success: false,
    message:
      process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;