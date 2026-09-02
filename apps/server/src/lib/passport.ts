import { db } from "@totaltidy/db";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { upsertOAuthUser } from "../services/users";
import { env, hasGoogleOAuth } from "./env";

/**
 * Passport runs in stateless mode (`session: false`) — it only performs the
 * OAuth handshake. The server mints its own session cookie afterward, exactly
 * like the magic-link flow, so there is one session mechanism to reason about.
 */
export function configurePassport(): typeof passport {
  if (!hasGoogleOAuth()) {
    console.warn("[auth] AUTH_GOOGLE_ID/AUTH_GOOGLE_SECRET unset — Google sign-in disabled.");
    return passport;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: env.google.clientId as string,
        clientSecret: env.google.clientSecret as string,
        callbackURL: new URL("/api/auth/google/callback", env.serverUrl).toString(),
        scope: ["profile", "email"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            done(new Error("Google account has no email address"));
            return;
          }

          const user = await upsertOAuthUser(db, {
            provider: "google",
            providerAccountId: profile.id,
            email,
            name: profile.displayName ?? null,
            image: profile.photos?.[0]?.value ?? null,
            accessToken,
            refreshToken,
          });

          done(null, { id: user.id });
        } catch (error) {
          done(error as Error);
        }
      },
    ),
  );

  return passport;
}
