import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { Merchant, HARDCODED_MERCHANT } from '../models/Merchant.js';

export async function merchantLogin(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const candidatePassword = String(password);

    let merchant = await Merchant.findOne({ email: normalizedEmail });


    // 1. If user is not found in MongoDB -> 404 Error
    if (!merchant) {
      res.status(404).json({ message: 'User is not registered. Please check your email.' });
      return;
    }

    // 2. If user exists -> verify candidate password against stored bcrypt hash in DB
    const isMatch = await merchant.comparePassword(candidatePassword);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid password for this merchant account' });
      return;
    }

    // 3. Credentials are fully verified -> generate JWT token
    const token = jwt.sign(
      {
        merchantId: merchant._id,
        email: merchant.email,
      },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: merchant.uuid,
        email: merchant.email,
        name: merchant.email.split('@')[0].toUpperCase() + ' Merchant',
      },
      message: 'Authenticated successfully',
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
}

export async function merchantRegister(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    if (!normalizedEmail.includes('@')) {
      res.status(400).json({ message: 'Please provide a valid email address' });
      return;
    }

    if (String(password).length < 4) {
      res.status(400).json({ message: 'Password must be at least 4 characters long' });
      return;
    }

    const existing = await Merchant.findOne({ email: normalizedEmail });
    if (existing) {
      res.status(409).json({ message: 'A merchant with this email already exists' });
      return;
    }

    const newMerchant = await Merchant.create({
      email: normalizedEmail,
      password: String(password),
    });

    const token = jwt.sign(
      {
        merchantId: newMerchant.uuid,
        email: newMerchant.email,
        id: newMerchant.uuid,
      },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: newMerchant.uuid,
        email: newMerchant.email,
        name: newMerchant.email.split('@')[0].toUpperCase() + ' Merchant',
      },
      message: 'Merchant registered successfully',
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
}
