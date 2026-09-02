import { defineConfig, devices } from "@playwright/test";

const CLIENT_URL = process.env.CLIENT_URL ?? "http://localhost:3000";
const SERVER_URL = process.env.SERVER_URL ?? "http://localhost:3001";

const serverEnv = {
  DATABASE_URL:
    process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/totaltidy_test",
  AUTH_SECRET: process.env.AUTH_SECRET ?? "e2e-test-secret-do-not-use-in-production",
  SERVER_URL,
  CLIENT_URL,
};

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: CLIENT_URL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: {
          executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined,
        },
      },
    },
  ],
  // Two processes now: the API, and the Vite dev server that proxies to it.
  webServer: [
    {
      command: "npm run dev:server",
      url: `${SERVER_URL}/api/health`,
      reuseExistingServer: !process.env.CI,
      env: serverEnv,
    },
    {
      command: "npm run dev:client",
      url: CLIENT_URL,
      reuseExistingServer: !process.env.CI,
      env: {
        SERVER_URL,
        VITE_CLOUDINARY_CLOUD_NAME: process.env.VITE_CLOUDINARY_CLOUD_NAME ?? "test-cloud",
        VITE_CLOUDINARY_UPLOAD_PRESET: process.env.VITE_CLOUDINARY_UPLOAD_PRESET ?? "test-preset",
      },
    },
  ],
});
