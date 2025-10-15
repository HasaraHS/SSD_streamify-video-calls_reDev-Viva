import rateLimit from "express-rate-limit";

// Create a shared memory store for all auth rate limiters
// This ensures login, signup, and OAuth all share the same counter
const authStore = new Map();

/**
 * Rate limiter for authentication endpoints (login, signup)
 * Prevents brute-force attacks by limiting the number of requests per IP
 * Shares counter with OAuth limiter using same store
 */
export const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // Limit each IP to 3 requests per windowMs 
  message: "Too many authentication attempts from this IP, please try again after 5 minutes.",
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skipSuccessfulRequests: false, // Count successful requests towards the limit
  skipFailedRequests: false, // Count failed requests towards the limit
  // Use same key as OAuth so all auth attempts share the same counter
  keyGenerator: (req) => {
    return `auth_${req.ip}`;
  },
  // SHARED STORE - This is critical!
  store: {
    async increment(key) {
      const current = authStore.get(key) || { count: 0, resetTime: Date.now() + 5 * 60 * 1000 };
      if (Date.now() > current.resetTime) {
        current.count = 0;
        current.resetTime = Date.now() + 5 * 60 * 1000;
      }
      current.count++;
      authStore.set(key, current);
      return { totalHits: current.count, resetTime: new Date(current.resetTime) };
    },
    async decrement(key) {
      const current = authStore.get(key);
      if (current) {
        current.count = Math.max(0, current.count - 1);
        authStore.set(key, current);
      }
    },
    async resetKey(key) {
      authStore.delete(key);
    },
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Too many authentication attempts from this IP, please try again later."
    });
  }
});

/**
 * Rate limiter for general sensitive endpoints
 * Less strict than auth limiter but still prevents abuse
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again after 15 minutes.",
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Strict rate limiter for password reset or other highly sensitive operations
 */
export const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 requests per hour
  message: "Too many attempts from this IP, please try again after 1 hour.",
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * OAuth rate limiter with redirect instead of JSON response
 * Redirects to login page with error message for better UX
 * SHARES the same store with authLimiter so all auth attempts count together
 */
export const oauthLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes - SAME as authLimiter
  max: 3, // 3 attempts - SAME as authLimiter
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  // Use SAME key as authLimiter so they share the counter
  keyGenerator: (req) => {
    return `auth_${req.ip}`;
  },
  // SHARED STORE - Same as authLimiter!
  store: {
    async increment(key) {
      const current = authStore.get(key) || { count: 0, resetTime: Date.now() + 5 * 60 * 1000 };
      if (Date.now() > current.resetTime) {
        current.count = 0;
        current.resetTime = Date.now() + 5 * 60 * 1000;
      }
      current.count++;
      authStore.set(key, current);
      return { totalHits: current.count, resetTime: new Date(current.resetTime) };
    },
    async decrement(key) {
      const current = authStore.get(key);
      if (current) {
        current.count = Math.max(0, current.count - 1);
        authStore.set(key, current);
      }
    },
    async resetKey(key) {
      authStore.delete(key);
    },
  },
  // Custom handler to redirect instead of JSON response
  handler: (req, res) => {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const errorMessage = encodeURIComponent("Too many authentication attempts. Please try again after 5 minutes.");
    res.redirect(`${frontendUrl}/login?error=${errorMessage}`);
  }
});

