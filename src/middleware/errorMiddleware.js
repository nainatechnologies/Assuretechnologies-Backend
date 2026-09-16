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
      ? formattedErrors.map(e => e.message).join(', ')
      : "Validation Error";

    return res.status(400).json({
      success: false,
      message: specificMessage,
      errors: formattedErrors
    });
  }

  // Handle Database Unique Constraint Errors (e.g. duplicate mobile number, name, email)
  if (err.name === 'SequelizeUniqueConstraintError') {
    const fields = (err.errors || []).map(e => e.path).filter(Boolean);
    let message = 'This record already exists.';

    if (fields.length > 0) {
      if (fields.includes('email')) {
        message = 'This email is already registered. Please use another email.';
      } else if (fields.includes('mobile') || fields.includes('phone') || fields.includes('contact')) {
        message = 'This mobile number is already registered.';
      } else {
        const cleanField = fields[0].replace(/_id$/i, '').replace(/_/g, ' ');
        const formatted = cleanField.charAt(0).toUpperCase() + cleanField.slice(1);
        message = `${formatted} already exists. Please choose a different one.`;
      }
    }

    return res.status(409).json({
      success: false,
      message,
      fields
    });
  }

  // Handle generic Sequelize Validation Errors
  if (err.name === 'SequelizeValidationError') {
    const formattedErrors = err.errors?.map(e => ({ field: e.path, message: e.message })) || [];
    const specificMessage = formattedErrors.length > 0
      ? formattedErrors.map(e => e.message).join(', ')
      : "Database Validation Error";

    return res.status(400).json({
      success: false,
      message: specificMessage,
      errors: formattedErrors
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