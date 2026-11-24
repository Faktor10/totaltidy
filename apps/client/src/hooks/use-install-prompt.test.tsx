// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InstallBanner } from "@/components/install-banner";
import { __resetPwaInstallForTests, initPwaInstall } from "@/lib/pwa-install";

function fireInstallPrompt(outcome: "accepted" | "dismissed" = "accepted") {
  const event = Object.assign(new Event("beforeinstallprompt", { cancelable: true }), {
    prompt: vi.fn().mockResolvedValue(undefined),
    userChoice: Promise.resolve({ outcome, platform: "web" }),
  });
  act(() => {
    window.dispatchEvent(event);
  });
  return event;
}

describe("InstallBanner", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    __resetPwaInstallForTests();
    window.matchMedia = vi.fn().mockReturnValue({ matches: false }) as never;
    initPwaInstall();
  });
  afterEach(cleanup);

  it("shows nothing until the browser offers an install", () => {
    render(<InstallBanner />);
    expect(screen.queryByTestId("install-banner")).toBeNull();
  });

  it("shows on first load once the browser offers install", () => {
    render(<InstallBanner />);
    fireInstallPrompt();
    expect(screen.getByTestId("install-banner")).toBeTruthy();
  });

  it("X hides it for this session but it returns on a later visit", () => {
    render(<InstallBanner />);
    fireInstallPrompt();
    fireEvent.click(screen.getByLabelText("Close"));
    expect(screen.queryByTestId("install-banner")).toBeNull();

    // New visit: sessionStorage is gone, localStorage is untouched.
    cleanup();
    sessionStorage.clear();
    render(<InstallBanner />);
    fireInstallPrompt();
    expect(screen.getByTestId("install-banner")).toBeTruthy();
  });

  it("'Don't remind me again' suppresses it permanently", () => {
    render(<InstallBanner />);
    fireInstallPrompt();
    fireEvent.click(screen.getByText("Don't remind me again"));
    expect(screen.queryByTestId("install-banner")).toBeNull();

    cleanup();
    sessionStorage.clear();
    render(<InstallBanner />);
    fireInstallPrompt();
    expect(screen.queryByTestId("install-banner")).toBeNull();
  });

  it("accepting the install hides it permanently", async () => {
    render(<InstallBanner />);
    const event = fireInstallPrompt("accepted");
    fireEvent.click(screen.getByText("Install"));
    await waitFor(() => expect(screen.queryByTestId("install-banner")).toBeNull());
    expect(event.prompt).toHaveBeenCalled();
    expect(localStorage.getItem("tt:pwa-install:installed")).toBe("1");
  });

  it("declining the browser dialog behaves like the X (asks again next visit)", async () => {
    render(<InstallBanner />);
    fireInstallPrompt("dismissed");
    fireEvent.click(screen.getByText("Install"));
    await waitFor(() => expect(screen.queryByTestId("install-banner")).toBeNull());
    expect(localStorage.getItem("tt:pwa-install:installed")).toBeNull();
    expect(sessionStorage.getItem("tt:pwa-install:dismissed")).toBe("1");
  });

  it("stays hidden when already running as an installed app", () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true }) as never;
    render(<InstallBanner />);
    fireInstallPrompt();
    expect(screen.queryByTestId("install-banner")).toBeNull();
  });
});
