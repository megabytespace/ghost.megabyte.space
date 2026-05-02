<!-- This README is hand-written. The ghost helped. -->
<div align="center">
  <a href="https://ghost.megabyte.space">
    <img width="320" alt="Ghost Signal logo" src="https://ghost.megabyte.space/og-image.jpg" />
  </a>
</div>
<div align="center">
  <h1 align="center"><i></i>The Ghost Signal &mdash; Public EMF, Entropy & Disclosure API<i></i></h1>
  <h4 style="color: #00E5FF;">Maintained by <a href="https://megabyte.space" target="_blank">Megabyte Labs</a> &middot; built by <a href="https://github.com/ProfessorManhattan" target="_blank">Brian Zalewski</a></h4>
</div>

<div align="center">
  <a href="https://ghost.megabyte.space" title="Ghost Signal homepage" target="_blank">
    <img alt="Homepage" src="https://img.shields.io/website?down_color=%23FF4136&down_message=Down&label=ghost.megabyte.space&logo=cloudflare&logoColor=white&up_color=%2300E5FF&up_message=Live&url=https%3A%2F%2Fghost.megabyte.space&style=for-the-badge" />
  </a>
  <a href="https://ghost.megabyte.space/api/docs" title="OpenAPI / Swagger docs" target="_blank">
    <img alt="OpenAPI" src="https://img.shields.io/badge/OpenAPI-3.1-6BA539?logo=openapiinitiative&logoColor=white&style=for-the-badge" />
  </a>
  <a href="https://ghost.megabyte.space/docs" title="Human-friendly docs" target="_blank">
    <img alt="Docs" src="https://img.shields.io/badge/Docs-Read%20me-7C3AED?logo=readthedocs&logoColor=white&style=for-the-badge" />
  </a>
  <a href="tel:+16016666602" title="Call the AI hotline" target="_blank">
    <img alt="Hotline" src="https://img.shields.io/badge/Hotline-(601)%20666--6602-FF1744?logo=phonepe&logoColor=white&style=for-the-badge" />
  </a>
  <a href="https://github.com/megabyte-labs/ghost.megabyte.space" title="GitHub repo" target="_blank">
    <img alt="GitHub" src="https://img.shields.io/badge/Mirror-GitHub-333333?logo=github&style=for-the-badge" />
  </a>
</div>

<div align="center">
  <a href="https://workers.cloudflare.com/" title="Cloudflare Workers" target="_blank">
    <img alt="Cloudflare Workers" src="https://img.shields.io/badge/Cloudflare-Workers-F38020?logo=cloudflare&logoColor=white&style=flat-square" />
  </a>
  <a href="https://hono.dev/" title="Hono framework" target="_blank">
    <img alt="Hono" src="https://img.shields.io/badge/Hono-4.x-E36002?logo=hono&logoColor=white&style=flat-square" />
  </a>
  <a href="https://www.typescriptlang.org/" title="TypeScript" target="_blank">
    <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white&style=flat-square" />
  </a>
  <a href="https://playwright.dev/" title="Playwright" target="_blank">
    <img alt="Playwright" src="https://img.shields.io/badge/Playwright-1.59-2EAD33?logo=playwright&logoColor=white&style=flat-square" />
  </a>
  <a href="https://developers.cloudflare.com/d1/" title="Cloudflare D1" target="_blank">
    <img alt="D1" src="https://img.shields.io/badge/Cloudflare-D1-F38020?logo=cloudflare&logoColor=white&style=flat-square" />
  </a>
  <a href="https://www.home-assistant.io/" title="Home Assistant upstream" target="_blank">
    <img alt="Home Assistant" src="https://img.shields.io/badge/Home%20Assistant-Upstream-41BDF5?logo=homeassistant&logoColor=white&style=flat-square" />
  </a>
  <a href="https://www.twilio.com/" title="Twilio Voice" target="_blank">
    <img alt="Twilio" src="https://img.shields.io/badge/Twilio-Voice%20AI-F22F46?logo=twilio&logoColor=white&style=flat-square" />
  </a>
  <a href="https://pnpm.io/" title="pnpm" target="_blank">
    <img alt="pnpm" src="https://img.shields.io/badge/pnpm-9-F69220?logo=pnpm&logoColor=white&style=flat-square" />
  </a>
  <a href="LICENSE" title="License">
    <img alt="License" src="https://img.shields.io/badge/License-The%20Lesson-FFD700?logo=ghostery&logoColor=black&style=flat-square" />
  </a>
