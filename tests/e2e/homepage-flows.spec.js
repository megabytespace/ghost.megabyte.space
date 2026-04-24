import { test, expect } from "@playwright/test";
import {
  SEEDED_ALT_RANGE,
  SEEDED_CUSTOM_RANGE,
  SEEDED_FULL_RANGE,
  expectNoConsoleErrors,
  gotoHome,
  isoToLocalInput,
  seedSnapshots,
  trackConsoleErrors,
  waitForHomepageReady,
} from "./helpers.js";

test.beforeEach(async ({ request }) => {
  await seedSnapshots(request, SEEDED_FULL_RANGE);
});

test("homepage seeded flow renders live cards, timeline, snapshot tools, and random output", async ({ page }) => {
  const consoleErrors = trackConsoleErrors(page);

  await gotoHome(page, SEEDED_CUSTOM_RANGE);

  await expect(page.locator("#current-state")).toContainText("is reporting");
  await expect(page.locator("#history-chart")).toBeVisible();
  await expect(page.locator("#timeline-annotations")).toContainText("USB bridge online");
  await expect(page.locator("#story-milestones")).toContainText("AVATAR MUD");
  await expect(page.locator("#snapshot-storage-note")).toContainText("D1 snapshots are active");
  await expect(page.locator("#random-meta")).toContainText("stored rows contributed");

  expectNoConsoleErrors(consoleErrors);
});

test("preset range buttons update URL, chart metadata, export links, and random endpoint links", async ({ page }) => {
  await gotoHome(page, SEEDED_CUSTOM_RANGE);

  await page.getByRole("button", { name: "7 days" }).click();
  await expect(page).toHaveURL(/range=7d/);
  await expect(page.locator("#export-csv-link")).toHaveAttribute("href", /start=.*end=.*format=csv/);

  await page.getByRole("button", { name: "30 days" }).click();
  await expect(page).toHaveURL(/range=30d/);
  await expect(page.locator("#random-json-link")).toHaveAttribute("href", /\/api\/v1\/ghost-emf\/random\?/);

  await page.getByRole("button", { name: "All history" }).click();
  await expect(page).toHaveURL(/range=all/);
  await expect(page.locator("#chart-meta")).toContainText("retained samples");
});

test("custom range form updates chart, sheets formula, and the page URL", async ({ page }) => {
  await gotoHome(page, SEEDED_CUSTOM_RANGE);

  await page.locator("#history-start").fill(isoToLocalInput(SEEDED_ALT_RANGE.start));
  await page.locator("#history-end").fill(isoToLocalInput(SEEDED_ALT_RANGE.end));
  await page.getByRole("button", { name: "Apply range" }).click();

  await expect(page).toHaveURL(/start=.*end=.*/);
  await expect(page.locator("#chart-meta")).toContainText("visible points");
  await expect(page.locator("#sheets-formula")).toContainText(encodeURIComponent ? "IMPORTDATA" : "IMPORTDATA");
  await expect(page.locator("#snapshot-json-link")).toHaveAttribute("href", /start=.*end=.*/);
});

test("share-link and sheets-formula copy actions work from the same session", async ({ browser }) => {
  const context = await browser.newContext({
    baseURL: "http://127.0.0.1:8787",
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const page = await context.newPage();

  await gotoHome(page, SEEDED_CUSTOM_RANGE);

  await page.getByRole("button", { name: "Copy Range Link" }).click();
  await expect(page.locator("#copy-range-status")).toContainText("copied");
  const copiedRangeUrl = await page.evaluate(() => navigator.clipboard.readText());
  expect(copiedRangeUrl).toContain("start=");
  expect(copiedRangeUrl).toContain("end=");

  await page.getByRole("button", { name: "Copy Sheets Formula" }).click();
  await expect(page.locator("#copy-sheets-status")).toContainText("copied");
  const copiedFormula = await page.evaluate(() => navigator.clipboard.readText());
  expect(copiedFormula.startsWith("=IMPORTDATA(")).toBeTruthy();

  await context.close();
});

test("deep-linked custom range restores exact state after reload and in a second page", async ({ browser, page }) => {
  await gotoHome(page, SEEDED_ALT_RANGE);

  const sharedUrl = page.url();
  await page.reload();
  await waitForHomepageReady(page);
  await expect(page.locator("#history-start")).toHaveValue(isoToLocalInput(SEEDED_ALT_RANGE.start));
  await expect(page.locator("#history-end")).toHaveValue(isoToLocalInput(SEEDED_ALT_RANGE.end));

  const secondContext = await browser.newContext({ baseURL: "http://127.0.0.1:8787" });
  const secondPage = await secondContext.newPage();
  await secondPage.goto(sharedUrl);
  await waitForHomepageReady(secondPage);
  await expect(secondPage.locator("#history-start")).toHaveValue(isoToLocalInput(SEEDED_ALT_RANGE.start));
  await expect(secondPage.locator("#history-end")).toHaveValue(isoToLocalInput(SEEDED_ALT_RANGE.end));
  await secondContext.close();
});
