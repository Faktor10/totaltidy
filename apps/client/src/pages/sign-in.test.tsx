// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api", () => ({
  fetchAuthProviders: vi.fn(),
  googleSignInUrl: (callbackUrl?: string) =>
    callbackUrl ? `/api/auth/google?callbackUrl=${callbackUrl}` : "/api/auth/google",
  requestMagicLink: vi.fn(),
}));

import { fetchAuthProviders } from "@/lib/api";
import SignInPage from "./sign-in";

const mockProviders = vi.mocked(fetchAuthProviders);

describe("SignInPage", () => {
  afterEach(() => {
    cleanup();
    vi.resetAllMocks();
  });

  it("renders the email form even when no provider is configured", async () => {
    mockProviders.mockResolvedValue({ google: false, email: false });
    render(<SignInPage />);

    await waitFor(() => {
      expect(screen.getByLabelText("Email address")).toBeDefined();
    });
    expect(screen.getByRole("button", { name: /sign-in link/i })).toBeDefined();
  });

  it("renders the email form when the providers request fails", async () => {
    mockProviders.mockRejectedValue(new Error("offline"));
    render(<SignInPage />);

    await waitFor(() => {
      expect(screen.getByRole("alert").textContent).toContain("Could not reach");
    });
    expect(screen.getByLabelText("Email address")).toBeDefined();
  });

  it("shows the Google button and a separator only when Google is configured", async () => {
    mockProviders.mockResolvedValue({ google: true, email: true });
    render(<SignInPage />);

    await waitFor(() => {
      expect(screen.getByText("Continue with Google")).toBeDefined();
    });
    expect(screen.getByText("or")).toBeDefined();
  });

  it("hides the Google button when Google is not configured", async () => {
    mockProviders.mockResolvedValue({ google: false, email: true });
    render(<SignInPage />);

    await waitFor(() => {
      expect(screen.getByLabelText("Email address")).toBeDefined();
    });
    expect(screen.queryByText("Continue with Google")).toBeNull();
    expect(screen.queryByText("or")).toBeNull();
  });

  it("warns when email delivery is unconfigured", async () => {
    mockProviders.mockResolvedValue({ google: false, email: false });
    render(<SignInPage />);

    await waitFor(() => {
      expect(screen.getByText(/written to the server log/i)).toBeDefined();
    });
  });
});
