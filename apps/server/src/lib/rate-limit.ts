import { rateLimit } from "express-rate-limit";

/**
 * Throttles the auth endpoints (magic-link email sends, OAuth, callbacks) per
 * client IP. Relies on `trust proxy` so the IP is the real client behind
 * Railway's proxy. Session lookups are exempt — the SPA polls them.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: (req) => req.path === "/session" || req.path === "/providers",
  message: { error: "Too many requests, please try again later." },
});
