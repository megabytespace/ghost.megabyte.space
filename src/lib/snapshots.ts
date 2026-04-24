import { getSiteUrl } from "./config";
import { ApiError } from "./errors";
import type { Env, HistoryWindow, SnapshotRecord } from "../types";

function requireSnapshotDb(env: Env): D1Database {
  if (!env.EMF_DB) {
    throw new ApiError(
      "Serverless snapshot storage is not configured. Bind EMF_DB to enable exports and reproducible random numbers.",
      503,
      "SNAPSHOT_STORAGE_UNAVAILABLE",
    );
  }

  return env.EMF_DB;
}

function escapeCsvCell(value: string | number | null): string {
  if (value === null) {
    return "";
  }

  const text = String(value);
  if (text.includes('"') || text.includes(",") || text.includes("\n") || text.includes("\r")) {
    return `"${text.replaceAll('"', '""')}"`;
  }

  return text;
}

function escapeXml(value: string | number | null): string {
  if (value === null) {
    return "";
  }

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export async function fetchSnapshotRecords(env: Env, window: HistoryWindow): Promise<SnapshotRecord[]> {
  const db = requireSnapshotDb(env);
  const result = await db
    .prepare(
      `
        SELECT
          entity_id AS entityId,
          state,
          numeric_value AS numericValue,
          unit,
          last_changed AS lastChanged,
          last_updated AS lastUpdated,
          sampled_at AS sampledAt,
          source
        FROM emf_snapshots
        WHERE entity_id = ?1
          AND sampled_at >= ?2
          AND sampled_at <= ?3
        ORDER BY sampled_at ASC
      `,
    )
    .bind(env.EMF_SENSOR_ENTITY_ID, window.start, window.end)
    .all<SnapshotRecord>();

  return (result.results ?? []).map((row) => ({
    entityId: row.entityId,
    state: row.state,
    numericValue: row.numericValue,
    unit: row.unit ?? null,
    lastChanged: row.lastChanged,
    lastUpdated: row.lastUpdated,
    sampledAt: row.sampledAt,
    source: row.source,
  }));
}

export function buildSnapshotCsv(records: SnapshotRecord[]): string {
  const header = [
    "entity_id",
    "state",
    "numeric_value",
    "unit",
    "last_changed",
    "last_updated",
    "sampled_at",
    "source",
  ];

  const rows = records.map((record) =>
    [
      record.entityId,
      record.state,
      record.numericValue,
      record.unit,
      record.lastChanged,
      record.lastUpdated,
      record.sampledAt,
      record.source,
    ]
      .map(escapeCsvCell)
      .join(","),
  );

  return [header.join(","), ...rows].join("\r\n");
}

export function buildSnapshotExcel(records: SnapshotRecord[], title: string): string {
  const rows = records
    .map(
      (record) => `
      <tr>
        <td>${escapeXml(record.entityId)}</td>
        <td>${escapeXml(record.state)}</td>
        <td>${escapeXml(record.numericValue)}</td>
        <td>${escapeXml(record.unit)}</td>
        <td>${escapeXml(record.lastChanged)}</td>
        <td>${escapeXml(record.lastUpdated)}</td>
        <td>${escapeXml(record.sampledAt)}</td>
        <td>${escapeXml(record.source)}</td>
      </tr>`,
    )
    .join("");

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeXml(title)}</title>
  </head>
  <body>
    <table border="1">
      <thead>
        <tr>
          <th>entity_id</th>
          <th>state</th>
          <th>numeric_value</th>
          <th>unit</th>
          <th>last_changed</th>
          <th>last_updated</th>
          <th>sampled_at</th>
          <th>source</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </body>
</html>`;
}

export function buildSnapshotFilename(window: HistoryWindow, format: "csv" | "excel"): string {
  const start = window.start.replaceAll(/[:.]/g, "-");
  const end = window.end.replaceAll(/[:.]/g, "-");
  return format === "csv" ? `ghost-emf-${start}-to-${end}.csv` : `ghost-emf-${start}-to-${end}.xls`;
}

export function buildSnapshotExportUrl(env: Env, window: HistoryWindow, format: "csv" | "excel" = "csv"): string {
  const url = new URL("/api/v1/ghost-emf/export", getSiteUrl(env));
  url.searchParams.set("start", window.start);
  url.searchParams.set("end", window.end);
  url.searchParams.set("format", format);
  return url.toString();
}

export function buildGoogleSheetsFormula(env: Env, window: HistoryWindow): string {
  return `=IMPORTDATA("${buildSnapshotExportUrl(env, window, "csv")}")`;
}

export async function deriveSnapshotRandom(
  records: SnapshotRecord[],
  window: HistoryWindow,
  digits: number,
): Promise<{
  digits: number;
  randomNumber: string;
  randomUint32: number;
  randomHex: string;
  seedHash: string;
  sampleCount: number;
  start: string;
  end: string;
  derivedAt: string;
}> {
  if (records.length === 0) {
    throw new ApiError("No snapshot rows exist for the selected range.", 404, "SNAPSHOT_EMPTY", window);
  }

  const encoder = new TextEncoder();
  const serialized = records
    .map((record) => `${record.sampledAt}|${record.numericValue}|${record.state}|${record.lastUpdated}`)
    .join("\n");
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(serialized)));
  const seedHash = Array.from(digest)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  let seedBigInt = 0n;
  for (const byte of digest.subarray(0, 8)) {
    seedBigInt = (seedBigInt << 8n) + BigInt(byte);
  }

  const normalizedDigits = Math.min(18, Math.max(1, digits));
  const modulus = 10n ** BigInt(normalizedDigits);
  const randomNumber = (seedBigInt % modulus).toString().padStart(normalizedDigits, "0");
  const randomUint32 =
    ((digest[0] ?? 0) << 24) | ((digest[1] ?? 0) << 16) | ((digest[2] ?? 0) << 8) | (digest[3] ?? 0);

  return {
    digits: normalizedDigits,
    randomNumber,
    randomUint32: randomUint32 >>> 0,
    randomHex: `0x${seedHash.slice(0, 16)}`,
    seedHash,
    sampleCount: records.length,
    start: window.start,
    end: window.end,
    derivedAt: new Date().toISOString(),
  };
}
