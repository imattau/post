import { test, expect } from "@playwright/test";

test.describe("Contacts", () => {
  test("contacts overview shows stat labels", async ({ page }) => {
    await page.goto("/contacts");
    // Stat labels are always visible (values are dynamic)
    await expect(page.getByText("Following").first()).toBeVisible();
    await expect(page.getByText("Muted").first()).toBeVisible();
    await expect(page.getByText("Blocked").first()).toBeVisible();
  });

  test("contacts list shows names", async ({ page }) => {
    await page.goto("/contacts");
    await expect(page.getByText("Alice Nguyen")).toBeVisible();
    await expect(page.getByText("Jonas Berg")).toBeVisible();
  });

  test("clicking contact shows profile detail", async ({ page }) => {
    await page.goto("/contacts");
    await page.getByText("Alice Nguyen").click();
    await expect(page.getByText("@alice")).toBeVisible();
    await expect(page.getByText("Back to contacts")).toBeVisible();
  });
});
