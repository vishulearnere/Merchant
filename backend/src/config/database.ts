import mongoose from 'mongoose';
import { config } from './env.js';
import { Merchant, HARDCODED_MERCHANT } from '../models/Merchant.js';

let isConnected = false;

export async function connectDB(): Promise<void> {
  if (isConnected) return;

  try {
    const conn = await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log(`✅ MongoDB connected successfully: ${conn.connection.host}`);

    // Ensure hardcoded merchant exists with hashed password
    await seedDefaultMerchant();
  } catch (error) {
    console.warn(`⚠️ MongoDB connection warning: Unable to connect to ${config.mongoUri}`);
    console.warn('👉 Please update MONGODB_URI in backend/.env with your valid connection string.');
  }
}

async function seedDefaultMerchant(): Promise<void> {
  try {
    const defaultEmail = HARDCODED_MERCHANT.email.toLowerCase();
    const existing = await Merchant.findOne({ email: defaultEmail });
    if (!existing) {
      await Merchant.create({
        uuid: HARDCODED_MERCHANT.uuid,
        email: defaultEmail,
        password: HARDCODED_MERCHANT.password, // Automatically hashed by pre('save')
      });
      console.log('🌱 Default hardcoded merchant seeded with bcrypt hashed password.');
    } else {
      const isMatch = await existing.comparePassword(HARDCODED_MERCHANT.password);
      if (!isMatch) {
        existing.password = HARDCODED_MERCHANT.password;
        await existing.save();
        console.log('🔄 Hardcoded merchant password re-synced to hashed merchant123.');
      }
    }
  } catch (err) {
    console.warn('Could not seed default merchant:', err);
  }
}

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  console.log('MongoDB connection lost. Attempting reconnect...');
});
