import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { logger } from "hono/logger";
import { HTTPException } from "hono/http-exception";

import { getCurrentCacheTtl, getEntropyCacheTtl, getHistoryCacheTtl, getSensorStartedAt, getSiteUrl } from "./lib/config";
import { calculateEntropy } from "./lib/entropy";
import { ApiError, jsonError } from "./lib/errors";
import { applyResponseHeaders, getSecurityHeaders } from "./lib/headers";
import { downsamplePoints, parseHistoryWindow } from "./lib/history";
import { fetchCurrentReading, fetchHistoryPoints, persistSnapshot } from "./lib/home-assistant";
import { areTestHelpersEnabled, resetSnapshots, seedSnapshots } from "./lib/test-helpers";
import { publicReadRateLimit } from "./lib/rate-limit";
import {
  buildGoogleSheetsFormula,
  buildSnapshotCsv,
  buildSnapshotExcel,
  buildSnapshotExportUrl,
  buildSnapshotFilename,
  deriveSnapshotRandom,
  fetchSnapshotRecords,
} from "./lib/snapshots";
import { storyMilestones, timelineAnnotations } from "./lib/timeline-events";
import type { AppVariables, Env } from "./types";

type Bindings = {
  Bindings: Env;
  Variables: AppVariables;
};

const ErrorSchema = z
  .object({
    error: z.string(),
    code: z.string(),
    details: z.unknown().optional(),
    requestId: z.string(),
  })
  .openapi("ApiError");

const HealthSchema = z
  .object({
    status: z.literal("ok"),
    version: z.string(),
    timestamp: z.string(),
  })
  .openapi("Health");

const MetaSchema = z
  .object({
    entityId: z.string(),
    publicName: z.string(),
    source: z.literal("home-assistant"),
    historyMode: z.enum(["d1", "home-assistant"]),
    earliestKnownAt: z.string(),
    docsUrl: z.string(),
    openApiUrl: z.string(),
    polling: z.object({
      recommendedIntervalMs: z.number(),
      currentCacheTtlSeconds: z.number(),
      historyCacheTtlSeconds: z.number(),
      entropyCacheTtlSeconds: z.number(),
    }),
  })
  .openapi("GhostEmfMeta");

const CurrentSchema = z
  .object({
    entityId: z.string(),
    friendlyName: z.string(),
    state: z.string(),
    numericValue: z.number(),
    unit: z.string().nullable(),
    lastChanged: z.string(),
    lastUpdated: z.string(),
    source: z.literal("home-assistant"),
    sampledAt: z.string(),
    cache: z.object({
      maxAgeSeconds: z.number(),
      staleWhileRevalidateSeconds: z.number(),
      strategy: z.literal("cloudflare-cache-api"),
    }),
  })
  .openapi("GhostEmfCurrent");

const HistoryPointSchema = z
  .object({
    timestamp: z.string(),
    value: z.number(),
  })
  .openapi("GhostEmfHistoryPoint");

const HistorySchema = z
  .object({
    entityId: z.string(),
    points: z.array(HistoryPointSchema),
    start: z.string(),
    end: z.string(),
    rawPointCount: z.number(),
    displayPointCount: z.number(),
    targetPoints: z.number(),
    generatedAt: z.string(),
  })
  .openapi("GhostEmfHistory");

const TimelineAnnotationSchema = z
  .object({
    id: z.string(),
    date: z.string(),
    title: z.string(),
    subtitle: z.string(),
    kind: z.enum(["technical", "narrative"]),
  })
  .openapi("TimelineAnnotation");

const StoryMilestoneSchema = z
  .object({
    id: z.string(),
    eraLabel: z.string(),
    title: z.string(),
    subtitle: z.string(),
    body: z.string(),
  })
  .openapi("StoryMilestone");

const TimelineSchema = z
  .object({
    entityId: z.string(),
    earliestKnownAt: z.string(),
    latestKnownAt: z.string(),
    annotations: z.array(TimelineAnnotationSchema),
    milestones: z.array(StoryMilestoneSchema),
    safetyNote: z.string(),
  })
  .openapi("GhostEmfTimeline");

