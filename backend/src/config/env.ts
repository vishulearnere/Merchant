import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/payflow_db',
  jwtSecret: process.env.JWT_SECRET || 'super_secret_payflow_jwt_key_2026',
  webhookSecret: process.env.WEBHOOK_SECRET || 'payflow_secret_key_123',
  isDev: process.env.NODE_ENV !== 'production',
};
