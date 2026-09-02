import { expect, test } from "@playwright/test";

test.describe("unauthenticated user redirect", () => {
  test("redirects /dashboard to sign-in page", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(page).toHaveURL(/\/auth\/sign-in/);
    await expect(page.getByRole("heading", { name: "Sign In" })).toBeVisible();
  });

  test("redirects /inbox to sign-in page", async ({ page }) => {
    await page.goto("/inbox");

    await expect(page).toHaveURL(/\/auth\/sign-in/);
  });

  test("redirects /gallery to sign-in page", async ({ page }) => {
    await page.goto("/gallery");

    await expect(page).toHaveURL(/\/auth\/sign-in/);
  });

  test("includes callbackUrl in redirect", async ({ page }) => {
    await page.goto("/dashboard");

    // The guard redirects from the client once the session check resolves,
    // so wait for the redirect before reading the query string.
    await expect(page).toHaveURL(/\/auth\/sign-in/);

    const url = new URL(page.url());
    expect(url.searchParams.get("callbackUrl")).toBe("/dashboard");
  });

  test("does not redirect the public homepage", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveURL("http://localhost:3000/");
    await expect(page.getByRole("heading", { name: "TotalTidy" })).toBeVisible();
  });
});