const EntropySchema = z
  .object({
    entropyBits: z.number(),
    sampleCount: z.number(),
    windowMinutes: z.number(),
    bins: z.number(),
    min: z.number(),
    max: z.number(),
    mean: z.number(),
    updatedAt: z.string(),
  })
  .openapi("GhostEmfEntropy");

const SnapshotRecordSchema = z
  .object({
    entityId: z.string(),
    state: z.string(),
    numericValue: z.number(),
    unit: z.string().nullable(),
    lastChanged: z.string(),
    lastUpdated: z.string(),
    sampledAt: z.string(),
    source: z.string(),
  })
  .openapi("GhostEmfSnapshotRecord");

const SnapshotSchema = z
  .object({
    entityId: z.string(),
    start: z.string(),
    end: z.string(),
    sampleCount: z.number(),
    generatedAt: z.string(),
    storage: z.literal("d1"),
    points: z.array(SnapshotRecordSchema),
  })
  .openapi("GhostEmfSnapshot");

const GoogleSheetsSchema = z
  .object({
    entityId: z.string(),
    start: z.string(),
    end: z.string(),
    csvUrl: z.string(),
    importDataFormula: z.string(),
  })
  .openapi("GhostEmfGoogleSheets");

const RandomSchema = z
  .object({
    entityId: z.string(),
    start: z.string(),
    end: z.string(),
    sampleCount: z.number(),
    digits: z.number(),
    randomNumber: z.string(),
    randomUint32: z.number(),
    randomHex: z.string(),
    seedHash: z.string(),
    derivedAt: z.string(),
  })
  .openapi("GhostEmfRandom");

const app = new OpenAPIHono<Bindings>();
const version = "0.1.0";

function getDefaultCache(): Cache {
  return (caches as CacheStorage & { default: Cache }).default;
}

async function readCachedJson<T>(cacheKey: Request): Promise<T | null> {
  const cached = await getDefaultCache().match(cacheKey);
  if (!cached) {
    return null;
  }

  return (await cached.json()) as T;
}

function writeCachedJson(
  cacheKey: Request,
  payload: unknown,
  cacheControl: string,
  executionCtx: ExecutionContext,
): void {
  const response = new Response(JSON.stringify(payload), {
    headers: {
      "cache-control": cacheControl,
      "content-type": "application/json; charset=utf-8",
    },
  });

  executionCtx.waitUntil(getDefaultCache().put(cacheKey, response));
}

app.use("*", logger());

app.use("*", async (c, next) => {
  c.set("requestId", crypto.randomUUID());
  await next();
  c.header("x-request-id", c.get("requestId"));
});

app.use("*", async (c, next) => {
  await next();
  const pathname = new URL(c.req.url).pathname;
  c.res = applyResponseHeaders(c.res, getSecurityHeaders(pathname));
});

const healthRoute = createRoute({
  method: "get",
  path: "/health",
  summary: "Health check",
  tags: ["System"],
  responses: {
    200: {
      description: "Worker health",
      content: {
        "application/json": {
          schema: HealthSchema,
        },
      },
    },
  },
});

app.openapi(healthRoute, (c) =>
  c.json(
    {
      status: "ok",
      version,
      timestamp: new Date().toISOString(),
    },
    200,
  ),
);

const metaRoute = createRoute({
  method: "get",
  path: "/api/v1/ghost-emf/meta",
  summary: "Public metadata for the exposed EMF sensor",
  tags: ["Ghost EMF"],
  responses: {
    200: {
      description: "Sensor metadata",
      content: {
        "application/json": {
          schema: MetaSchema,
        },
      },
    },
  },
});

