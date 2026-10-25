require('dotenv').config();

module.exports = {
  port: process.env.Port || 3000,
  databaseUrl: process.env.DATABASE_URL,
  logLevel: process.env.LOG_LEVEl || 'info',
};
