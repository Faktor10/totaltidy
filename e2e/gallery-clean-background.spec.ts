import { expect, test } from "@playwright/test";

const FAKE_PUBLIC_ID = "totaltidy/test-gallery-item";
const FAKE_ORIGINAL_URL = `https://res.cloudinary.com/demo/image/upload/${FAKE_PUBLIC_ID}`;
const FAKE_PROCESSED_URL = `https://res.cloudinary.com/demo/image/upload/e_background_removal/${FAKE_PUBLIC_ID}`;

const LOCATION_ID = "loc-living-room";

function makeItem(overrides: Record<string, unknown> = {}) {
  return {
    id: "22222222-2222-2222-2222-222222222222",
    userId: "user-e2e",
    cloudinaryPublicId: FAKE_PUBLIC_ID,
    originalImageUrl: FAKE_ORIGINAL_URL,
    processedImageUrl: null,
    label: null,
    tags: null,
    category: null,
    status: "inbox",
    locationId: LOCATION_ID,
    locationName: "Living Room",
    locationIcon: null,
    captureSessionId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function trpcResult(json: unknown, meta?: Record<string, unknown>) {
  return { result: { data: { json, meta: meta ? { values: meta } : undefined } } };
}

test.describe("gallery clean background", () => {
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

  test("captured item eventually shows clean background in gallery", async ({ page }) => {
    let processingComplete = false;

    const resolveProcedure = (name: string) => {
      if (name === "items.gallery") {
        if (processingComplete) {
          const item = makeItem({
            processedImageUrl: FAKE_PROCESSED_URL,
            label: "Toy Train",
          });
          return trpcResult([item], {
            "0.createdAt": ["Date"],
            "0.updatedAt": ["Date"],
          });
        }
        const item = makeItem();
        return trpcResult([item], {
          "0.createdAt": ["Date"],
          "0.updatedAt": ["Date"],
        });
      }
      if (name === "items.inboxCount") {
        return trpcResult(0);
      }
      if (name === "locations.list") {
        return trpcResult([]);
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

    await page.goto("/gallery");

    await expect(page.getByTestId("gallery-grid")).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId("gallery-item-processing")).toBeVisible();
    await expect(page.getByTestId("gallery-item")).toHaveCount(0);

    processingComplete = true;

    await expect(page.getByTestId("gallery-item")).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId("gallery-item-processing")).toHaveCount(0);

    const img = page.getByTestId("gallery-item").locator("img");
    const src = await img.getAttribute("src");
    const srcset = await img.getAttribute("srcset");
    const imageRef = src ?? srcset ?? "";
    expect(imageRef).toContain("e_background_removal");

    await expect(page.getByTestId("item-label")).toHaveText("Toy Train");
  });
});
