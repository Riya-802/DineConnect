/**
 * Global Error Handler Middleware
 * Must be registered LAST in Express app (after all routes).
 */

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = undefined;

  // ── Mongoose Validation Error (e.g. required field missing) ──────────────
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // ── Mongoose CastError (invalid ObjectId) ────────────────────────────────
  else if (err.name === 'CastError') {
    statusCode = 404;
    message = `Resource not found — invalid ${err.path}: ${err.value}`;
  }

  // ── MongoDB Duplicate Key (E11000) ────────────────────────────────────────
  else if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const value = err.keyValue ? err.keyValue[field] : '';
    message = `Duplicate value for field '${field}': '${value}' already exists`;
  }

  // ── JWT Errors ────────────────────────────────────────────────────────────
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token — authentication failed';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token has expired — please login again';
  } else if (err.name === 'NotBeforeError') {
    statusCode = 401;
    message = 'Token not yet active';
  }

  // ── Log in development ────────────────────────────────────────────────────
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[ErrorHandler] ${statusCode} — ${message}`);
    if (err.stack) console.error(err.stack);
  }

  const response = { success: false, message };
  if (errors) response.errors = errors;

  return res.status(statusCode).json(response);
};

export default errorHandler;
