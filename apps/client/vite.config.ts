import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const API_TARGET = process.env.SERVER_URL ?? "http://localhost:3001";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@totaltidy/shared": path.resolve(import.meta.dirname, "../../packages/shared/src"),
    },
  },
  server: {
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
