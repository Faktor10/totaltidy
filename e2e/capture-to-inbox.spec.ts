import { expect, test } from "@playwright/test";

const FAKE_PUBLIC_ID = "totaltidy/test-capture-123";
const FAKE_IMAGE_URL = `https://res.cloudinary.com/demo/image/upload/${FAKE_PUBLIC_ID}`;

const FAKE_ITEM = {
  id: "11111111-1111-1111-1111-111111111111",
  userId: "user-e2e",
  cloudinaryPublicId: FAKE_PUBLIC_ID,
  originalImageUrl: FAKE_IMAGE_URL,
  processedImageUrl: null,
  locationId: null,
  label: null,
  tags: null,
  category: null,
  status: "inbox",
  captureSessionId: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

function trpcResult(json: unknown, meta?: Record<string, unknown>) {
  return { result: { data: { json, meta: meta ? { values: meta } : undefined } } };
}

test.describe("capture to inbox flow", () => {
  test.beforeEach(async ({ context }) => {
    await context.addCookies([
      {
        name: "authjs.session-token",
        value: "fake-e2e-session-token",
        domain: "localhost",
        path: "/",
      },
    ]);
  });

  test("open camera → capture item → appears in inbox", async ({ page }) => {
    let capturedItem = false;

    await page.route("**/api.cloudinary.com/**", (route) => {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          public_id: FAKE_PUBLIC_ID,
          secure_url: FAKE_IMAGE_URL,
          url: FAKE_IMAGE_URL,
          width: 800,
          height: 600,
          format: "jpg",
          resource_type: "image",
          created_at: new Date().toISOString(),
          bytes: 12345,
        }),
      });
    });

    const resolveProcedure = (name: string) => {
      if (name === "items.capture") {
        capturedItem = true;
        return trpcResult(FAKE_ITEM, { createdAt: ["Date"], updatedAt: ["Date"] });
      }
      if (name === "items.inbox") {
        const items = capturedItem ? [FAKE_ITEM] : [];
        return trpcResult(
          items,
          items.length > 0 ? { "0.createdAt": ["Date"], "0.updatedAt": ["Date"] } : {},
        );
      }
      if (name === "items.inboxCount") {
        return trpcResult(capturedItem ? 1 : 0);
      }
      if (name === "locations.list") {
        return trpcResult([]);
      }
      if (name === "locations.lastUsed") {
        return trpcResult(null);
      }
      if (name === "me") {
        return trpcResult({
          userId: "user-e2e",
          user: { id: "user-e2e", email: "e2e@example.com", name: null, image: null },
        });
      }
      return null;
    };

    await page.route("**/trpc/**", (route, request) => {
      const url = new URL(request.url());
      const trpcPath = url.pathname.replace("/trpc/", "");
      const procedures = trpcPath.split(",");
      const isBatch = url.searchParams.has("batch");

      if (isBatch) {
        const results = procedures.map((p) => resolveProcedure(p) ?? trpcResult(null));
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(results),
        });
      }

      const result = resolveProcedure(trpcPath);
      if (result) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(result),
        });
      }

      return route.continue();
    });

    await page.addInitScript(() => {
      const canvas = document.createElement("canvas");
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#4a9";
        ctx.fillRect(0, 0, 640, 480);
      }

      const stream = canvas.captureStream(30);

      Object.defineProperty(navigator, "mediaDevices", {
        writable: true,
        value: {
          getUserMedia: () => Promise.resolve(stream),
          enumerateDevices: () => Promise.resolve([]),
        },
      });
    });

    await page.goto("/capture");
    await expect(page.getByTestId("camera-view")).toBeVisible();
    await expect(page.getByTestId("shutter-button")).toBeEnabled({ timeout: 5000 });

    await page.getByTestId("shutter-button").click();

    await page.waitForTimeout(1000);
    expect(capturedItem).toBe(true);

    await page.goto("/inbox");
    await expect(page.getByTestId("inbox-grid")).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId("inbox-item")).toHaveCount(1);
  });
});
