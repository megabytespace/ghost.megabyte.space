# ghost.megabyte.space

Public Cloudflare-cached EMF API and demo site for one Home Assistant sensor.

## What ships here
- A public read-only API for the current EMF value, full-range history browsing, entropy summaries, timeline metadata, raw D1 snapshots, exports, and derived random numbers
- Human-friendly documentation at `/docs`
- Formal OpenAPI at `/api/v1/openapi.json` and `/api/docs`
- A live site that displays the current reading, a realtime graph, full history controls, snapshot export tools, and story/timeline context

## Stack
- Cloudflare Worker
- Hono + `@hono/zod-openapi`
- Cloudflare Cache API + KV + optional D1 snapshots
- Static assets in `public/`

## Key files
- [PROJECT_BRIEF.md](/Users/apple/emdash-projects/worktrees/puny-chairs-create-9eu/PROJECT_BRIEF.md)
- [SPEC.md](/Users/apple/emdash-projects/worktrees/puny-chairs-create-9eu/SPEC.md)
- [DEPLOY.md](/Users/apple/emdash-projects/worktrees/puny-chairs-create-9eu/DEPLOY.md)
- [wrangler.jsonc](/Users/apple/emdash-projects/worktrees/puny-chairs-create-9eu/wrangler.jsonc)
- [src/index.ts](/Users/apple/emdash-projects/worktrees/puny-chairs-create-9eu/src/index.ts)

## Local development
```bash
pnpm install
cp .dev.vars.example .dev.vars
pnpm check
pnpm dev
```

## E2E
The repo includes a Playwright E2E harness under `tests/e2e/` with 14 multi-feature user flows. Local E2E uses a committed mock env file at `.dev.vars.playwright`, runs the Worker in deterministic mock-sensor mode, enables dev-only seed/reset helpers, and writes local state under `.wrangler/state/e2e`.

```bash
pnpm test:e2e
```

## License

Copyright (c) 2024-2026 [Brian Zalewski](https://megabyte.space) / [Megabyte Labs](https://megabyte.space). [The Rutgers License](LICENSE).
