/**
 * Health check controller
 * Handles GET /api/health endpoint
 */
export const getHealthStatus = (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'API is running successfully',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
};
