import { test, expect } from "@playwright/test";

test.describe("Contacts", () => {
  test("contacts overview shows stats", async ({ page }) => {
    await page.goto("/contacts");
    await expect(page.locator("text=328")).toBeVisible();
    await expect(page.locator("text=Following")).toBeVisible();
    await expect(page.locator("text=Muted")).toBeVisible();
    await expect(page.locator("text=Blocked")).toBeVisible();
  });

  test("contacts list shows names", async ({ page }) => {
    await page.goto("/contacts");
    await expect(page.locator("text=Alice Nguyen")).toBeVisible();
    await expect(page.locator("text=Jonas Berg")).toBeVisible();
  });

  test("clicking contact shows profile detail", async ({ page }) => {
    await page.goto("/contacts");
    await page.locator("text=Alice Nguyen").click();
    await expect(page.locator("text=@alice")).toBeVisible();
    await expect(page.locator("text=Back to contacts")).toBeVisible();
  });
});
