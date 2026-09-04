import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Deliberately distinct from SERVER_URL: that var is the API's *public*
// canonical URL (used for OAuth callbacks and magic-link emails), while this
// is where Vite should proxy requests from *inside* the same container. When
// client and server share a host (e.g. Replit) SERVER_URL is often a public
// address, and proxying there would loop the request back into Vite itself.
const API_TARGET = process.env.VITE_PROXY_TARGET ?? "http://localhost:3001";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@totaltidy/shared": path.resolve(import.meta.dirname, "../../packages/shared/src"),
    },
  },
  server: {
    allowedHosts: ["268d7435-9473-4aaf-8cb0-2b125ccf3a2a-00-2283auaec5dwo.worf.replit.dev"],
    port: 3000,
    // The SPA and the API run on different ports in dev; proxying keeps the
    // browser on one origin so the session cookie is sent as first-party.
    proxy: {
      "/api": { target: API_TARGET, changeOrigin: true },
      "/trpc": { target: API_TARGET, changeOrigin: true },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
