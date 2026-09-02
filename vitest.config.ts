import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const root = path.resolve(import.meta.dirname);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(root, "apps/client/src"),
      "@totaltidy/shared": path.resolve(root, "packages/shared/src"),
      "@totaltidy/db/schema": path.resolve(root, "packages/db/src/schema.ts"),
      "@totaltidy/db/helpers": path.resolve(root, "packages/db/src/helpers.ts"),
      "@totaltidy/db": path.resolve(root, "packages/db/src/index.ts"),
    },
  },
  test: {
    // Node by default; component specs opt into jsdom with a
    // `// @vitest-environment jsdom` pragma.
    environment: "node",
    globals: true,
    include: [
      "apps/**/src/**/*.test.ts",
      "apps/**/src/**/*.test.tsx",
      "packages/*/src/**/*.test.ts",
    ],
  },
});
