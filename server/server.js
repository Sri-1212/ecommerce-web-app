import dotenv from 'dotenv';
import app from './src/app.js';
import { testDbConnection } from './src/config/db.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  console.log('🚀 Starting server...');
  
  // Test PostgreSQL database connection
  await testDbConnection();

  // Start Express HTTP Server
  app.listen(PORT, () => {
    console.log(`🌐 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    console.log(`📍 Health Check API available at: http://localhost:${PORT}/api/health`);
  });
};

startServer();
