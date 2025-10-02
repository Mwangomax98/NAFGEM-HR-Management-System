/**
 * Rate Limiting Utility
 * Prevents abuse by limiting the number of operations within a time window
 */

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
}

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

/**
 * Check if an operation is rate limited
 * @param key - Unique key for the operation (e.g., 'leave-request-userId')
 * @param config - Rate limit configuration
 * @returns true if operation is allowed, false if rate limited
 */
export const checkRateLimit = (key: string, config: RateLimitConfig): boolean => {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  // Clean up expired records periodically
  if (rateLimitStore.size > 1000) {
    cleanupExpiredRecords();
  }

  if (!record || now > record.resetTime) {
    // No record or expired - create new one
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return true;
  }

  if (record.count >= config.maxAttempts) {
    return false; // Rate limit exceeded
  }

  // Increment count
  record.count++;
  rateLimitStore.set(key, record);
  return true;
};

/**
 * Get remaining time until rate limit resets
 * @param key - Unique key for the operation
 * @returns milliseconds until reset, or 0 if not rate limited
 */
export const getRateLimitResetTime = (key: string): number => {
  const record = rateLimitStore.get(key);
  if (!record) return 0;

  const now = Date.now();
  return Math.max(0, record.resetTime - now);
};

/**
 * Clean up expired rate limit records
 */
const cleanupExpiredRecords = () => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
};

/**
 * Predefined rate limit configurations
 */
export const RATE_LIMITS = {
  LEAVE_REQUEST: {
    maxAttempts: 5,
    windowMs: 60 * 60 * 1000, // 5 requests per hour
  },
  TRIP_REQUEST: {
    maxAttempts: 10,
    windowMs: 60 * 60 * 1000, // 10 requests per hour
  },
  TIMESHEET_SUBMISSION: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 3 submissions per hour
  },
  WEEKLY_TASK_SUBMISSION: {
    maxAttempts: 20,
    windowMs: 60 * 60 * 1000, // 20 saves per hour (more lenient for drafts)
  },
  FILE_UPLOAD: {
    maxAttempts: 20,
    windowMs: 60 * 60 * 1000, // 20 uploads per hour
  },
} as const;
