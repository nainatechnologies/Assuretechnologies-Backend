const { ZodError } = require("zod");

const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      console.log('--- validateRequest ---');
      console.log('req exists?', !!req);
      console.log('req type?', typeof req);
      const parsedData = schema.parse(req.body);
      req.body = parsedData;
      next();
    } catch (error) {
      if (error instanceof ZodError || (error && error.issues)) {
        const issues = error.issues || error.errors || [];
        const errorMessages = issues.map(err => err.message).join(', ');
        const structuredErrors = issues.map(err => ({
          field: err.path ? err.path.join('.') : 'unknown',
          message: err.message
        }));
        return res.status(400).json({ 
          success: false, 
          message: errorMessages || "Validation failed", 
          errors: structuredErrors 
        });
      }
      
      console.error("Validation Middleware Error:", error);
      return res.status(500).json({ 
        success: false, 
        message: 'Internal validation error: ' + (error.message || 'Unknown error'),
        stack: error.stack
      });
    }
  };
};

module.exports = {
  validateRequest
};
