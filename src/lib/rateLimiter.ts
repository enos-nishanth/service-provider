// Client-side rate limiting utility
// Prevents abuse and excessive API calls

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  
  /**
   * Check if a request is allowed under rate limit
   * @param key - Unique identifier for the rate limit (e.g., 'login', 'booking')
   * @param config - Rate limit configuration
   * @returns true if request is allowed, false if rate limited
   */
  checkLimit(key: string, config: RateLimitConfig): boolean {
    const now = Date.now();
    const entry = this.limits.get(key);
    
    // No previous entry or window expired
    if (!entry || now > entry.resetTime) {
      this.limits.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
      });
      return true;
    }
    
    // Within window, check count
    if (entry.count < config.maxRequests) {
      entry.count++;
      return true;
    }
    
    // Rate limited
    return false;
  }
  
  /**
   * Get remaining time until rate limit resets (in seconds)
   */
  getResetTime(key: string): number {
    const entry = this.limits.get(key);
    if (!entry) return 0;
    
    const now = Date.now();
    const remaining = Math.max(0, entry.resetTime - now);
    return Math.ceil(remaining / 1000);
  }
  
  /**
   * Clear rate limit for a specific key
   */
  clear(key: string): void {
    this.limits.delete(key);
  }
  
  /**
   * Clear all rate limits
   */
  clearAll(): void {
    this.limits.clear();
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();

// Predefined rate limit configurations
export const RATE_LIMITS = {
  // Authentication endpoints
  login: { maxRequests: 5, windowMs: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
  signup: { maxRequests: 3, windowMs: 60 * 60 * 1000 }, // 3 attempts per hour
  passwordReset: { maxRequests: 3, windowMs: 60 * 60 * 1000 }, // 3 attempts per hour
  
  // Booking endpoints
  createBooking: { maxRequests: 10, windowMs: 60 * 60 * 1000 }, // 10 bookings per hour
  cancelBooking: { maxRequests: 5, windowMs: 60 * 60 * 1000 }, // 5 cancellations per hour
  
  // Review endpoints
  submitReview: { maxRequests: 5, windowMs: 60 * 60 * 1000 }, // 5 reviews per hour
  
  // Search endpoints
  search: { maxRequests: 30, windowMs: 60 * 1000 }, // 30 searches per minute
  
  // General API calls
  general: { maxRequests: 100, windowMs: 60 * 1000 }, // 100 requests per minute
};

/**
 * React hook for rate limiting
 */
export const useRateLimit = (key: string, config: RateLimitConfig) => {
  const checkLimit = () => {
    const allowed = rateLimiter.checkLimit(key, config);
    
    if (!allowed) {
      const resetTime = rateLimiter.getResetTime(key);
      return {
        allowed: false,
        resetTime,
        message: `Too many requests. Please try again in ${resetTime} seconds.`,
      };
    }
    
    return { allowed: true, resetTime: 0, message: '' };
  };
  
  return { checkLimit };
};
