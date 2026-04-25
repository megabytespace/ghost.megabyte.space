# E2E Matrix

14 multi-feature user journeys covering the Ghost Signal's 666 theme, chart explorer, timeline navigator, AI chat, hotline, and data pipeline.

## homepage-flows.spec.js
1. Hero + status grid + "Enter the Signal" opens chat: glitch text, 4 status cards, chat panel aria toggle
2. Preset range buttons: 24h/7d/30d/All URL state, chart meta, export link updates, active button styling
3. Custom range form: date entry, chart refresh, Sheets formula, deep link, invalid range error
4. Clipboard: copy range link + copy Sheets formula
5. Deep-link restore: reload consistency, second-tab consistency

## feature-flows.spec.js
6. Timeline click navigation: click nodes, active state, detail panel (title/body/date/category), node structure
7. Timeline keyboard navigation: ArrowRight, ArrowLeft, ArrowDown, ArrowUp, Home, End
8. Chat widget open/close: toggle button, hero button, X close, Escape close, aria states, focus management
9. Chat message flow: send message, user bubble, typing indicator, AI response, session persistence
10. Hotline section: phone number, tel: href, section content, nav link, hero call button, transmission count

## export-and-api-flows.spec.js
11. CSV + Excel downloads match snapshot row count
12. OpenAPI contract: all endpoints present, chat POST works, transmission-count returns number
13. Data consistency: google-sheets + random + snapshot endpoints agree on range
14. Cron D1 flow: reset, trigger scheduled, verify homepage populates

## platform-and-future-contracts.spec.js (bonus coverage)
- Mobile viewport: nav, chat, timeline, hotline, range controls, docs navigation
- Keyboard accessibility: skip link, nav tabs, chat Escape, timeline arrow keys
- Web properties: manifest, robots, sitemap, security.txt, footer cross-links
- Future-ready dataset audit: snapshot/export/random agreement
- Invalid API range recovery

Features covered: hero, status grid, chart explorer, range presets, custom range, clipboard, deep links, timeline navigator (click + keyboard), chat widget (open/close/messaging), hotline section, phone links, CSV/Excel export, OpenAPI contract, cron snapshots, data consistency, mobile, keyboard a11y, web properties.
