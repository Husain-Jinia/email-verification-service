import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  firstRequest: number;
}

const rateLimits = new Map<string, RateLimitRecord>();
const WINDOW_MS = 300000; // 5 minutes
const MAX_REQUESTS = 10; // Maximum requests per 5 minutes per email

export function rateLimiter(req: Request, res: Response, next: NextFunction): void {
  const email = req.body.email;
  if (!email) {
    next();
    return;
  }

  const now = Date.now();
  const record = rateLimits.get(email);

  // Clean up old records
  if (record && now - record.firstRequest > WINDOW_MS) {
    rateLimits.delete(email);
  }

  if (!record) {
    // First request from this email
    rateLimits.set(email, { count: 1, firstRequest: now });
    next();
    return;
  }

  if (record.count >= MAX_REQUESTS) {
    res.status(429).json({
      success: false,
      error: 'Too many verification requests. Please try again later.',
      retryAfter: Math.ceil((record.firstRequest + WINDOW_MS - now) / 1000)
    });
    return;
  }
  // Increment request count
  record.count += 1;
  rateLimits.set(email, record);
  
  // Add rate limit info to response headers
  res.setHeader('X-RateLimit-Limit', MAX_REQUESTS.toString());
  res.setHeader('X-RateLimit-Remaining', (MAX_REQUESTS - record.count).toString());
  res.setHeader('X-RateLimit-Reset', Math.ceil((record.firstRequest + WINDOW_MS) / 1000).toString());
  
  next();
}
