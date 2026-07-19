import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("app loads and shows login page without identity", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Log in to Post")).toBeVisible();
  });

  test("app redirects to inbox with seeded identity", async ({ page, context }) => {
    // Use addInitScript to set localStorage before any page JS runs
    await context.addInitScript(() => {
      const identity = JSON.stringify({
        npub: "npub1test…abcd",
        nsec: null,
        pubkey: "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
        nip05: null,
        nip05Verified: false,
        profile: null,
      });
      localStorage.setItem("nostr-identity", identity);
    });

    await page.goto("/");
    await expect(page).toHaveURL(/\/mail\/inbox/, { timeout: 10000 });
    await expect(page.getByRole("heading", { name: "N Mail" })).toBeVisible();
  });

  test("icon dock is visible", async ({ page }) => {
    await page.goto("/mail/inbox");
    await expect(page.getByRole("button", { name: "N" })).toBeVisible();
    await expect(page.getByRole("button", { name: "M" })).toBeVisible();
  });

  test("sidebar shows mailbox items", async ({ page }) => {
    await page.goto("/mail/inbox");
    const mailboxLabels = ["Inbox", "Starred", "Snoozed", "Sent", "Drafts", "Archive", "Spam"];
    for (const label of mailboxLabels) {
      await expect(page.getByRole("link", { name: label })).toBeVisible();
    }
  });

  test("clicking Starred navigates to /mail/starred", async ({ page }) => {
    await page.goto("/mail/inbox");
    await page.getByRole("link", { name: "Starred" }).click();
    await expect(page).toHaveURL(/\/mail\/starred/);
    await expect(page.getByRole("heading", { name: "Starred" })).toBeVisible();
  });

  test("compose button opens modal", async ({ page }) => {
    await page.goto("/mail/inbox");
    await page.getByRole("link", { name: "Compose" }).click();
    await expect(page).toHaveURL(/compose=true/);
    await expect(page.getByText("New message", { exact: true })).toBeVisible();
  });

  test("contacts page loads", async ({ page }) => {
    await page.goto("/contacts");
    await expect(page.getByRole("heading", { name: "Contacts" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Overview" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Following" })).toBeVisible();
  });

  test("drive page loads", async ({ page }) => {
    await page.goto("/drive");
    await expect(page.getByRole("heading", { name: "Drive" })).toBeVisible();
  });

  test("settings page loads", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
    await expect(page.getByRole("button", { name: "General" }).first()).toBeVisible();
  });
});

test.describe("Message list", () => {
  test("inbox shows empty state when no messages", async ({ page }) => {
    await page.goto("/mail/inbox");
    await expect(page.getByRole("heading", { name: "Inbox" })).toBeVisible();
    await expect(page.getByText("No messages yet")).toBeVisible();
  });

  test("inbox has filter tabs and search bar", async ({ page }) => {
    await page.goto("/mail/inbox");
    await expect(page.getByRole("tablist", { name: "Filter messages" })).toBeVisible();
    await expect(page.getByPlaceholder("Search messages, people or npubs")).toBeVisible();
  });
});
