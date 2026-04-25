# ghost.megabyte.space

<instructions>

## Product
Presidential campaign website for Brian Zalewski (2028). Built on radical truth, entropy AI, and a multimedia dossier of unexplained life events. Domain: ghost.megabyte.space.

Core pillars:
1. **Campaign platform** — shut down the Federal Reserve, AI-augmented Presidency, UBI, humanitarian relief
2. **Entropy AI** — public EMF sensor producing true random numbers for computer science/physics, proving AI can replace government functions via API into living corridors
3. **Multimedia dossier** — interactive tour of paranormal events, gangstalking documentation, unexplained patterns, time traveler encounters — facts that would surface anyway due to systematic targeting by clandestine actors operating outside standard thought patterns
4. **AI hotline** — (601) 666-6602, every call transcribed and published as public record

The candidate: Aerospace Engineering (Applied Science) background. 14+ years as high-level technological advisor solving complex problems requiring advanced communication, high IQ, and leadership that inspires others to take passionate ownership. Experiences the universe differently — intuition that breaks down walls, deja-vu karma, a desirable trait for President. Balances being President, telling the public the truth, and providing useful services for scientists. All roads lead back to Tom Greene's "I want to throw the Piggy" — the inspiration to challenge the Federal Reserve.

Tone: Presidential but unfiltered. Conspiratorial but credible. The weird stuff is the point — it sells the truth, serves science, and demonstrates the candidate's unique perceptual capabilities. Never sanitize. Never apologize. Frame everything through the lens of a serious campaign that happens to involve ghosts, entropy, and 666.

## Stack
CF Workers + Hono + @hono/zod-openapi | Static assets in `public/` | Home Assistant upstream | Cloudflare Cache API | KV rate limiting | D1 (chat, calls, newsletter, EMF snapshots) | xterm.js MUD terminal | Twilio AI hotline | TypeScript | Wrangler

## Architecture
- `src/index.ts` — Hono worker: EMF API, chat, Twilio webhooks, WebSocket MUD proxy, newsletter
- `src/lib/chat.ts` — AI chat with Ghost Signal persona (Claude Sonnet)
- `src/lib/twilio.ts` — Voice AI hotline with TwiML (Claude Haiku)
- `src/data/timeline.yaml` — Timeline events data
- `public/index.html` — Single-page campaign site: hero, EMF chart, timeline, dossier cards, mission statement, evidence, MUD terminal, newsletter
- `public/app.js` — Frontend controller: chart rendering, chat widget, MUD xterm.js, countdown
- `public/styles.css` — CSS cascade layers, dark theme (#060610), brand colors

## Deploy
`CLOUDFLARE_EMAIL=$(get-secret CLOUDFLARE_EMAIL) CLOUDFLARE_API_KEY=$(get-secret CLOUDFLARE_API_KEY) npx wrangler deploy` then purge CDN. Rollback: `wrangler rollback`.

## Routing
Skills: @~/.agentskills/_router.md. Agents: @~/.agentskills/agents/. Rules: @~/.claude/rules/.

</instructions>

<context>
See global CLAUDE.md for full Emdash OS v6.0 policy. Project-specific overrides go in this file.
</context>
