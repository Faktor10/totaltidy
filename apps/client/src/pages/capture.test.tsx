// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { TRPCLink } from "@trpc/client";
import { observable } from "@trpc/server/observable";
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { trpc } from "@/lib/trpc";
import type { AppRouter } from "../../../server/src/routers";

const mockStartCamera = vi.fn();
const mockStopCamera = vi.fn();
const mockCaptureFrame = vi.fn();

vi.mock("@/hooks/use-camera", () => ({
  useCamera: vi.fn(() => ({
    videoRef: { current: null },
    canvasRef: { current: null },
    isStreaming: true,
    error: null,
    startCamera: mockStartCamera,
    stopCamera: mockStopCamera,
    captureFrame: mockCaptureFrame,
  })),
}));

vi.mock("@/lib/haptics", () => ({ triggerHaptic: vi.fn() }));
vi.mock("@/lib/sounds", () => ({ playCategorizeTone: vi.fn() }));

vi.mock("@/hooks/use-cloudinary-upload", () => ({
  useCloudinaryUpload: () => ({
    upload: vi.fn(async () => ({ public_id: "pub123" })),
    isUploading: false,
    error: null,
    lastResult: null,
    reset: vi.fn(),
  }),
}));

import CapturePage from "@/pages/capture";

// A mock tRPC link that resolves each procedure call asynchronously, so
// query/mutation hooks go through their normal loading -> success state
// transitions (and re-renders) just like they do against a real server.
function makeMockLink(): TRPCLink<AppRouter> {
  return () =>
    ({ op }) =>
      observable((observer) => {
        let data: unknown = null;
        if (op.path === "locations.predicted") data = [{ id: "loc-1", name: "Kitchen" }];
        else if (op.path === "locations.lastUsed") data = { id: "loc-1" };
        else if (op.path === "sessions.startSession") data = { id: "session-1" };
        else if (op.path === "sessions.endSession") data = { summary: null };
        else if (op.path === "items.capture") data = { id: "item-1" };

        const timer = setTimeout(() => {
          observer.next({ result: { type: "data", data } });
          observer.complete();
        }, 0);
        return () => clearTimeout(timer);
      });
}

describe("CapturePage", () => {
  beforeEach(() => {
    mockCaptureFrame.mockReset();
  });

  afterEach(() => cleanup());

  it("mounts and captures without an infinite update-depth loop", async () => {
    const queryClient = new QueryClient();
    const trpcClient = trpc.createClient({ links: [makeMockLink()] });

    const blob = new Blob(["x"], { type: "image/jpeg" });
    mockCaptureFrame.mockResolvedValue({ blob, blobUrl: "blob:x" });

    const errors: unknown[] = [];
    const originalError = console.error;
    console.error = (...args: unknown[]) => {
      errors.push(args);
      originalError(...(args as []));
    };

    render(
      <StrictMode>
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <CapturePage />
          </QueryClientProvider>
        </trpc.Provider>
      </StrictMode>,
    );

    await vi.waitFor(() => {
      expect(screen.getByTestId("shutter-button")).toBeDefined();
    });

    // Let the session-start mutation resolve (this is what previously
    // triggered the endSession cleanup effect to re-fire every render).
    await new Promise((r) => setTimeout(r, 20));

    fireEvent.click(screen.getByTestId("shutter-button"));

    await new Promise((r) => setTimeout(r, 100));

    console.error = originalError;

    const hasMaxDepthError = (errors as unknown[][]).some((e) =>
      e.some((a) => typeof a === "string" && a.includes("Maximum update depth")),
    );
    expect(hasMaxDepthError).toBe(false);
  });
});
