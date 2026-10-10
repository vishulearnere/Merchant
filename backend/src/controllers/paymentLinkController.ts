import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.js';
import { PaymentLink } from '../models/PaymentLink.js';
import { Payment } from '../models/Payment.js';
import { Merchant, HARDCODED_MERCHANT } from '../models/Merchant.js';
import crypto from 'crypto';

export async function createPaymentLink(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { amount, description, expiresInMinutes } = req.body;

    if (!Number.isInteger(amount) || amount <= 0) {
      res.status(400).json({
        message: 'Invalid amount: must be a positive integer in paise (e.g. 50000 for ₹500)',
      });
      return;
    }

    if (!description || typeof description !== 'string' || !description.trim()) {
      res.status(400).json({ message: 'Description is required' });
      return;
    }

    const merchantId = req.merchantId 
    const merchantEmail = req.merchantEmail 

    const linkId = 'lnk_' + crypto.randomBytes(4).toString('hex');
    const frontendBaseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const linkUrl = `${frontendBaseUrl}/pay/${linkId}`;

    let expiresAt: Date | null = null;
    if (expiresInMinutes && Number(expiresInMinutes) > 0) {
      expiresAt = new Date(Date.now() + Number(expiresInMinutes) * 60000);
    }
    else {
      expiresAt = new Date(Date.now() + (2 *24 * 60 * 60 * 1000)); // Default to 2 days if not provided or invalid
    }

    const newLink = await PaymentLink.create({
      linkId,
      link: linkUrl,
      amount,
      description: description.trim(),
      status: 'ACTIVE',
      merchant: merchantId,
      latestPayment: null,
      expiresAt,
    });

    const populated = await PaymentLink.findById(newLink._id).populate('merchant');
    res.status(201).json(populated || newLink);
  } catch (error: any) {
    console.error('Error creating payment link:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
}

export async function getPaymentLinks(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const merchantId= req.merchantId 
    const merchantEmail = req.merchantEmail 
    console.log(req.merchantId, req.merchantEmail);

    const links = await PaymentLink.find({ merchant: merchantId})
      .populate('merchant')
      .populate('latestPayment')
      .sort({ createdAt: -1 });

    res.json(links);
  } catch (error: any) {
    console.error('Error fetching payment links:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
}
