/**
 * Role-Based Access Control (RBAC) Middleware
 * Restricts endpoint access to users possessing specific allowed roles.
 * Must be executed AFTER authenticateToken middleware.
 * 
 * @param  {...string} allowedRoles - List of authorized roles (e.g. 'admin', 'user')
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        statusCode: 401,
        message: 'Authentication required before role verification.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        statusCode: 403,
        message: `Access forbidden. Required role: [${allowedRoles.join(', ')}], your role: "${req.user.role}".`
      });
    }

    next();
  };
};