app.openapi(metaRoute, (c) =>
  c.json(
    {
      entityId: c.env.EMF_SENSOR_ENTITY_ID,
      publicName: c.env.EMF_SENSOR_NAME ?? "Ghost EMF",
      source: "home-assistant",
      historyMode: c.env.EMF_DB ? "d1" : "home-assistant",
      earliestKnownAt: getSensorStartedAt(c.env),
      docsUrl: `${getSiteUrl(c.env)}/docs`,
      openApiUrl: `${getSiteUrl(c.env)}/api/v1/openapi.json`,
      polling: {
        recommendedIntervalMs: 3000,
        currentCacheTtlSeconds: getCurrentCacheTtl(c.env),
        historyCacheTtlSeconds: getHistoryCacheTtl(c.env),
        entropyCacheTtlSeconds: getEntropyCacheTtl(c.env),
      },
    },
    200,
  ),
);

const currentRoute = createRoute({
  method: "get",
  path: "/api/v1/ghost-emf/current",
  summary: "Get the current normalized EMF reading",
  tags: ["Ghost EMF"],
  responses: {
    200: {
      description: "Current EMF reading",
      content: {
        "application/json": {
          schema: CurrentSchema,
        },
      },
    },
    503: {
      description: "Sensor unavailable",
      content: {
        "application/json": {
          schema: ErrorSchema,
        },
      },
    },
  },
});

app.use("/api/v1/ghost-emf/*", publicReadRateLimit);

app.openapi(currentRoute, async (c) => {
  const ttl = getCurrentCacheTtl(c.env);
  const cacheKey = new Request(new URL("/__cache/ghost-emf/current", c.req.url).toString(), {
    method: "GET",
  });
  const cached = await readCachedJson<z.infer<typeof CurrentSchema>>(cacheKey);

  if (cached) {
    const response = c.json(cached, 200);
    response.headers.set("cache-control", `public, max-age=${ttl}, stale-while-revalidate=15`);
    response.headers.set("x-cache-status", "HIT");
    return response;
  }

  const reading = await fetchCurrentReading(c.env);
  const response = c.json(reading, 200);
  const cacheControl = `public, max-age=${ttl}, stale-while-revalidate=15`;

  response.headers.set("cache-control", cacheControl);
  response.headers.set("x-cache-status", "MISS");
  writeCachedJson(cacheKey, reading, cacheControl, c.executionCtx);

  return response;
});

const historyRoute = createRoute({
  method: "get",
  path: "/api/v1/ghost-emf/history",
  summary: "Get EMF history for a recent window or explicit date range",
  tags: ["Ghost EMF"],
  request: {
    query: z.object({
      minutes: z.coerce.number().int().min(1).max(1440).default(60),
      start: z.string().optional(),
      end: z.string().optional(),
      targetPoints: z.coerce.number().int().min(32).max(4000).default(720),
    }),
  },
  responses: {
    200: {
      description: "Recent EMF points",
      content: {
        "application/json": {
          schema: HistorySchema,
        },
      },
    },
  },
});

app.openapi(historyRoute, async (c) => {
  const { minutes, start, end, targetPoints } = c.req.valid("query");
  const window = parseHistoryWindow({ minutes, start, end });
  const ttl = getHistoryCacheTtl(c.env);
  const cacheKey = new Request(
    new URL(
      `/__cache/ghost-emf/history?start=${encodeURIComponent(window.start)}&end=${encodeURIComponent(window.end)}&targetPoints=${targetPoints}`,
      c.req.url,
    ).toString(),
    { method: "GET" },
  );
  const cached = await readCachedJson<z.infer<typeof HistorySchema>>(cacheKey);

  if (cached) {
    const response = c.json(cached, 200);
    response.headers.set("cache-control", `public, max-age=${ttl}, stale-while-revalidate=30`);
    response.headers.set("x-cache-status", "HIT");
    return response;
  }

  const rawPoints = await fetchHistoryPoints(c.env, window);
  const points = downsamplePoints(rawPoints, targetPoints);
  const payload = {
    entityId: c.env.EMF_SENSOR_ENTITY_ID,
    points,
    start: window.start,
    end: window.end,
    rawPointCount: rawPoints.length,
    displayPointCount: points.length,
    targetPoints,
    generatedAt: new Date().toISOString(),
  };
  const response = c.json(payload, 200);
  const cacheControl = `public, max-age=${ttl}, stale-while-revalidate=30`;

  response.headers.set("cache-control", cacheControl);
  response.headers.set("x-cache-status", "MISS");
  writeCachedJson(cacheKey, payload, cacheControl, c.executionCtx);

  return response;
});

