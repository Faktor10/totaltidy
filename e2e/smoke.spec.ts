import { expect, test } from "@playwright/test";

test("homepage renders the app title", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "TotalTidy" })).toBeVisible();
});
