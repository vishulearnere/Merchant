import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { config } from '../config/env.js'

export interface AuthenticatedRequest extends Request {
  merchantId?: string
  merchantEmail?: string
}

export function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization

  // 1. Check if header exists and has the correct format
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res
      .status(401)
      .json({ message: 'Authentication token is missing or invalid' })
    return // Stop execution here, do NOT call next()
  }

  const token = authHeader.split(' ')[1]

  try {
    // 2. Verify the token
    const decoded = jwt.verify(token, config.jwtSecret) as any

    // 3. Attach merchant data to the request
    req.merchantId = decoded.merchantId
    req.merchantEmail = decoded.email

    // 4. Proceed to the protected route
    next()
  } catch (err) {
    // 5. Handle invalid or expired tokens
    res.status(401).json({ message: 'Invalid or expired authentication token' })
    return // Stop execution here
  }
}