const entropyRoute = createRoute({
  method: "get",
  path: "/api/v1/ghost-emf/entropy",
  summary: "Compute Shannon entropy over a recent window or explicit date range",
  tags: ["Ghost EMF"],
  request: {
    query: z.object({
      minutes: z.coerce.number().int().min(1).max(1440).default(60),
      start: z.string().optional(),
      end: z.string().optional(),
      bins: z.coerce.number().int().min(2).max(128).default(16),
      targetPoints: z.coerce.number().int().min(32).max(4000).default(720),
    }),
  },
  responses: {
    200: {
      description: "Entropy summary",
      content: {
        "application/json": {
          schema: EntropySchema,
        },
      },
    },
  },
});

app.openapi(entropyRoute, async (c) => {
  const { minutes, start, end, bins, targetPoints } = c.req.valid("query");
  const window = parseHistoryWindow({ minutes, start, end });
  const ttl = getEntropyCacheTtl(c.env);
  const cacheKey = new Request(
    new URL(
      `/__cache/ghost-emf/entropy?start=${encodeURIComponent(window.start)}&end=${encodeURIComponent(window.end)}&bins=${bins}&targetPoints=${targetPoints}`,
      c.req.url,
    ).toString(),
    { method: "GET" },
  );
  const cached = await readCachedJson<z.infer<typeof EntropySchema>>(cacheKey);

  if (cached) {
    const response = c.json(cached, 200);
    response.headers.set("cache-control", `public, max-age=${ttl}, stale-while-revalidate=30`);
    response.headers.set("x-cache-status", "HIT");
    return response;
  }

  const points = downsamplePoints(await fetchHistoryPoints(c.env, window), targetPoints);
  const windowMinutes = Math.max(1, Math.round((new Date(window.end).getTime() - new Date(window.start).getTime()) / 60_000));
  const entropy = calculateEntropy(points, windowMinutes, bins);
  const response = c.json(entropy, 200);
  const cacheControl = `public, max-age=${ttl}, stale-while-revalidate=30`;

  response.headers.set("cache-control", cacheControl);
  response.headers.set("x-cache-status", "MISS");
  writeCachedJson(cacheKey, entropy, cacheControl, c.executionCtx);

  return response;
});

const snapshotQuerySchema = z.object({
  minutes: z.coerce.number().int().min(1).max(1440).default(60),
  start: z.string().optional(),
  end: z.string().optional(),
});

const snapshotRoute = createRoute({
  method: "get",
  path: "/api/v1/ghost-emf/snapshot",
  summary: "Get the raw D1 snapshot rows for a recent window or explicit date range",
  tags: ["Ghost EMF"],
  request: {
    query: snapshotQuerySchema,
  },
  responses: {
    200: {
      description: "Raw serverless snapshot rows",
      content: {
        "application/json": {
          schema: SnapshotSchema,
        },
      },
    },
  },
});

app.openapi(snapshotRoute, async (c) => {
  const { minutes, start, end } = c.req.valid("query");
  const window = parseHistoryWindow({ minutes, start, end });
  const ttl = getHistoryCacheTtl(c.env);
  const cacheKey = new Request(
    new URL(`/__cache/ghost-emf/snapshot?start=${encodeURIComponent(window.start)}&end=${encodeURIComponent(window.end)}`, c.req.url).toString(),
    { method: "GET" },
  );
  const cached = await readCachedJson<z.infer<typeof SnapshotSchema>>(cacheKey);

  if (cached) {
    const response = c.json(cached, 200);
    response.headers.set("cache-control", `public, max-age=${ttl}, stale-while-revalidate=30`);
    response.headers.set("x-cache-status", "HIT");
    return response;
  }

  const points = await fetchSnapshotRecords(c.env, window);
  const payload = {
    entityId: c.env.EMF_SENSOR_ENTITY_ID,
    start: window.start,
    end: window.end,
    sampleCount: points.length,
    generatedAt: new Date().toISOString(),
    storage: "d1" as const,
    points,
  };
  const response = c.json(payload, 200);
  const cacheControl = `public, max-age=${ttl}, stale-while-revalidate=30`;

  response.headers.set("cache-control", cacheControl);
  response.headers.set("x-cache-status", "MISS");
  writeCachedJson(cacheKey, payload, cacheControl, c.executionCtx);

  return response;
});

