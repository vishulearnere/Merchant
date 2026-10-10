import { Request, Response, NextFunction } from 'express'
import { config } from '../config/env.js'

export function verifyWebhookSecret(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const secretHeader = req.headers['x-webhook-secret']
  console.log('Received X-Webhook-Secret header:', secretHeader, config) // Log the received header for debugging

  // 1. Check if the header is missing OR if it doesn't match your config secret
  if (!secretHeader || secretHeader !== config.webhookSecret) {
    res.status(401).json({
      received: false,
      message: 'Unauthorized: Missing or Invalid X-Webhook-Secret header',
    })
    return // Stop execution here
  }

  // 2. If it exists and matches, proceed to the webhook controller
  next()
}
