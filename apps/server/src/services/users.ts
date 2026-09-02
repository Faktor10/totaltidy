import type { Database } from "@totaltidy/db";
import { accounts, users } from "@totaltidy/db/schema";
import { and, eq } from "drizzle-orm";

export interface OAuthProfile {
  provider: string;
  providerAccountId: string;
  email: string;
  name?: string | null;
  image?: string | null;
  accessToken?: string | null;
  refreshToken?: string | null;
}

async function findByEmail(db: Database, email: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return user ?? null;
}

/**
 * Finds or creates the user behind an OAuth identity and makes sure the
 * `accounts` row linking them exists. Matching on verified email means signing
 * in with Google after a magic link lands on the same account.
 */
export async function upsertOAuthUser(db: Database, profile: OAuthProfile) {
  const [existingAccount] = await db
    .select({ userId: accounts.userId })
    .from(accounts)
    .where(
      and(
        eq(accounts.provider, profile.provider),
        eq(accounts.providerAccountId, profile.providerAccountId),
      ),
    )
    .limit(1);

  if (existingAccount) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, existingAccount.userId))
      .limit(1);
    if (user) return user;
  }

  let user = await findByEmail(db, profile.email);

  if (!user) {
    const [created] = await db
      .insert(users)
      .values({
        email: profile.email,
        name: profile.name ?? null,
        image: profile.image ?? null,
        emailVerified: new Date(),
      })
      .returning();
    user = created;
  }

  if (!user) {
    throw new Error("Failed to create user");
  }

  if (!existingAccount) {
    await db
      .insert(accounts)
      .values({
        userId: user.id,
        type: "oauth",
        provider: profile.provider,
        providerAccountId: profile.providerAccountId,
        access_token: profile.accessToken ?? null,
        refresh_token: profile.refreshToken ?? null,
      })
      .onConflictDoNothing();
  }

  return user;
}

/** Magic-link sign-in: the verified email is itself proof of ownership. */
export async function upsertEmailUser(db: Database, email: string) {
  const existing = await findByEmail(db, email);

  if (existing) {
    if (!existing.emailVerified) {
      await db.update(users).set({ emailVerified: new Date() }).where(eq(users.id, existing.id));
    }
    return existing;
  }

  const [created] = await db.insert(users).values({ email, emailVerified: new Date() }).returning();

  if (!created) {
    throw new Error("Failed to create user");
  }

  return created;
}
