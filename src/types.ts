export interface Env {
  ASSETS: Fetcher;
  RATE_LIMIT_KV?: KVNamespace;
  EMF_DB?: D1Database;
  HASS_SERVER: string;
  HASS_TOKEN: string;
  MOCK_SENSOR_MODE?: string;
  TEST_HELPERS_ENABLED?: string;
  EMF_SENSOR_ENTITY_ID: string;
  EMF_SENSOR_NAME?: string;
  EMF_SENSOR_STARTED_AT?: string;
  SITE_NAME?: string;
  SITE_URL?: string;
  CURRENT_CACHE_TTL_SECONDS?: string;
  HISTORY_CACHE_TTL_SECONDS?: string;
  ENTROPY_CACHE_TTL_SECONDS?: string;
  PUBLIC_API_RATE_LIMIT_PER_MINUTE?: string;
}

export interface HomeAssistantState {
  entity_id: string;
  state: string;
  attributes?: Record<string, unknown>;
  last_changed: string;
  last_updated: string;
}

export interface NormalizedReading {
  entityId: string;
  friendlyName: string;
  state: string;
  numericValue: number;
  unit: string | null;
  lastChanged: string;
  lastUpdated: string;
  source: "home-assistant";
  sampledAt: string;
  cache: {
    maxAgeSeconds: number;
    staleWhileRevalidateSeconds: number;
    strategy: "cloudflare-cache-api";
  };
}

export interface HistoryPoint {
  timestamp: string;
  value: number;
}

export interface HistoryWindow {
  start: string;
  end: string;
}

export interface SnapshotRecord {
  entityId: string;
  state: string;
  numericValue: number;
  unit: string | null;
  lastChanged: string;
  lastUpdated: string;
  sampledAt: string;
  source: string;
}

export interface EntropySummary {
  entropyBits: number;
  sampleCount: number;
  windowMinutes: number;
  bins: number;
  min: number;
  max: number;
  mean: number;
  updatedAt: string;
}

export interface AppVariables {
  requestId: string;
}

export interface TimelineAnnotation {
  id: string;
  date: string;
  title: string;
  subtitle: string;
  kind: "technical" | "narrative";
}

export interface StoryMilestone {
  id: string;
  eraLabel: string;
  title: string;
  subtitle: string;
  body: string;
}