const exportRoute = createRoute({
  method: "get",
  path: "/api/v1/ghost-emf/export",
  summary: "Export raw D1 snapshots as CSV or an Excel-compatible workbook",
  tags: ["Ghost EMF"],
  request: {
    query: snapshotQuerySchema.extend({
      format: z.enum(["csv", "excel"]).default("csv"),
    }),
  },
  responses: {
    200: {
      description: "Snapshot export file",
      content: {
        "text/csv": {
          schema: z.string(),
        },
        "application/vnd.ms-excel": {
          schema: z.string(),
        },
      },
    },
  },
});

app.openapi(exportRoute, async (c) => {
  const { minutes, start, end, format } = c.req.valid("query");
  const window = parseHistoryWindow({ minutes, start, end });
  const records = await fetchSnapshotRecords(c.env, window);
  const filename = buildSnapshotFilename(window, format);

  if (format === "excel") {
    return new Response(buildSnapshotExcel(records, filename), {
      headers: {
        "cache-control": "public, max-age=15, stale-while-revalidate=30",
        "content-disposition": `attachment; filename="${filename}"`,
        "content-type": "application/vnd.ms-excel; charset=utf-8",
      },
    });
  }

  return new Response(buildSnapshotCsv(records), {
    headers: {
      "cache-control": "public, max-age=15, stale-while-revalidate=30",
      "content-disposition": `attachment; filename="${filename}"`,
      "content-type": "text/csv; charset=utf-8",
    },
  });
});

const googleSheetsRoute = createRoute({
  method: "get",
  path: "/api/v1/ghost-emf/google-sheets",
  summary: "Get a Google Sheets IMPORTDATA formula for the selected snapshot range",
  tags: ["Ghost EMF"],
  request: {
    query: snapshotQuerySchema,
  },
  responses: {
    200: {
      description: "Google Sheets formula",
      content: {
        "application/json": {
          schema: GoogleSheetsSchema,
        },
      },
    },
  },
});

app.openapi(googleSheetsRoute, (c) => {
  const { minutes, start, end } = c.req.valid("query");
  const window = parseHistoryWindow({ minutes, start, end });

  return c.json(
    {
      entityId: c.env.EMF_SENSOR_ENTITY_ID,
      start: window.start,
      end: window.end,
      csvUrl: buildSnapshotExportUrl(c.env, window, "csv"),
      importDataFormula: buildGoogleSheetsFormula(c.env, window),
    },
    200,
  );
});

const randomRoute = createRoute({
  method: "get",
  path: "/api/v1/ghost-emf/random",
  summary: "Derive a reproducible random number from the selected D1 snapshot range",
  tags: ["Ghost EMF"],
  request: {
    query: snapshotQuerySchema.extend({
      digits: z.coerce.number().int().min(1).max(18).default(10),
    }),
  },
  responses: {
    200: {
      description: "Random number derived from snapshot rows",
      content: {
        "application/json": {
          schema: RandomSchema,
        },
      },
    },
  },
});

app.openapi(randomRoute, async (c) => {
  const { minutes, start, end, digits } = c.req.valid("query");
  const window = parseHistoryWindow({ minutes, start, end });
  const summary = await deriveSnapshotRandom(await fetchSnapshotRecords(c.env, window), window, digits);

  const response = c.json(
    {
      entityId: c.env.EMF_SENSOR_ENTITY_ID,
      ...summary,
    },
    200,
  );
  response.headers.set("cache-control", "no-store");
  return response;
});

const timelineRoute = createRoute({
  method: "get",
  path: "/api/v1/ghost-emf/timeline",
  summary: "Get timeline metadata, technical annotations, and story milestones",
  tags: ["Ghost EMF"],
  responses: {
    200: {
      description: "Timeline metadata",
      content: {
        "application/json": {
          schema: TimelineSchema,
        },
      },
    },
  },
});

