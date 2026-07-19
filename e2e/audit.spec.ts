import { test, expect, type Page } from "@playwright/test";

const ALL_ROUTES = [
  "/",
  "/mail/inbox",
  "/mail/starred",
  "/mail/snoozed",
  "/mail/sent",
  "/mail/drafts",
  "/mail/archive",
  "/mail/spam",
  "/contacts",
  "/settings",
  "/drive",
  "/calendar",
  "/calendar/week",
  "/calendar/agenda",
  "/coming-soon",
];

const MAILBOX_ROUTES = [
  "/mail/inbox",
  "/mail/starred",
  "/mail/snoozed",
  "/mail/sent",
  "/mail/drafts",
  "/mail/archive",
  "/mail/spam",
];

test.describe("Audit: Page loads & routing", () => {
  for (const route of ALL_ROUTES) {
    test(`${route} loads without 404`, async ({ page }) => {
      const response = await page.goto(route, { waitUntil: "networkidle" });
      expect(response?.status()).not.toBe(404);
    });
  }
});

test.describe("Audit: Console errors on all routes", () => {
  for (const route of ALL_ROUTES) {
    test(`${route} - no page exceptions`, async ({ page }) => {
      const pageErrors: string[] = [];
      page.on("pageerror", (err) => pageErrors.push(err.message));
      await page.goto(route, { waitUntil: "networkidle" });
      await page.waitForTimeout(500);
      expect(pageErrors, `Unhandled page exceptions on ${route}`).toEqual([]);
    });
  }
});

test.describe("Audit: Main mail layout (3-pane grid)", () => {
  test("mail page has correct 3-column grid layout", async ({ page }) => {
    await page.goto("/mail/inbox", { waitUntil: "networkidle" });

    const mailGrid = page.locator('div.grid.grid-cols-\\[248px_448px_1fr\\]');
    await expect(mailGrid).toBeVisible({ timeout: 10000 });

    const dock = page.locator("div.w-\\[72px\\].bg-dock");
    await expect(dock).toBeVisible();

    const sidebar = page.locator("div.bg-sidebar");
    await expect(sidebar.first()).toBeVisible();
  });
});

