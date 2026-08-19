/**
 * Global application error class for standardizing error responses.
 * By extending the native Error class, we ensure perfect stack traces
 * and can easily identify expected operational errors vs. unexpected bugs.
 */
class AppError extends Error {
  constructor(message, statusCode, errorCode = null, data = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.data = data;

    // Flag to indicate this is a trusted, operational error we intentionally threw.
    // If an error doesn't have this, it's a programming bug or unhandled exception.
    this.isOperational = true;

    // Capture the exact line number where this error was thrown in the stack trace,
    // excluding the constructor call itself to keep the trace clean.
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
