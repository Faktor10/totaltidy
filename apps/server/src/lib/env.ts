import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} environment variable is required`);
  }
  return value;
}

function optional(name: string): string | undefined {
  const value = process.env[name];
  return value && value.length > 0 ? value : undefined;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  isProduction: process.env.NODE_ENV === "production",
  port: Number.parseInt(process.env.PORT ?? "3001", 10),

  /** Canonical URL of the API/server itself — used for OAuth + webhook callbacks. */
  serverUrl: process.env.SERVER_URL ?? `http://localhost:${process.env.PORT ?? "3001"}`,
  /** Where the browser app lives. In production the server serves it itself. */
  clientUrl: process.env.CLIENT_URL ?? "http://localhost:3000",

  get authSecret(): string {
    return required("AUTH_SECRET");
  },

  google: {
    clientId: optional("AUTH_GOOGLE_ID"),
    clientSecret: optional("AUTH_GOOGLE_SECRET"),
  },

  resend: {
    apiKey: optional("AUTH_RESEND_KEY"),
    from: process.env.AUTH_EMAIL_FROM ?? "TotalTidy <noreply@totaltidy.com>",
  },

  cloudinary: {
    cloudName: optional("CLOUDINARY_CLOUD_NAME"),
    apiKey: optional("CLOUDINARY_API_KEY"),
    apiSecret: optional("CLOUDINARY_API_SECRET"),
  },
} as const;

/** Google OAuth is optional — the sign-in page hides the button when unset. */
export function hasGoogleOAuth(): boolean {
  return Boolean(env.google.clientId && env.google.clientSecret);
}

/** Whether a magic-link email can actually be delivered over Resend. */
export function hasResendEmail(): boolean {
  return Boolean(env.resend.apiKey);
}

/**
 * Whether the magic-link flow is offered at all. The server can mint and
 * consume links without Resend — it logs them instead — so in development the
 * form stays available and only production requires a real mail provider.
 */
export function hasEmailAuth(): boolean {
  return hasResendEmail() || !env.isProduction;
}

/**
 * One-click sign-in as a fixed test user, for local dev and preview
 * environments only — never available once NODE_ENV=production.
 */
export function hasDevLogin(): boolean {
  return !env.isProduction;
}
