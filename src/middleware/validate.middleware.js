const { ZodError } = require("zod");

/**
 * Generic validation middleware using Zod.
 * @param {import("zod").ZodSchema} schema - The Zod schema to validate against.
 */
const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      // Validate the body, query, and params against the schema
      // Usually, we validate req.body, but you can extend this to req.query/params if needed in the schema object structure
      const parsedData = schema.parse(req.body);
      
      // Replace req.body with the sanitized/parsed data from Zod
      req.body = parsedData;
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // We pass the ZodError to our global error handler to format nicely
        return next(error);
      }
      next(error);
    }
  };
};

/**
 * Generic validation middleware for URL Query Parameters using Zod.
 * @param {import("zod").ZodSchema} schema - The Zod schema to validate against.
 */
const validateQuery = (schema) => {
  return (req, res, next) => {
    try {
      // Validate and coerce the query params
      const parsedData = schema.parse(req.query);
      
      // Replace req.query with the sanitized/coerced data
      req.query = parsedData;
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return next(error);
      }
      next(error);
    }
  };
};

/**
 * Generic validation middleware for URL Parameters using Zod.
 * @param {import("zod").ZodSchema} schema - The Zod schema to validate against.
 */
const validateParams = (schema) => {
  return (req, res, next) => {
    try {
      const parsedData = schema.parse(req.params);
      req.params = parsedData;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return next(error);
      }
      next(error);
    }
  };
};

module.exports = {
  validateRequest,
  validateQuery,
  validateParams
};
