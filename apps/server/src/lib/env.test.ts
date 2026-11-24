import { afterEach, describe, expect, it, vi } from "vitest";

async function loadEnv() {
  vi.resetModules();
  return import("./env");
}

describe("assertDeploymentConfig", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("rejects a Railway deploy without NODE_ENV=production", async () => {
    vi.stubEnv("RAILWAY_ENVIRONMENT_NAME", "production");
    vi.stubEnv("NODE_ENV", "development");
    const { assertDeploymentConfig } = await loadEnv();
    expect(() => assertDeploymentConfig()).toThrow("NODE_ENV must be set");
  });

  it("requires SERVER_URL in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SERVER_URL", "");
    const { assertDeploymentConfig } = await loadEnv();
    expect(() => assertDeploymentConfig()).toThrow("SERVER_URL must be set");
  });

  it("passes for a correctly configured production deploy", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SERVER_URL", "https://app.example.com");
    const { assertDeploymentConfig } = await loadEnv();
    expect(() => assertDeploymentConfig()).not.toThrow();
  });

  it("does nothing in local development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const { assertDeploymentConfig } = await loadEnv();
    expect(() => assertDeploymentConfig()).not.toThrow();
  });
});
