import { test, expect } from "@playwright/test";

test.describe("Settings", () => {
  test("settings tabs switch content", async ({ page }) => {
    await page.goto("/settings");

    // General tab is active by default
    await expect(page.locator("text=Core behaviour for Post")).toBeVisible();

    // Click Identity tab
    await page.locator("button:has-text('Identity')").click();
    await expect(page.locator("text=Manage your Nostr identity")).toBeVisible();

    // Click Relays tab
    await page.locator("button:has-text('Relays')").click();
    await expect(page.locator("text=Control how Post discovers")).toBeVisible();

    // Click Privacy tab
    await page.locator("button:has-text('Privacy')").click();
    await expect(page.locator("text=Encryption, metadata exposure")).toBeVisible();

    // Click Notifications tab
    await page.locator("button:has-text('Notifications')").click();
    await expect(page.locator("text=Choose what appears")).toBeVisible();
  });
});
