# Deploying TotalTidy to Railway

One Railway service runs the Express API, which also serves the built client
(same origin). Migrations apply automatically on boot.

## Steps

1. New Railway project → **Deploy from GitHub repo**.
2. Add the **PostgreSQL** plugin and reference its `DATABASE_URL` in the service.
3. Set the variables below, then generate a public domain.
4. Set `SERVER_URL` and `CLIENT_URL` to that domain (`https://<app>.up.railway.app`).
5. Configure Cloudinary: run `npm run cloudinary:setup` locally with prod creds,
   and add a webhook notification to `{SERVER_URL}/api/webhooks/cloudinary`.
6. Hit `/api/health` — Railway's health check uses it before routing traffic.

## Variables

| Variable | Notes |
|---|---|
| `NODE_ENV` | **`production`** — required. Boot fails on Railway without it (otherwise dev-login would be open). |
| `DATABASE_URL` | From the Postgres plugin. |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `SERVER_URL` / `CLIENT_URL` | Same public origin. Required in production. |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Server-side. |
| `CLOUDINARY_WEBHOOK_SECRET` | Must match the Cloudinary dashboard. |
| `VITE_CLOUDINARY_CLOUD_NAME`, `VITE_CLOUDINARY_UPLOAD_PRESET` | Baked into the client at **build** time. |
| `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | Optional. Redirect URI: `{SERVER_URL}/api/auth/google/callback`. |
| `AUTH_RESEND_KEY`, `AUTH_EMAIL_FROM` | Needed for magic-link sign-in in production; the from-domain must be verified in Resend. |

## Notes

- Build runs `npm ci --include=dev` because Vite is a dev dependency.
- Auth routes are rate-limited (30 req / 15 min / IP); security headers via helmet.
- Content-Security-Policy allows only self, Cloudinary (images/uploads) and
  Google Fonts. Add hosts in `apps/server/src/app.ts` if you add third parties.
