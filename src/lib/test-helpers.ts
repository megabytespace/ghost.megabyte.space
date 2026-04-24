import { ApiError } from "./errors";
import { buildMockSnapshotRecords, isMockSensorMode } from "./mock-sensor";
import type { Env } from "../types";

export function areTestHelpersEnabled(env: Env): boolean {
  return env.TEST_HELPERS_ENABLED === "1";
}

function requireTestHelpers(env: Env): void {
  if (!areTestHelpersEnabled(env)) {
    throw new ApiError("Test helpers are disabled.", 404, "NOT_FOUND");
  }
}

function requireSnapshotDb(env: Env): D1Database {
  if (!env.EMF_DB) {
    throw new ApiError("EMF_DB is required for test helpers.", 503, "SNAPSHOT_STORAGE_UNAVAILABLE");
  }

  return env.EMF_DB;
}

export async function resetSnapshots(env: Env): Promise<number> {
  requireTestHelpers(env);
  const db = requireSnapshotDb(env);
  const result = await db.prepare("DELETE FROM emf_snapshots").run();
  return result.meta.changes ?? 0;
}

export async function seedSnapshots(
  env: Env,
  input: {
    start: string;
    end: string;
  },
): Promise<number> {
  requireTestHelpers(env);
  const db = requireSnapshotDb(env);

  if (!isMockSensorMode(env)) {
    throw new ApiError("Snapshot seeding only works in mock sensor mode.", 400, "TEST_HELPER_INVALID_MODE");
  }

  const records = buildMockSnapshotRecords(env, input);
  const statement = db.prepare(
    `
      INSERT OR REPLACE INTO emf_snapshots (
        id,
        entity_id,
        state,
        numeric_value,
        unit,
        last_changed,
        last_updated,
        sampled_at,
        source
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
    `,
  );

  const operations = records.map((record) =>
    statement.bind(
      `${record.entityId}:${record.sampledAt}`,
      record.entityId,
      record.state,
      record.numericValue,
      record.unit,
      record.lastChanged,
      record.lastUpdated,
      record.sampledAt,
      record.source,
    ),
  );

  if (operations.length > 0) {
    await db.batch(operations);
  }

  return records.length;
}
