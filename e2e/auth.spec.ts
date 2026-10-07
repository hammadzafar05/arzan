import { expect, type Page, test } from "@playwright/test";

// Sign-up and sign-in are rate limited per IP (5 a minute). Locally every test comes from 127.0.0.1,
// so give each test its own address. (In production Cloudflare overwrites cf-connecting-ip with the
// real client IP, so this header can't be used to dodge the limiter there.)
// Any Content-Security-Policy violation or uncaught error fails the test.
const problems = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const list: string[] = [];
  problems.set(page, list);
  page.on("console", (m) => {
    if (/Content Security Policy|Refused to/i.test(m.text())) list.push(m.text());
  });
  page.on("pageerror", (e) => list.push(e.message));
});
test.afterEach(async ({ page }) => {
  expect(problems.get(page) ?? []).toEqual([]);
});

test.beforeEach(async ({ context }) => {
  const octet = () => Math.floor(Math.random() * 250) + 1;
  await context.setExtraHTTPHeaders({ "cf-connecting-ip": `10.${octet()}.${octet()}.${octet()}` });
});

const uniqueEmail = () => `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;

async function register(page: Page, email: string, password = "password123") {
  await page.goto("/register");
  await page.getByLabel("Name").fill("Ada Lovelace");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
}

async function openUserMenu(page: Page) {
  // On phones the user menu lives in the slide-out navigation.
  const menu = page.getByRole("button", { name: "Open menu" });
  if (await menu.isVisible()) await menu.click();
  await page.getByRole("button", { name: "Open user menu" }).click();
}

test("signed-out visitors are sent to log in, then back where they were", async ({ page }) => {
  const email = uniqueEmail();
  await register(page, email);
  await openUserMenu(page);
  await page.getByRole("menuitem", { name: "Log out" }).click();
  await expect(page).toHaveURL(/\/$/);

  await page.goto("/settings/password");
  await expect(page).toHaveURL(/\/login\?redirect=/);
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/settings\/password$/);
});

test("register, see the dashboard, update the profile", async ({ page }) => {
  await register(page, uniqueEmail());
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByText("Welcome, Ada!")).toBeVisible();
  await expect(page.getByText("Please verify your email address")).toBeVisible();

  await page.goto("/settings/profile");
  await page.getByLabel("Name").fill("Ada King");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("Profile saved")).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Name")).toHaveValue("Ada King");
});

test("wrong password shows an error; change password works", async ({ page }) => {
  const email = uniqueEmail();
  await register(page, email);

  await page.goto("/settings/password");
  await page.getByLabel("Current password").fill("not-my-password");
  await page.getByLabel("New password").fill("new-password-1");
  await page.getByLabel("Confirm password").fill("new-password-1");
  await page.getByRole("button", { name: "Save password" }).click();
  await expect(page.getByText("That's not your current password.")).toBeVisible();

  await page.getByLabel("Current password").fill("password123");
  await page.getByRole("button", { name: "Save password" }).click();
  await expect(page.getByText("Password updated")).toBeVisible();
});

test("appearance switches to dark mode and remembers it", async ({ page }) => {
  await register(page, uniqueEmail());
  await page.goto("/settings/appearance");
  await page.getByText("Dark", { exact: true }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
});

test("delete account asks for the password", async ({ page }) => {
  const email = uniqueEmail();
  await register(page, email);
  await page.goto("/settings/profile");
  await page.getByRole("button", { name: "Delete account" }).click();
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("dialog").getByRole("button", { name: "Delete account" }).click();
  await expect(page).toHaveURL(/\/$/);

  await page.goto("/login");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByText(/invalid email or password/i)).toBeVisible();
});
