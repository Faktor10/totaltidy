import { db } from "@totaltidy/db";
import { magicLinkRequestInput } from "@totaltidy/shared/schemas/auth";
import { Router } from "express";
import passport from "passport";
import { env, hasEmailAuth, hasGoogleOAuth } from "../lib/env";
import { attachSessionCookie, destroySession, resolveSession } from "../lib/session";
import {
  buildMagicLinkUrl,
  consumeMagicLinkToken,
  createMagicLinkToken,
  sendMagicLinkEmail,
} from "../services/magic-link";
import { upsertEmailUser } from "../services/users";

/** Keeps an attacker from bouncing the OAuth redirect off-site. */
function safeRedirect(callbackUrl: unknown): string {
  if (
    typeof callbackUrl === "string" &&
    callbackUrl.startsWith("/") &&
    !callbackUrl.startsWith("//")
  ) {
    return new URL(callbackUrl, env.clientUrl).toString();
  }
  return new URL("/gallery", env.clientUrl).toString();
}

export function authRouter(): Router {
  const router = Router();

  router.get("/providers", (_req, res) => {
    res.json({ google: hasGoogleOAuth(), email: hasEmailAuth() });
  });

  router.get("/session", async (req, res) => {
    const session = await resolveSession(req);
    res.json(session ? { user: session.user, expires: session.expires } : null);
  });

  router.post("/sign-out", async (req, res) => {
    await destroySession(req, res);
    res.json({ ok: true });
  });

  // ── Google OAuth (stateless Passport) ──────────────────────────────────
  router.get("/google", (req, res, next) => {
    if (!hasGoogleOAuth()) {
      res.status(404).json({ error: "Google sign-in is not configured" });
      return;
    }
    const state = typeof req.query.callbackUrl === "string" ? req.query.callbackUrl : undefined;
    passport.authenticate("google", { session: false, state })(req, res, next);
  });

  router.get(
    "/google/callback",
    (req, res, next) => {
      if (!hasGoogleOAuth()) {
        res.status(404).json({ error: "Google sign-in is not configured" });
        return;
      }
      passport.authenticate("google", {
        session: false,
        failureRedirect: new URL("/auth/sign-in?error=oauth", env.clientUrl).toString(),
      })(req, res, next);
    },
    async (req, res) => {
      const user = req.user as { id: string } | undefined;
      if (!user) {
        res.redirect(new URL("/auth/sign-in?error=oauth", env.clientUrl).toString());
        return;
      }
      await attachSessionCookie(res, user.id);
      res.redirect(safeRedirect(req.query.state));
    },
  );

  // ── Magic link (Resend) ────────────────────────────────────────────────
  router.post("/magic-link", async (req, res) => {
    const parsed = magicLinkRequestInput.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "A valid email address is required" });
      return;
    }

    const email = parsed.data.email.toLowerCase();
    const token = await createMagicLinkToken(db, email);
    await sendMagicLinkEmail(email, buildMagicLinkUrl(email, token, parsed.data.callbackUrl));

    // Always 200 — never reveal whether an address has an account.
    res.json({ ok: true });
  });

  router.get("/magic-link/callback", async (req, res) => {
    const email = typeof req.query.email === "string" ? req.query.email.toLowerCase() : null;
    const token = typeof req.query.token === "string" ? req.query.token : null;

    if (!email || !token || !(await consumeMagicLinkToken(db, email, token))) {
      res.redirect(new URL("/auth/sign-in?error=link", env.clientUrl).toString());
      return;
    }

    const user = await upsertEmailUser(db, email);
    await attachSessionCookie(res, user.id);
    res.redirect(safeRedirect(req.query.callbackUrl));
  });

  return router;
}
