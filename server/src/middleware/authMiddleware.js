import jwt from 'jsonwebtoken';

/**
 * Authentication Middleware
 * Verifies JWT token passed in Authorization header (Bearer <token>)
 * Attaches decoded payload { userId, email, role } to req.user
 */
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    return res.status(401).json({
      status: 'error',
      statusCode: 401,
      message: 'Authentication token required.'
    });
  }

  // Header format should be: "Bearer <jwt_token>"
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({
      status: 'error',
      statusCode: 401,
      message: 'Malformed authorization header. Expected "Bearer <token>".'
    });
  }

  const token = parts[1];
  const secret = process.env.JWT_SECRET || 'default_jwt_secret_dev_only';

  jwt.verify(token, secret, (err, decoded) => {
    if (err) {
      return res.status(401).json({
        status: 'error',
        statusCode: 401,
        message: 'Invalid or expired authentication token.'
      });
    }

    // Attach decoded user identity to request object
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };

    next();
  });
};
