import { test, expect } from "@playwright/test";

test.describe("Settings", () => {
  test("settings categories switch content", async ({ page }) => {
    await page.goto("/settings");

    // Account category is active by default, Profile sub-category
    await expect(page.locator("text=Manage your shared identity and profile")).toBeVisible();

    // Click General category → Compose sub-category
    await page.locator("button:has-text('General')").first().click();
    await expect(page.locator("text=Control how new posts and drafts behave")).toBeVisible();

    // Click Post category → Compose & replies sub-category
    await page.locator("button:has-text('Post')").first().click();
    await expect(page.locator("text=Control how new posts, replies and drafts behave")).toBeVisible();

    // Click Notifications category
    await page.locator("button:has-text('Notifications')").first().click();
    await expect(page.locator("text=Choose what appears in the suite notification centre")).toBeVisible();

    // Click Privacy & security category
    await page.locator("button:has-text('Privacy & security')").first().click();
    await expect(page.locator("text=Encryption, metadata exposure and local data controls")).toBeVisible();
  });
});
