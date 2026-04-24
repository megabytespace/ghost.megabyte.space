import { test, expect, devices } from "@playwright/test";
import {
  SEEDED_CUSTOM_RANGE,
  SEEDED_FULL_RANGE,
  countCsvRows,
  getJson,
  gotoHome,
  isoToLocalInput,
  readDownload,
  seedSnapshots,
  waitForHomepageReady,
} from "./helpers.js";

test.beforeEach(async ({ request }) => {
  await seedSnapshots(request, SEEDED_FULL_RANGE);
});

test.describe("mobile", () => {
  test.use({ ...devices["iPhone 13"] });

  test("mobile viewport flow keeps nav, range controls, exports, and docs usable", async ({ page }) => {
    await gotoHome(page, SEEDED_CUSTOM_RANGE);

    await expect(page.locator(".site-nav")).toBeVisible();
    await page.getByRole("button", { name: "7 days" }).click();
    await expect(page).toHaveURL(/range=7d/);
    await expect(page.locator("#snapshot-json-link")).toBeVisible();
    await page.getByRole("link", { name: "Docs" }).click();
    await expect(page).toHaveURL(/\/docs$/);
    await expect(page.locator("main")).toContainText("Build on the ghost EMF feed.");
  });
});

test("keyboard-driven flow covers skip link, nav, preset buttons, custom range submission, and docs navigation", async ({ page }) => {
  await gotoHome(page, SEEDED_CUSTOM_RANGE);

  await page.keyboard.press("Tab");
  await expect(page.locator(".skip-link")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main$/);

  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/range=7d/);

  await page.locator("#history-start").focus();
  await page.locator("#history-start").fill(isoToLocalInput(SEEDED_CUSTOM_RANGE.start));
  await page.locator("#history-end").fill(isoToLocalInput(SEEDED_CUSTOM_RANGE.end));
  await page.getByRole("button", { name: "Apply range" }).press("Enter");
  await expect(page.locator("#chart-meta")).toContainText("visible points");

  await page.getByRole("link", { name: "Docs" }).press("Enter");
  await expect(page).toHaveURL(/\/docs$/);
});

test("web property flow validates manifest, robots, humans, security.txt, sitemap, and homepage/docs cross-links", async ({ page, request }) => {
  await page.goto("/");
  await expect(page.locator("head link[rel='manifest']")).toHaveAttribute("href", "/site.webmanifest");

  const manifest = await getJson(request, "/site.webmanifest");
  expect(manifest.name).toBe("ghost.megabyte.space");
  expect(manifest.shortcuts).toHaveLength(2);

  const robots = await request.get("/robots.txt");
  expect(robots.ok()).toBeTruthy();
  await expect(await robots.text()).toContain("Sitemap");

  const humans = await request.get("/humans.txt");
  expect(humans.ok()).toBeTruthy();
  await expect(await humans.text()).toContain("Megabyte");

  const security = await request.get("/.well-known/security.txt");
  expect(security.ok()).toBeTruthy();
  await expect(await security.text()).toContain("Contact");

  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.ok()).toBeTruthy();
  await expect(await sitemap.text()).toContain("/docs");

  await page.getByRole("link", { name: "Docs" }).click();
  await expect(page.getByRole("link", { name: "Back to the live site" })).toBeVisible();
});

test("future-ready dataset audit flow verifies snapshot json, CSV export, Excel export, sheets formula, and reproducible random number agree on one range", async ({ page, request }) => {
  await gotoHome(page, SEEDED_CUSTOM_RANGE);

  const query = `start=${encodeURIComponent(SEEDED_CUSTOM_RANGE.start)}&end=${encodeURIComponent(SEEDED_CUSTOM_RANGE.end)}`;
  const snapshot = await getJson(request, `/api/v1/ghost-emf/snapshot?${query}`);
  const sheets = await getJson(request, `/api/v1/ghost-emf/google-sheets?${query}`);
  const randomA = await getJson(request, `/api/v1/ghost-emf/random?${query}&digits=12`);
  const randomB = await getJson(request, `/api/v1/ghost-emf/random?${query}&digits=12`);

  expect(randomA.randomNumber).toBe(randomB.randomNumber);
  expect(randomA.sampleCount).toBe(snapshot.sampleCount);
  expect(sheets.importDataFormula).toContain("/api/v1/ghost-emf/export");

  const csvResponse = await request.get(`/api/v1/ghost-emf/export?${query}&format=csv`);
  expect(csvResponse.ok()).toBeTruthy();
  const csvText = await csvResponse.text();
  expect(countCsvRows(csvText)).toBe(snapshot.sampleCount + 1);

  const excelResponse = await request.get(`/api/v1/ghost-emf/export?${query}&format=excel`);
  expect(excelResponse.ok()).toBeTruthy();
  const excelText = await excelResponse.text();
  expect(excelText).toContain("<table");
  expect(excelText).toContain(snapshot.points[0].sampledAt);
});
