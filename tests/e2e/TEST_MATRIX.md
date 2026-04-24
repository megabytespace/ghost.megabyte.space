# E2E Matrix

These 14 Playwright flows are intentionally written as multi-feature user journeys rather than isolated endpoint checks.

1. Homepage seeded flow: live cards, timeline, snapshot tools, random output
2. Preset range flow: URL state, chart meta, export links, random links
3. Custom range flow: form submission, chart refresh, Sheets formula, deep link
4. Clipboard flow: copy range link + copy Google Sheets formula
5. Deep-link restore flow: reload and second-tab consistency
6. Download flow: CSV and Excel exports match snapshot JSON
7. Docs flow: homepage -> docs -> Swagger UI -> OpenAPI contract
8. Data consistency flow: Sheets helper, random endpoint, snapshot endpoint
9. Cron flow: reset D1 -> trigger scheduled snapshots -> homepage utilities
10. Error-and-recovery flow: invalid API request -> corrected UI range
11. Mobile flow: nav, range controls, exports, docs
12. Keyboard flow: skip link, nav, presets, custom range, docs
13. Web property flow: manifest, robots, humans, sitemap, cross-links
14. Future-ready dataset audit: snapshot/export/random agreement on one range

Future-ready coverage already baked into the suite:

- Shareable range URLs
- Cron-driven D1 retention
- Downloadable export formats
- Google Sheets import compatibility
- Deterministic random-number derivation from stored data
- Installability/web-property surfaces
- Mobile and keyboard-first usability

If new features land later, extend these flows before adding isolated one-off tests.
