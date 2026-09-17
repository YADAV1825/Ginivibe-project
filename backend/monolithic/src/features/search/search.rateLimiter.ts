import type { NextFunction, Response } from 'express';
import type { AuthRequest } from '../../middleware/auth';

interface RateLimitEntry {
  timestamps: number[];
}

export class SlidingWindowRateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();
  private readonly windowMs: number;
  private readonly maxRequests: number;
  private cleanupInterval: NodeJS.Timeout;

  constructor(maxRequests = 60, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;

    // Periodic cleanup every 2 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 120000);

    // Ensure it doesn't hold the process open
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  public check(key: string): boolean {
    const now = Date.now();
    const entry = this.store.get(key) || { timestamps: [] };

    // Filter out timestamps outside the sliding window
    const recent = entry.timestamps.filter((ts) => now - ts < this.windowMs);

    if (recent.length >= this.maxRequests) {
      this.store.set(key, { timestamps: recent });
      return false; // Limit exceeded
    }

    recent.push(now);
    this.store.set(key, { timestamps: recent });
    return true; // Allowed
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      const valid = entry.timestamps.filter((ts) => now - ts < this.windowMs);
      if (valid.length === 0) {
        this.store.delete(key);
      } else {
        this.store.set(key, { timestamps: valid });
      }
    }
  }

  public middleware() {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
      const key = req.userId || req.ip || 'anonymous';
      const allowed = this.check(key);

      if (!allowed) {
        return res.status(429).json({
          error: 'Rate limit exceeded. Please wait a moment before searching again.',
        });
      }

      next();
    };
  }
}

export const searchRateLimiter = new SlidingWindowRateLimiter(60, 60000);
