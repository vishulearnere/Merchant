import { Request, Response } from 'express';
import { PaymentLink } from '../models/PaymentLink.js';
import { Payment } from '../models/Payment.js';
import crypto from 'crypto';

export async function getPayPageDetails(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { linkId } = req.params;

    const link = await PaymentLink.findOne({ linkId })
      .populate('merchant')
      .populate('latestPayment');

    if (!link) {
      res.status(404).json({ message: `Payment link '${linkId}' not found` });
      return;
    }

    if (link.expiresAt && link.expiresAt.getTime() < Date.now() && link.status === 'ACTIVE') {
      link.status = 'EXPIRED';
      await link.save();
    }

    let latestPayment = link.latestPayment as any;
    if (!latestPayment) {
      latestPayment = await Payment.findOne({ linkId }).sort({ createdAt: -1 });
    }

    res.json({
      link,
      latestPayment: latestPayment || null,
    });
  } catch (error: any) {
    console.error('Error fetching pay page details:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
}

export async function startPayment(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { linkId } = req.params;

    const link = await PaymentLink.findOne({ linkId });
    if (!link) {
      res.status(404).json({ message: 'Payment link not found' });
      return;
    }

    if (link.status === 'PAID') {
      res.status(400).json({
        message: 'This payment link has already been PAID and cannot be paid again.',
      });
      return;
    }

    if (link.status === 'EXPIRED' || (link.expiresAt && link.expiresAt.getTime() < Date.now())) {
      if (link.status !== 'EXPIRED') {
        link.status = 'EXPIRED';
        await link.save();
      }
      res.status(400).json({ message: 'This payment link has expired.' });
      return;
    }

    const latestPayment = await Payment.findOne({ linkId }).sort({ createdAt: -1 });

    if (latestPayment && latestPayment.status === 'PENDING') {
      res.status(200).json({latestPayment});
      return;
    }

    const paymentId = 'pay_' + crypto.randomBytes(5).toString('hex');

    const newPayment = await Payment.create({
      paymentId,
      linkId,
      link: link._id,
      amount: link.amount,
      status: 'PENDING',
    });

    link.latestPayment = newPayment._id;
    await link.save();

    res.status(201).json(newPayment);
  } catch (error: any) {
    console.error('Error initiating payment:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
}
