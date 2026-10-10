import { Request, Response } from 'express';
import { WebhookEvent } from '../models/WebhookEvent.js';
import { Payment } from '../models/Payment.js';
import { PaymentLink } from '../models/PaymentLink.js';

export interface WebhookBody {
  eventId: string;
  paymentId: string;
  status: 'SUCCESS' | 'FAILED';
}

export async function handleProviderWebhook(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { eventId, paymentId, status } = req.body as WebhookBody;

    if (!eventId || !paymentId || !status) {
      res.status(400).json({
        received: false,
        message: 'Invalid payload: eventId, paymentId, and status are required',
      });
      return;
    }

    if (status !== 'SUCCESS' && status !== 'FAILED') {
      res.status(400).json({
        received: false,
        message: 'Status must be either SUCCESS or FAILED',
      });
      return;
    }

    const existingEvent = await WebhookEvent.findOne({ eventId });
    if (existingEvent) {
      res.status(200).json({
        received: true,
        message: `Event ID ${eventId} was already processed (idempotent skip).`,
        status: existingEvent.status,
        isDuplicate: true,
      });
      return;
    }

    const payment = await Payment.findOne({ paymentId });
    if (!payment) {
      res.status(404).json({
        received: false,
        message: `Payment with ID '${paymentId}' not found`,
      });
      return;
    }

    if (payment.status === 'SUCCESS') {
      await WebhookEvent.create({
        eventId,
        paymentId,
        status,
      }).catch(() => {});

      res.status(200).json({
        received: true,
        message: `Ignored: Payment ${paymentId} already in final status '${payment.status}'. Final status never changes back.`,
        status: payment.status,
      });
      return;
    }

    payment.status = status;
    await payment.save();

    const updateFields: any = {
      latestPayment: payment._id,
    };
    if (status === 'SUCCESS') {
      updateFields.status = 'PAID';
    }

    await PaymentLink.findOneAndUpdate(
      { linkId: payment.linkId },
      updateFields
    );

    await WebhookEvent.create({
      eventId,
      paymentId,
      status,
    });

    res.status(200).json({
      received: true,
      message: `Payment ${paymentId} transitioned to ${status}. Link updated.`,
      status,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(200).json({
        received: true,
        message: 'Duplicate event received concurrently; processed idempotently.',
        isDuplicate: true,
      });
      return;
    }

    console.error('Webhook processing error:', error);
    res.status(500).json({ received: false, message: error.message || 'Internal server error' });
  }
}
