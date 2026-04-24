# ghost.megabyte.space

<instructions>

## Product
Domain: ghost.megabyte.space. One public Home Assistant-backed EMF sensor exposed through a Cloudflare Worker with Hono, static docs/demo pages, KV rate limiting, optional D1 snapshots, and no auth or billing in v1.

## Stack
CF Workers + Hono + @hono/zod-openapi | Static assets in `public/` | Home Assistant upstream | Cloudflare Cache API | KV rate limiting | Optional D1 history snapshots | TypeScript | Wrangler

## Deploy
`pnpm check` → `pnpm deploy` after real Cloudflare binding IDs and Home Assistant secrets are supplied. Rollback: `wrangler rollback`.

## Routing
Skills: @~/.agentskills/_router.md. Agents: @~/.agentskills/agents/. Rules: @~/.claude/rules/.

</instructions>

<context>
See global CLAUDE.md for full Emdash OS v6.0 policy. Project-specific overrides go in this file.
</context>
