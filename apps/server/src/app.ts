import path from "node:path";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Express } from "express";
import { env } from "./lib/env";
import { configurePassport } from "./lib/passport";
import { appRouter } from "./routers";
import { authRouter } from "./routes/auth";
import { webhooksRouter } from "./routes/cloudinary-webhook";
import { createTRPCContext } from "./trpc";

const CLIENT_DIST = path.resolve(import.meta.dirname, "../../client/dist");

export function createApp(): Express {
  const app = express();

  app.set("trust proxy", 1);
  app.use(cookieParser());

  // In dev the SPA is served by Vite on another origin, so it needs CORS with
  // credentials to send the session cookie. In production the server serves
  // the built client itself and the requests are same-origin.
  app.use(cors({ origin: env.clientUrl, credentials: true }));

  // Mounted before express.json() — the signature is over the raw body.
  app.use("/api/webhooks", webhooksRouter());

  app.use(express.json());
  app.use(configurePassport().initialize());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/auth", authRouter());

  app.use(
    "/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext: createTRPCContext,
    }),
  );

  if (env.isProduction) {
    app.use(express.static(CLIENT_DIST));
    // SPA fallback: anything that is not an API route renders the client.
    app.get(/^\/(?!api\/|trpc\/).*/, (_req, res) => {
      res.sendFile(path.join(CLIENT_DIST, "index.html"));
    });
  }

  return app;
}
