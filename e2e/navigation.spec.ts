import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("app loads and redirects to inbox", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/mail\/inbox/);
    await expect(page.locator("text=N Mail")).toBeVisible();
  });

  test("icon dock is visible", async ({ page }) => {
    await page.goto("/mail/inbox");
    await expect(page.locator("text=N").first()).toBeVisible();
    await expect(page.locator("text=M")).toBeVisible();
  });

  test("sidebar shows mailbox items", async ({ page }) => {
    await page.goto("/mail/inbox");
    await expect(page.locator("text=Inbox")).toBeVisible();
    await expect(page.locator("text=Starred")).toBeVisible();
    await expect(page.locator("text=Sent")).toBeVisible();
    await expect(page.locator("text=Drafts")).toBeVisible();
    await expect(page.locator("text=Archive")).toBeVisible();
    await expect(page.locator("text=Spam")).toBeVisible();
  });

  test("clicking Starred navigates to /mail/starred", async ({ page }) => {
    await page.goto("/mail/inbox");
    await page.locator("a[href='/mail/starred']").click();
    await expect(page).toHaveURL(/\/mail\/starred/);
    await expect(page.locator("text=Starred")).toBeVisible();
  });

  test("compose button opens modal", async ({ page }) => {
    await page.goto("/mail/inbox");
    await page.locator("a[href*='compose=true']").click();
    await expect(page).toHaveURL(/compose=true/);
    await expect(page.locator("text=New message")).toBeVisible();
  });

  test("contacts page loads", async ({ page }) => {
    await page.goto("/contacts");
    await expect(page.locator("text=Contacts")).toBeVisible();
    await expect(page.locator("text=Overview")).toBeVisible();
    await expect(page.locator("text=Following")).toBeVisible();
  });

  test("settings page loads", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.locator("text=Settings")).toBeVisible();
    await expect(page.locator("text=General")).toBeVisible();
    await expect(page.locator("text=Relays")).toBeVisible();
  });
});

test.describe("Message list", () => {
  test("inbox shows message rows", async ({ page }) => {
    await page.goto("/mail/inbox");
    await expect(page.locator("text=Inbox")).toBeVisible();
    // Should show mock messages
    await expect(page.locator("text=Alice").first()).toBeVisible();
  });

  test("clicking message opens reading pane", async ({ page }) => {
    await page.goto("/mail/inbox");
    const firstSender = page.locator("text=Alice").first();
    await firstSender.click();
    await expect(page).toHaveURL(/c=/);
  });
});