test.describe("Audit: Icon Dock", () => {
  test("dock has correct structure and elements", async ({ page }) => {
    await page.goto("/mail/inbox", { waitUntil: "networkidle" });

    // Logo N
    await expect(page.locator("text=N").first()).toBeVisible();

    // Active app (M for Post)
    await expect(page.getByRole("button", { name: "M" })).toBeVisible();

    // Search and Help buttons via aria-label
    await expect(page.getByRole("button", { name: "Search" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Help" })).toBeVisible();

    // Settings link
    await expect(page.getByRole("link", { name: "Settings" })).toBeVisible();
  });
});

test.describe("Audit: Sidebar (mail)", () => {
  test("sidebar has brand, compose, mailbox items", async ({ page }) => {
    await page.goto("/mail/inbox", { waitUntil: "networkidle" });

    // Brand
    await expect(page.getByRole("heading", { name: "N Mail" })).toBeVisible();

    // Compose CTA
    await expect(page.getByRole("link", { name: "Compose" })).toBeVisible();

    // Mailbox links
    const mailboxLabels = ["Inbox", "Starred", "Snoozed", "Sent", "Drafts", "Archive", "Spam"];
    for (const label of mailboxLabels) {
      await expect(page.getByRole("link", { name: label })).toBeVisible();
    }
  });
});

test.describe("Audit: Message list panel", () => {
  test("inbox shows filter tabs and search bar", async ({ page }) => {
    await page.goto("/mail/inbox", { waitUntil: "networkidle" });

    // Filter tabs
    const filterTabs = page.getByRole("tablist", { name: "Filter messages" });
    await expect(filterTabs).toBeVisible();
    await expect(page.getByRole("tab", { name: "Primary" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Unread" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Starred" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Attachments" })).toBeVisible();

    // Search input
    await expect(page.getByPlaceholder("Search messages, people or npubs")).toBeVisible();

    // Title
    await expect(page.getByRole("heading", { name: /^Inbox$/ })).toBeVisible();
  });

  test("inbox shows empty state when no messages", async ({ page }) => {
    await page.goto("/mail/inbox", { waitUntil: "networkidle" });
    await expect(page.getByText("No messages yet")).toBeVisible();
    await expect(page.getByText("Start by composing a new message.")).toBeVisible();
  });
});

test.describe("Audit: Reading pane", () => {
  test("empty reading pane shows placeholder", async ({ page }) => {
    await page.goto("/mail/inbox", { waitUntil: "networkidle" });
    await expect(page.getByText("Select a message to read")).toBeVisible();
  });
});

test.describe("Audit: All mailboxes", () => {
  for (const route of MAILBOX_ROUTES) {
    test(`${route} shows correct structure`, async ({ page }) => {
      await page.goto(route, { waitUntil: "networkidle" });

      // Expect a heading matching the mailbox name (e.g., "Starred", "Drafts")
      const mailboxName = route.split("/").pop()!;
      const capitalized = mailboxName.charAt(0).toUpperCase() + mailboxName.slice(1);
      await expect(page.getByRole("heading", { name: new RegExp(`^${capitalized}$`) })).toBeVisible({ timeout: 10000 });
    });
  }
});

test.describe("Audit: Contacts page", () => {
  test("contacts page shows overview and sidebar tabs", async ({ page }) => {
    await page.goto("/contacts", { waitUntil: "networkidle" });

    await expect(page.getByRole("heading", { name: "Contacts" })).toBeVisible();

    // Sidebar tabs
    const tabLabels = ["Overview", "Following", "Muted", "Blocked"];
    for (const label of tabLabels) {
      await expect(page.getByRole("button", { name: label }).first()).toBeVisible();
    }
  });

  test("contacts overview shows stats card", async ({ page }) => {
    await page.goto("/contacts", { waitUntil: "networkidle" });

    // Stat labels (values are dynamic, but labels should be present)
    await expect(page.getByText("Following").first()).toBeVisible();
    await expect(page.getByText("Muted").first()).toBeVisible();
    await expect(page.getByText("Blocked").first()).toBeVisible();
  });
});

test.describe("Audit: Settings page", () => {
  test("settings page loads with categories", async ({ page }) => {
    await page.goto("/settings", { waitUntil: "networkidle" });

    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();

    // Key categories
    const categories = [
      "Account",
      "General",
      "Post",
      "Notifications",
      "Privacy & security",
      "Relays & network",
      "Advanced",
    ];
    for (const cat of categories) {
      await expect(page.getByRole("button", { name: cat }).first()).toBeVisible();
    }
  });
});

test.describe("Audit: Layout styles", () => {
  test("landing page has correct layout", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    // Check the login button
    await expect(page.getByText("Log in to Post")).toBeVisible();
    await expect(page.getByText("Private messaging for Nostr.")).toBeVisible();
  });
});

test.describe("Audit: Compose modal", () => {
  test("compose modal opens and shows expected elements", async ({ page }) => {
    await page.goto("/mail/inbox?compose=true", { waitUntil: "networkidle" });

    await expect(page.getByText("New message", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Send", exact: true })).toBeVisible();
    // Placeholder varies: "Search contacts, NIP-05, or add npub/pubkey" when empty
    await expect(page.getByPlaceholder("Search contacts, NIP-05, or add npub/pubkey")).toBeVisible();
  });
});

test.describe("Audit: Icon dock interactions", () => {
  test("help dialog opens from dock", async ({ page }) => {
    await page.goto("/mail/inbox", { waitUntil: "networkidle" });

    await page.getByRole("button", { name: "Help" }).click();
    await expect(page.getByText("Post help")).toBeVisible();
    await expect(page.getByText("Version 0.1.0")).toBeVisible();
  });

  test("search dialog opens from dock", async ({ page }) => {
    await page.goto("/mail/inbox", { waitUntil: "networkidle" });

    await page.getByRole("button", { name: "Search" }).click();
    await expect(page.getByText("Search messages")).toBeVisible();
  });
});

test.describe("Audit: Drive page", () => {
  test("drive page loads without exceptions", async ({ page }) => {
    // Check for unhandled page exceptions (not console warnings)
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/drive", { waitUntil: "networkidle" });
    await page.waitForTimeout(500);

    expect(errors, `Page exceptions on /drive: ${errors.join(" | ")}`).toEqual([]);
  });
});

test.describe("Audit: Cross-route navigation (no dead links)", () => {
  test("sidebar link to Starred works", async ({ page }) => {
    await page.goto("/mail/inbox", { waitUntil: "networkidle" });

    await page.getByRole("link", { name: "Starred" }).click();
    await expect(page).toHaveURL(/\/mail\/starred/);
    await expect(page.getByRole("heading", { name: "Starred" })).toBeVisible();
  });
});
