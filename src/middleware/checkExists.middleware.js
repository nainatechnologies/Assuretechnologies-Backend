const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Reusable middleware to check if a record exists in the database.
 * @param {Object} Model - The Sequelize model to query (e.g., Category, Partner)
 * @param {String} fieldPath - The path in req object where the ID is stored (e.g., 'body.category_id', 'params.id')
 * @param {String} modelName - The human-readable name of the model for error messages
 */
const checkExists = (Model, fieldPath, modelName = 'Record') => {
  return asyncHandler(async (req, res, next) => {
    // Dynamically extract the value from req based on the fieldPath (e.g., 'body.category_id')
    const parts = fieldPath.split('.');
    let value = req;
    for (const part of parts) {
      if (value) value = value[part];
    }

    // If the value is completely missing, we let Zod handle the "required field" validation error
    if (!value) {
      return next(); 
    }

    // Check database
    const record = await Model.findByPk(value);
    
    if (!record) {
      return next(new AppError(`The selected ${modelName} is invalid or no longer exists.`, 404));
    }

    // If it exists, proceed to the next middleware/controller
    next();
  });
};

module.exports = checkExists;
