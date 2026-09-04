import { expect, test } from "@playwright/test";

test("the root route lands on a usable sign-in page", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveURL(/\/auth\/sign-in/);
  await expect(page.getByRole("heading", { name: "Sign In" })).toBeVisible();
  // The email form is the primary sign-in path and must render regardless of
  // which providers the server has configured.
  await expect(page.getByLabel("Email address")).toBeVisible();
});
