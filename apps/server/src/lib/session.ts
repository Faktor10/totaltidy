import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { type Database, db as defaultDb } from "@totaltidy/db";
import { sessions, users } from "@totaltidy/db/schema";
import { and, eq, gt } from "drizzle-orm";
import type { CookieOptions, Request, Response } from "express";
import { env } from "./env";

export const SESSION_COOKIE = "totaltidy.session";
export const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * Session tokens are opaque random strings stored in `sessions`. The cookie
 * carries `<token>.<hmac>` so a tampered or forged cookie is rejected before
 * it ever reaches the database.
 */
export function signToken(token: string, secret: string): string {
  const mac = createHmac("sha256", secret).update(token).digest("base64url");
  return `${token}.${mac}`;
}

export function verifySignedToken(signed: string, secret: string): string | null {
  const separator = signed.lastIndexOf(".");
  if (separator <= 0) return null;

  const token = signed.slice(0, separator);
  const provided = signed.slice(separator + 1);
  const expected = createHmac("sha256", secret).update(token).digest("base64url");

  const providedBuf = Buffer.from(provided);
  const expectedBuf = Buffer.from(expected);
  if (providedBuf.length !== expectedBuf.length) return null;
  if (!timingSafeEqual(providedBuf, expectedBuf)) return null;

  return token;
}

export function cookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: env.isProduction,
    path: "/",
    maxAge: SESSION_MAX_AGE_MS,
  };
}

export async function createSession(
  userId: string,
  db: Database = defaultDb,
): Promise<{ sessionToken: string; expires: Date }> {
  const sessionToken = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_MAX_AGE_MS);

  await db.insert(sessions).values({ sessionToken, userId, expires });

  return { sessionToken, expires };
}

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
}

export interface AuthSession {
  user: SessionUser;
  expires: Date;
}

/** Resolves the signed session cookie on a request to a user, or null. */
export async function resolveSession(
  req: Request,
  db: Database = defaultDb,
): Promise<AuthSession | null> {
  const signed = req.cookies?.[SESSION_COOKIE];
  if (typeof signed !== "string") return null;

  const sessionToken = verifySignedToken(signed, env.authSecret);
  if (!sessionToken) return null;

  const [row] = await db
    .select({
      expires: sessions.expires,
      id: users.id,
      email: users.email,
      name: users.name,
      image: users.image,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.sessionToken, sessionToken), gt(sessions.expires, new Date())))
    .limit(1);

  if (!row) return null;

  return {
    user: { id: row.id, email: row.email, name: row.name, image: row.image },
    expires: row.expires,
  };
}

export async function attachSessionCookie(
  res: Response,
  userId: string,
  db: Database = defaultDb,
): Promise<void> {
  const { sessionToken } = await createSession(userId, db);
  res.cookie(SESSION_COOKIE, signToken(sessionToken, env.authSecret), cookieOptions());
}

export async function destroySession(
  req: Request,
  res: Response,
  db: Database = defaultDb,
): Promise<void> {
  const signed = req.cookies?.[SESSION_COOKIE];
  if (typeof signed === "string") {
    const sessionToken = verifySignedToken(signed, env.authSecret);
    if (sessionToken) {
      await db.delete(sessions).where(eq(sessions.sessionToken, sessionToken));
    }
  }
  res.clearCookie(SESSION_COOKIE, { ...cookieOptions(), maxAge: undefined });
}
