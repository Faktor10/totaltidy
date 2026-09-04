// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

vi.mock("./inbox-badge", () => ({ InboxBadge: () => null }));

import { BottomNav } from "./bottom-nav";

function renderAt(path: string) {
  const { hook } = memoryLocation({ path });
  return render(
    <Router hook={hook}>
      <BottomNav />
    </Router>,
  );
}

describe("BottomNav", () => {
  afterEach(() => {
    cleanup();
  });

  it("is hidden on the sign-in page", () => {
    renderAt("/auth/sign-in");
    expect(screen.queryByTestId("bottom-nav")).toBeNull();
  });

  it("is hidden on the root redirect route", () => {
    renderAt("/");
    expect(screen.queryByTestId("bottom-nav")).toBeNull();
  });

  it("renders on an authenticated page", () => {
    renderAt("/gallery");
    expect(screen.getByTestId("bottom-nav")).toBeDefined();
  });

  it("does not link to the removed home route", () => {
    renderAt("/gallery");
    const hrefs = screen.getAllByRole("link").map((link) => link.getAttribute("href"));
    expect(hrefs).not.toContain("/");
  });
});
