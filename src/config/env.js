import dotenv from 'dotenv';

const mode = process.env.NODE_ENV || 'development';
dotenv.config({ path: `.env.${mode}` });

export const env = {
  port: process.env.PORT || 3000,
  databaseUrl: process.env.DATABASE_URL,
  logLevel: process.env.LOG_LEVEL || 'info',
};