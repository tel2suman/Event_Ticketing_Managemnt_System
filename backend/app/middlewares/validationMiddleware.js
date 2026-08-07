const HttpStatusCode = require("../utils/httpStatusCode");
class ValidationMiddleware {
  validate(schema, property = "body") {

    return (req, res, next) => {

      try {
        const { error, value } = schema.validate(req[property], {
          abortEarly: false,
          stripUnknown: true,
        });

        if (error) {
          return res.status(HttpStatusCode.BAD_REQUEST).json({
            success: false,
            message: "Request validation failed.",
            errors: error.details.map((detail) => detail.message),
          });
        }

        if (property === "body") {
          req.body = value;
        } else if (property === "params") {
          req.params = value;
        } else if (property === "query") {
          // Express req.query is read-only in newer versions
          Object.assign(req.query, value);
        }

        next();
      } catch (error) {
        console.error(error);

        return res.status(HttpStatusCode.SERVER_ERROR).json({
          success: false,
          message: error.message,
        });
      }
    };
  }
}

module.exports = new ValidationMiddleware();

