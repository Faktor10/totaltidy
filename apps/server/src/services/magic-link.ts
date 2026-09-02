import { createHash, randomBytes } from "node:crypto";
import type { Database } from "@totaltidy/db";
import { verificationTokens } from "@totaltidy/db/schema";
import { and, eq, lt } from "drizzle-orm";
import { Resend } from "resend";
import { env, hasEmailAuth } from "../lib/env";

export const MAGIC_LINK_TTL_MS = 15 * 60 * 1000;

/** Only the hash is stored, so a database leak cannot be replayed as a login. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createMagicLinkToken(db: Database, email: string): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + MAGIC_LINK_TTL_MS);

  await db.delete(verificationTokens).where(lt(verificationTokens.expires, new Date()));
  await db.insert(verificationTokens).values({
    identifier: email,
    token: hashToken(token),
    expires,
  });

  return token;
}

/** Single-use: the row is deleted whether or not it had expired. */
export async function consumeMagicLinkToken(
  db: Database,
  email: string,
  token: string,
): Promise<boolean> {
  const hashed = hashToken(token);

  const [row] = await db
    .delete(verificationTokens)
    .where(and(eq(verificationTokens.identifier, email), eq(verificationTokens.token, hashed)))
    .returning();

  if (!row) return false;
  return row.expires.getTime() > Date.now();
}

export function buildMagicLinkUrl(email: string, token: string, callbackUrl?: string): string {
  const url = new URL("/api/auth/magic-link/callback", env.serverUrl);
  url.searchParams.set("email", email);
  url.searchParams.set("token", token);
  if (callbackUrl) url.searchParams.set("callbackUrl", callbackUrl);
  return url.toString();
}

/**
 * No-op when RESEND is unconfigured: local dev logs the link instead of
 * hard-crashing, matching how the other optional integrations degrade.
 */
export async function sendMagicLinkEmail(email: string, link: string): Promise<void> {
  if (!hasEmailAuth()) {
    console.warn(`[auth] AUTH_RESEND_KEY unset — magic link for ${email}: ${link}`);
    return;
  }

  const resend = new Resend(env.resend.apiKey);

  await resend.emails.send({
    from: env.resend.from,
    to: email,
    subject: "Sign in to TotalTidy",
    text: `Sign in to TotalTidy:\n\n${link}\n\nThis link expires in 15 minutes.`,
    html: `<p>Sign in to TotalTidy:</p><p><a href="${link}">Sign in</a></p><p>This link expires in 15 minutes.</p>`,
  });
}
