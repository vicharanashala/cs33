const errorHandler = (err, req, res, next) => {
  let status = err.statusCode || err.status || 500;
  let message = err.message || 'Internal Server Error';
  let errors = undefined;

  if (err.name === 'ValidationError') {
    status = 400;
    message = 'Validation failed';
    errors = Object.values(err.errors).map((e) => e.message);
  } else if (err.code === 11000) {
    status = 400;
    message = 'Email already exists';
  } else if (err.name === 'CastError') {
    status = 404;
    message = 'Resource not found';
  } else if (err.name === 'JsonWebTokenError') {
    status = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    status = 401;
    message = 'Token expired';
  }

  const response = { success: false, message };

  if (errors) response.errors = errors;

  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(status).json(response);
};

module.exports = errorHandler;