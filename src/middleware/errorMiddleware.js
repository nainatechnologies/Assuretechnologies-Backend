const { ZodError } = require("zod");

module.exports = (err, req, res, next) => {
  console.error("🔥 Global Error Handler:", err);

  // Handle Zod Validation Errors
  if (err instanceof ZodError) {
    const formattedErrors = err.issues.map(issue => ({
      field: issue.path.join('.'),
      message: issue.message
    }));

    const specificMessage = formattedErrors.length > 0
      ? `Validation Error: ${formattedErrors[0].field ? formattedErrors[0].field + ' - ' : ''}${formattedErrors[0].message}`
      : "Validation Error";

    return res.status(400).json({
      success: false,
      message: specificMessage,
      errors: formattedErrors
    });
  }

  // Handle Database Unique Constraint Errors (e.g. duplicate mobile number)
  if (err.name === 'SequelizeUniqueConstraintError') {
    const duplicateFields = err.errors.map(e => e.path).join(', ');
    return res.status(409).json({
      success: false,
      message: `Duplicate entry detected for: ${duplicateFields}`
    });
  }

  // Handle generic Sequelize Validation Errors
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      message: "Database Validation Error",
      errors: err.errors.map(e => ({ field: e.path, message: e.message }))
    });
  }

  const statusCode = err.statusCode || 500;
  const errorResponse = {
    success: false,
    message: err.message || "Internal Server Error",
  };

  if (err.errorCode) {
    errorResponse.error = err.errorCode;
  }

  if (err.data) {
    Object.assign(errorResponse, err.data);
  }

  res.status(statusCode).json(errorResponse);
};