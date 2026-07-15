const HttpStatusCode = require("../utils/httpStatusCode");

const RoleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user || !allowedRoles.includes(req.user.role)) {
        return res.status(HttpStatusCode.FORBIDDEN).json({
          success: false,
          message: "You are not authorized to access this resource.",
        });
      }

      return next();
    } catch (error) {
      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: "Unable to authorize user role.",
      });
    }
  };
};

module.exports = RoleMiddleware;
