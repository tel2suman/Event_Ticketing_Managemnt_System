const HttpStatusCode = require("../utils/httpStatusCode");

class ValidationMiddleware {
  validate(schema) {
    return async (req, res, next) => {
      try {
        const { error, value } = schema.validate(req.body, {
          abortEarly: false,
          stripUnknown: true,
        });

        if (error) {
          const validationErrors = error.details.map(
            (detail) => detail.message,
          );

          return res.status(HttpStatusCode.BAD_REQUEST).json({
            success: false,
            message: "Request validation failed.",
            errors: validationErrors,
          });
        }

        req.body = value;

        return next();
      } catch (error) {
        return res.status(HttpStatusCode.SERVER_ERROR).json({
          success: false,
          message: "Unable to validate request data.",
        });
      }
    };
  }
}

module.exports = new ValidationMiddleware();