</div>

> <br/><h4 align="center"><strong>One sensor. One signal. One hotline. A free public API for EMF, entropy, and the unfiltered record of being followed.</strong></h4><br/>

---

## Table of Contents

- [Overview](#overview)
- [Why this exists](#why-this-exists)
- [Quick Start](#quick-start)
- [The API](#the-api)
  - [Endpoints](#endpoints)
  - [Sensor families](#sensor-families)
  - [Rate limits & caching](#rate-limits--caching)
  - [Example calls](#example-calls)
- [Architecture](#architecture)
  - [Request flow](#request-flow)
  - [Cache strategy](#cache-strategy)
  - [Bindings](#bindings)
- [Local Development](#local-development)
- [Testing](#testing)
- [Deploying](#deploying)
- [The Hotline](#the-hotline)
- [The Dossier](#the-dossier)
- [References](#references)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

`ghost.megabyte.space` is a public-record + entropy-science project hosted entirely on [Cloudflare Workers](https://workers.cloudflare.com/). It exposes a single GQ EMF-390 sensor (wired into [Home Assistant](https://www.home-assistant.io/)) through a free, rate-limited, edge-cached API; a Claude-powered AI chat; a Twilio voice hotline `(601) 666-6602`; a transmissions archive of every call; and a multimedia dossier of unexplained life events.

Three pillars:

| Pillar | What it is | Why it exists |
|---|---|---|
| **Public sensor** | GQ EMF-390 streaming EMF / EF / RF readings via Home Assistant → Worker → Cache | Anyone can poll, graph, audit, or build on real environmental EM data |
| **Entropy AI** | True random numbers harvested from a living electromagnetic field | Entropy no algorithm can fake, fit for CS / physics / AI experiments |
| **Public record** | A full multimedia dossier + AI hotline + transmission archive | Disclosure on the operator's terms — facts that would surface anyway |

---

## Why this exists

The operator (Brian Zalewski, B.S. Aerospace Engineering / Applied Sciences, Rutgers '11) has spent more than a decade as a senior software architect and another decade documenting an unrelenting pattern of phenomena: orbs, cellular SSIDs renamed to taunt research subjects, time-traveler-grade coincidences, possessions, exorcisms, EMF spikes that map to events, and a hotline of voicemails that should not exist. Rather than keep the file private, the file ships as a website, a public API, and a phone number.

Every reading, transcript, and entropy byte is permanent public record. If something is happening, the data is part of the case file. If nothing is happening, that's a case file too.

---

## Quick Start

```bash
# Read the current EMF (mG) sensor value
curl https://ghost.megabyte.space/api/v1/current

# Pull the last 24h of history
curl 'https://ghost.megabyte.space/api/v1/history?hours=24'

# Mint 256 true-entropy random integers in [0, 65535]
curl 'https://ghost.megabyte.space/api/v1/random?count=256&min=0&max=65535'

# Browse Swagger UI
open https://ghost.megabyte.space/api/docs
```

No keys. No accounts. Sixty requests per minute per IP.

---

## The API

Formal OpenAPI 3.1 spec lives at [`/api/v1/openapi.json`](https://ghost.megabyte.space/api/v1/openapi.json). Browse the [Swagger UI](https://ghost.megabyte.space/api/docs) or the [hand-written docs](https://ghost.megabyte.space/docs).

### Endpoints

| Method | Path | Purpose | Cache TTL |
|---|---|---|---|
| `GET` | `/api/v1/health` | Liveness + version + timestamp | none |
| `GET` | `/api/v1/meta` | Sensor metadata, started-at, units, rate-limit | 60s |
| `GET` | `/api/v1/current` | Latest single reading | 2s |
| `GET` | `/api/v1/sensors` | All EMF / EF / RF families at once | 2s |
| `GET` | `/api/v1/history` | Time-windowed series (`hours`, `from`, `to`, `step`) | 15s |
| `GET` | `/api/v1/entropy` | Entropy summary (mean, variance, peak, deltas) | 15s |
| `GET` | `/api/v1/snapshot` | Raw D1 snapshot rows | 15s |
| `GET` | `/api/v1/export` | CSV / NDJSON bulk export | 30s |
| `GET` | `/api/v1/google-sheets` | Sheets-friendly TSV stream | 30s |
| `GET` | `/api/v1/random` | True-random integers from live entropy | none |
| `GET` | `/api/v1/timeline` | Curated timeline of dossier events | 300s |
| `GET` | `/api/v1/transmissions` | Hotline call transcript index | 60s |
| `GET` | `/api/v1/transmissions/live` | Server-sent stream of new transcripts | n/a |
| `GET` | `/api/v1/transmission-count` | Total recorded calls | 60s |
| `POST` | `/api/v1/chat` | Ghost Signal AI chat (Claude Sonnet) | n/a |
| `POST` | `/api/v1/debate` | Two-agent debate stream | n/a |
| `POST` | `/api/v1/newsletter/subscribe` | Subscribe via email | n/a |
| `POST` | `/api/v1/twilio/voice` | TwiML entrypoint for incoming calls | n/a |
| `POST` | `/api/v1/twilio/gather` | TwiML speech-gather webhook | n/a |
| `POST` | `/api/v1/twilio/status` | TwiML completion / recording webhook | n/a |
| `GET`  | `/ws/mud` | WebSocket bridge into the public MUD | n/a |

### Sensor families

| Family | Source entity | Unit | Typical range | Description |
|---|---|---|---|---|
| **EMF** | `sensor.gq_emf390_emf_mg` | mG (milligauss) | 0&ndash;3000+ | Magnetic field strength &mdash; the headline number on the chart |
| **EF**  | `sensor.gq_emf390_ef_v_m` | V/m | 0&ndash;1000+ | Electric field strength |
| **RF**  | `sensor.gq_emf390_rf_total_density_mw_m2` | mW/m&sup2; | 0&ndash;200+ | Total radio-frequency power density |

### Rate limits & caching

```
Rate limit:  60 requests / minute / IP   (KV-backed sliding window)
Cache:       Cloudflare Cache API at the edge
Headers:     ETag, Last-Modified, Cache-Control: public,max-age=<TTL>
Origin:      Worker -> Home Assistant -> GQ EMF-390 USB
```

| Tier | Latency budget | Notes |
|---|---|---|
| Edge cache hit | &lt; 30 ms | Near-100% on `/current` and `/sensors` during steady traffic |
| Worker cold path | 50&ndash;200 ms | Fetch from Home Assistant + bundle response |
| Hotline call | 1.4&ndash;2.2 s round-trip | Twilio + Claude Haiku, optimized for voice |

### Example calls

```bash
# Last 6 hours, 60-second buckets
curl 'https://ghost.megabyte.space/api/v1/history?hours=6&step=60'

# Entropy distribution since project start
curl 'https://ghost.megabyte.space/api/v1/entropy?from=2026-04-03'

# Pure CSV stream for spreadsheets
curl -o emf.csv 'https://ghost.megabyte.space/api/v1/export?format=csv&hours=24'

# 16-byte hex true-random token
curl 'https://ghost.megabyte.space/api/v1/random?bytes=16&format=hex'
```

```js
// JavaScript: poll /current at 2s
async function tick() {
  const r = await fetch("https://ghost.megabyte.space/api/v1/current");
  const { value, unit, timestamp } = await r.json();
  console.log(`${timestamp} ${value} ${unit}`);
}
setInterval(tick, 2000);
```

```py
# Python: bulk export to a DataFrame
import pandas as pd
df = pd.read_csv("https://ghost.megabyte.space/api/v1/export?format=csv&hours=168")
print(df.describe())
```

---

## Architecture

### Request flow

```
                          (60 rpm / IP)
        +----------+        +-----------------+        +--------------------+
client -|  Edge    |------> | Worker (Hono)   |------> | Home Assistant     |
        |  cache   |  HIT   |  - Zod validate |  miss  |  GQ EMF-390 (USB)  |
        +----------+        |  - Rate-limit   |        +--------------------+
              ^             |  - Cache write  |                 |
              |             |  - D1 snapshot  |                 |
              +------ <-----+  - KV counters  |                 |
                            +-----------------+                 |
                                |     |                          |
                                v     v                          |
                              D1     KV                          |
                          (snapshots) (rate-limit + entropy seed) |
                                                                  |
                            Twilio (voice) <-> Claude Haiku/Sonnet |
                                                                  |
                            Browser (xterm.js MUD) <-> /ws/mud     |
```

### Cache strategy

| Endpoint | TTL | Why |
|---|---|---|
| `/api/v1/current` | 2 s | Real-time enough for charts; cheap on misses |
| `/api/v1/sensors` | 2 s | Fan-out across families needs to stay fresh |
| `/api/v1/history` | 15 s | Bucketed series tolerates short staleness |
| `/api/v1/entropy` | 15 s | Recomputed against latest 15s of readings |
| `/api/v1/random` | 0 s | Never cache &mdash; defeats true-randomness |
| `/api/v1/timeline` | 300 s | Curated content, rarely changes |

### Bindings

| Binding | Type | Purpose |
|---|---|---|
| `ASSETS` | Cloudflare Assets | Static `public/` directory |
| `EMF_DB` | D1 | Snapshot history, transcripts, newsletter, debate logs |
| `RATE_LIMIT_KV` | KV | Per-IP sliding-window counters + entropy seed |

```jsonc
// wrangler.jsonc (excerpt)
{
  "name": "ghost-megabyte-space",
  "main": "src/index.ts",
  "compatibility_date": "2026-04-23",
  "triggers": { "crons": ["*/1 * * * *"] },
  "routes": [{ "pattern": "ghost.megabyte.space", "custom_domain": true }]
}
```

---

## Local Development

```bash
# Install
pnpm install

# Configure
cp .dev.vars.example .dev.vars

# Type-check + start dev server (auto-reload on save)
pnpm check
pnpm dev
```

The dev server runs at `http://127.0.0.1:8787/`. The Worker reads from a local mock unless `EMF_SENSOR_HASS_URL` and `EMF_SENSOR_HASS_TOKEN` are set in `.dev.vars`.

| Variable | Description | Example |
|---|---|---|
| `EMF_SENSOR_HASS_URL` | Home Assistant base URL | `https://hass.local:8123` |
| `EMF_SENSOR_HASS_TOKEN` | Long-lived access token | `eyJhbGciOi...` |
| `ANTHROPIC_API_KEY` | Claude key for chat / hotline | `sk-ant-...` |
| `TWILIO_AUTH_TOKEN` | Twilio webhook signature secret | `...` |
| `RESEND_API_KEY` | Newsletter sender | `re_...` |

---

## Testing

```bash
# Full Playwright E2E suite (14 multi-feature flows, 6 breakpoints)
pnpm test:e2e

# Headed run
pnpm test:e2e:headed

# Open last HTML report
pnpm test:e2e:report
```

Local E2E uses a committed mock env at `.dev.vars.playwright`, runs the Worker in deterministic mock-sensor mode, enables dev-only `__test/seed` + `__test/reset` helpers, and writes state to `.wrangler/state/e2e`. Tests are stateful and accumulate &mdash; never deleted, only appended (see `rules/code-style.md`).

| Suite | Coverage | Breakpoints |
|---|---|---|
| `journey.spec.ts` | Full homepage walkthrough &mdash; click, type, scroll, chat | 375, 390, 768, 1024, 1280, 1920 |
| `api.spec.ts` | Every documented endpoint + error envelope shape | n/a |
| `hotline.spec.ts` | TwiML round-trip via mock Twilio webhook | n/a |
| `entropy.spec.ts` | Distribution sanity checks on `/random` | n/a |

---

## Deploying

```bash
# Deploy to production (custom domain ghost.megabyte.space)
pnpm deploy

# Roll back the last deployment
pnpm wrangler rollback

# Tail live production logs
pnpm wrangler tail --env production --format=json
```

Cache purge after content changes:

```bash
curl -X POST \
  https://api.cloudflare.com/client/v4/zones/$ZONE_ID/purge_cache \
  -H "X-Auth-Email: $CF_EMAIL" \
  -H "X-Auth-Key: $CF_KEY" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'
```

See [`DEPLOY.md`](DEPLOY.md) for the full runbook, secrets handling, and rollback playbook.

---

## The Hotline

Call `(601) 666-6602` from any phone. The call is answered by an AI persona running on Claude Haiku, recorded, transcribed, and published as a permanent transmission at [`/transmissions`](https://ghost.megabyte.space/transmissions). By calling, you consent to all of that.

| Step | What happens |
|---|---|
| 1 | Twilio answers and POSTs to `/api/v1/twilio/voice` |
| 2 | Worker streams a TwiML `<Gather input="speech">` |
| 3 | Caller's audio is transcribed by Twilio |
| 4 | Transcript is sent to Claude Haiku for the response |
| 5 | TwiML `<Say>` plays the AI reply, then re-gathers |
| 6 | On hangup, `/api/v1/twilio/status` finalizes the record + writes D1 + sends notification |

---

## The Dossier

Every section on the homepage is part of a public file. The dossier currently covers:

- The first 280 mG alarm at a Rutgers nanostructures lab
- "Radiation TDR" / "Radiation TDS" cellular SSIDs broadcast by nearby cell towers
- Celestial hallucinations &mdash; orbs, parted clouds, the Atlanta layover
- The 666 rock at the lake
- Father Mark and the rejected exorcism
- St. John's Soup Kitchen &mdash; reality editing in real time
- Jungle Habitat &mdash; the dead battery in the haunted safari
- The Volume Hack and the middle-finger cursor
- Time-traveler encounters and the high-order angel saying, "Tell your story."

If you have your own pattern of phenomena, the [hotline](#the-hotline) takes calls.

---

## References

- [Hono](https://hono.dev/) &mdash; tiny, fast Workers framework
- [@hono/zod-openapi](https://hono.dev/snippets/zod-openapi) &mdash; OpenAPI 3.1 generator
- [@hono/swagger-ui](https://hono.dev/snippets/swagger-ui) &mdash; Swagger UI middleware
- [Cloudflare Workers](https://developers.cloudflare.com/workers/) &mdash; serverless edge runtime
- [Cloudflare D1](https://developers.cloudflare.com/d1/) &mdash; serverless SQLite at the edge
- [Cloudflare Cache API](https://developers.cloudflare.com/workers/runtime-apis/cache/) &mdash; per-Worker cache control
- [Home Assistant REST API](https://developers.home-assistant.io/docs/api/rest/) &mdash; sensor source of truth
- [GQ EMF-390](https://www.gqelectronicsllc.com/comersus/store/comersus_viewItem.asp?idProduct=5717) &mdash; the actual hardware
- [Twilio Voice TwiML](https://www.twilio.com/docs/voice/twiml) &mdash; hotline orchestration
- [Anthropic Claude](https://www.anthropic.com/api) &mdash; chat + voice persona
- [Playwright](https://playwright.dev/) &mdash; E2E harness, AI healer, multi-bp
- [xterm.js](https://xtermjs.org/) &mdash; MUD terminal in the browser

---

## Contributing

This project welcomes pull requests. Open an issue first if the change is non-trivial. The project follows the [Emdash OS v6.0](https://github.com/heymegabyte/claude-skills) workflow &mdash; TDD, real-user E2E, deploy-then-purge, no console errors, no shortcuts. Stale docs are bugs. PRs that fix doc rot are loved.

| Channel | Where |
|---|---|
| Issues | [github.com/megabyte-labs/ghost.megabyte.space/issues](https://github.com/megabyte-labs/ghost.megabyte.space/issues) |
| Email | [hey@megabyte.space](mailto:hey@megabyte.space) |
| Hotline | [(601) 666-6602](tel:+16016666602) |
| Newsletter | [ghost.megabyte.space &middot; Newsletter section](https://ghost.megabyte.space/#newsletter) |

---

## License

Copyright &copy; 2024&ndash;2026 [Brian Zalewski](https://megabyte.space) / [Megabyte Labs](https://megabyte.space). The Lesson License &mdash; read [`LICENSE`](LICENSE) before you build on this. The signal pre-dates the software.