app.openapi(timelineRoute, (c) =>
  c.json(
    {
      entityId: c.env.EMF_SENSOR_ENTITY_ID,
      earliestKnownAt: getSensorStartedAt(c.env),
      latestKnownAt: new Date().toISOString(),
      annotations: timelineAnnotations,
      milestones: storyMilestones,
      safetyNote:
        "Do not use this dataset to rationalize cruelty, abuse any animals, or justify harm to anyone.",
    },
    200,
  ),
);

app.doc("/api/v1/openapi.json", {
  openapi: "3.0.0",
  info: {
    title: "ghost.megabyte.space API",
    version,
    description:
      "Public EMF sensor API backed by Home Assistant, edge-cached on Cloudflare, and designed for polling, graphing, and entropy experiments.",
  },
  servers: [{ url: "https://ghost.megabyte.space" }],
});

app.get("/api/docs", swaggerUI({ url: "/api/v1/openapi.json" }));

app.options("/api/*", (c) => {
  c.header("access-control-allow-origin", "*");
  c.header("access-control-allow-methods", "GET, OPTIONS");
  c.header("access-control-allow-headers", "Content-Type");
  return c.body(null, 204);
});

app.get("/__test/reset", async (c) => {
  if (!areTestHelpersEnabled(c.env)) {
    throw new ApiError("Test helpers are disabled.", 404, "NOT_FOUND");
  }

  const deleted = await resetSnapshots(c.env);
  return c.json({ ok: true, deleted }, 200);
});

app.get("/__test/seed", async (c) => {
  if (!areTestHelpersEnabled(c.env)) {
    throw new ApiError("Test helpers are disabled.", 404, "NOT_FOUND");
  }

  const query = c.req.query();
  const resetFirst = query.reset === "1";
  const start = query.start;
  const end = query.end;
  const minutes = query.minutes ? Number.parseInt(query.minutes, 10) : 60;
  const window = parseHistoryWindow({ start, end, minutes: Number.isFinite(minutes) ? minutes : 60 });

  if (resetFirst) {
    await resetSnapshots(c.env);
  }

  const inserted = await seedSnapshots(c.env, window);
  return c.json(
    {
      ok: true,
      start: window.start,
      end: window.end,
      inserted,
    },
    200,
  );
});

app.get("*", async (c) => {
  const url = new URL(c.req.url);
  const pathname = url.pathname;

  if (pathname.startsWith("/api/")) {
    throw new ApiError(`Route GET ${pathname} was not found.`, 404, "NOT_FOUND");
  }

  const assetPath = pathname === "/" ? "/index.html" : pathname === "/docs" ? "/docs.html" : pathname;
  const assetUrl = new URL(assetPath, url);
  const assetResponse = await c.env.ASSETS.fetch(new Request(assetUrl.toString(), c.req.raw));

  if (assetResponse.status === 404 && !assetPath.includes(".")) {
    const fallback = await c.env.ASSETS.fetch(new Request(new URL("/index.html", url).toString(), c.req.raw));
    return applyResponseHeaders(fallback, {
      "cache-control": "public, max-age=0, must-revalidate",
    });
  }

  return applyResponseHeaders(assetResponse, {
    "cache-control": assetPath.endsWith(".html")
      ? "public, max-age=0, must-revalidate"
      : "public, max-age=31536000, immutable",
  });
});

app.onError((error, c) => {
  const requestId = c.get("requestId") ?? crypto.randomUUID();

  if (error instanceof ApiError) {
    return jsonError(error, requestId);
  }

  if (error instanceof HTTPException) {
    return jsonError(new ApiError(error.message, error.status, `HTTP_${error.status}`), requestId);
  }

  console.error(error);
  return jsonError(new ApiError("Something went wrong on our end.", 500, "INTERNAL_ERROR"), requestId);
});

export default {
  fetch: app.fetch,
  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(persistSnapshot(env));
  },
};
