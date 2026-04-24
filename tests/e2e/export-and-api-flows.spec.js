import { test, expect } from "@playwright/test";
import {
  SEEDED_CUSTOM_RANGE,
  SEEDED_FULL_RANGE,
  countCsvRows,
  expectNoConsoleErrors,
  getJson,
  gotoHome,
  readDownload,
  resetSnapshots,
  seedSnapshots,
  trackConsoleErrors,
} from "./helpers.js";

test.beforeEach(async ({ request }) => {
  await seedSnapshots(request, SEEDED_FULL_RANGE);
});

test("CSV and Excel downloads from homepage match snapshot API rows", async ({ page, request }) => {
  await gotoHome(page, SEEDED_CUSTOM_RANGE);
  const snapshot = await getJson(request, `/api/v1/ghost-emf/snapshot?start=${encodeURIComponent(SEEDED_CUSTOM_RANGE.start)}&end=${encodeURIComponent(SEEDED_CUSTOM_RANGE.end)}`);

  const csvDownloadPromise = page.waitForEvent("download");
  await page.locator("#export-csv-link").click();
  const csvDownload = await csvDownloadPromise;
  const csvText = await readDownload(csvDownload);
  expect(csvText).toContain("entity_id,state,numeric_value");
  expect(countCsvRows(csvText)).toBe(snapshot.sampleCount + 1);

  const excelDownloadPromise = page.waitForEvent("download");
  await page.locator("#export-excel-link").click();
  const excelDownload = await excelDownloadPromise;
  const excelText = await readDownload(excelDownload);
  expect(excelText).toContain("<table");
  expect(excelText).toContain("numeric_value");
});

test("docs to swagger to raw openapi flow exposes current, snapshot, export, sheets, and random endpoints", async ({ page, request }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Docs" }).click();
  await expect(page).toHaveURL(/\/docs$/);
  await expect(page.locator("main")).toContainText("/api/v1/ghost-emf/snapshot");
  await expect(page.locator("main")).toContainText("/api/v1/ghost-emf/export");
  await expect(page.locator("main")).toContainText("/api/v1/ghost-emf/random");

  await page.getByRole("link", { name: "OpenAPI" }).click();
  await expect(page).toHaveURL(/\/api\/docs$/);
  await expect(page.locator("body")).toContainText("ghost.megabyte.space API");

  const openapi = await getJson(request, "/api/v1/openapi.json");
  expect(Object.keys(openapi.paths)).toEqual(
    expect.arrayContaining([
      "/api/v1/ghost-emf/current",
      "/api/v1/ghost-emf/snapshot",
      "/api/v1/ghost-emf/export",
      "/api/v1/ghost-emf/google-sheets",
      "/api/v1/ghost-emf/random",
    ]),
  );
});

test("google-sheets and random endpoints stay consistent with the selected snapshot range", async ({ page, request }) => {
  const consoleErrors = trackConsoleErrors(page);
  await gotoHome(page, SEEDED_CUSTOM_RANGE);

  const query = `start=${encodeURIComponent(SEEDED_CUSTOM_RANGE.start)}&end=${encodeURIComponent(SEEDED_CUSTOM_RANGE.end)}`;
  const sheets = await getJson(request, `/api/v1/ghost-emf/google-sheets?${query}`);
  const random = await getJson(request, `/api/v1/ghost-emf/random?${query}&digits=10`);
  const snapshot = await getJson(request, `/api/v1/ghost-emf/snapshot?${query}`);

  expect(sheets.csvUrl).toContain("/api/v1/ghost-emf/export");
  expect(sheets.importDataFormula).toContain(sheets.csvUrl);
  expect(random.sampleCount).toBe(snapshot.sampleCount);
  expect(random.randomNumber).toHaveLength(10);
  await expect(page.locator("#random-number")).toHaveText(random.randomNumber);

  expectNoConsoleErrors(consoleErrors);
});

test("cron-backed D1 flow uses __scheduled to populate rows after reset and surfaces through homepage utilities", async ({ page, request }) => {
  await resetSnapshots(request);

  const scheduledOne = await request.get("/__scheduled");
  expect(scheduledOne.ok()).toBeTruthy();
  const scheduledTwo = await request.get("/__scheduled");
  expect(scheduledTwo.ok()).toBeTruthy();
  const scheduledThree = await request.get("/__scheduled");
  expect(scheduledThree.ok()).toBeTruthy();

  await page.goto("/");
  await expect(page.locator("#snapshot-storage-note")).toContainText("D1 snapshots are active");
  await expect(page.locator("#random-meta")).toContainText("stored rows contributed");

  const snapshot = await getJson(request, "/api/v1/ghost-emf/snapshot?minutes=1440");
  expect(snapshot.sampleCount).toBeGreaterThan(0);
});

test("invalid API validation followed by corrected homepage range recovers the session", async ({ page, request }) => {
  const invalid = await request.get("/api/v1/ghost-emf/history?start=2026-04-10T08:00:00.000Z&end=2026-04-10T02:00:00.000Z");
  expect(invalid.status()).toBe(400);
  const invalidJson = await invalid.json();
  expect(invalidJson.code).toBe("VALIDATION_ERROR");

  await gotoHome(page, SEEDED_CUSTOM_RANGE);
  await page.locator("#history-start").fill("2026-04-10T08:00");
  await page.locator("#history-end").fill("2026-04-10T02:00");
  await page.getByRole("button", { name: "Apply range" }).click();
  await expect(page.locator("#chart-meta")).toContainText("Choose a valid start time");

  await page.locator("#history-start").fill("2026-04-10T02:00");
  await page.locator("#history-end").fill("2026-04-10T08:00");
  await page.getByRole("button", { name: "Apply range" }).click();
  await expect(page.locator("#chart-meta")).toContainText("visible points");
  await expect(page.locator("#random-number")).not.toHaveText("--");
});
