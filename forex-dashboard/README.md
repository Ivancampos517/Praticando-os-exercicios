# Forex Desk

A local dashboard: live forex/DXY session hours, a 5-asset watchlist (plus DXY, always pinned), and today's economic calendar.

## Setup

1. Get two free API keys:
   - [Twelve Data](https://twelvedata.com/pricing) — free plan — for live prices.
   - [JBlanked](https://www.jblanked.com/news/api/docs/calendar/) — free plan — for the economic calendar. Sign up, then generate a key from your profile.
2. Copy `config.example.js` to `config.js` and paste your keys in:
   ```
   cp config.example.js config.js
   ```
3. Run the bundled server (needs only Node.js — no `npm install`):
   ```
   node server.js
   ```
   This does two things: serves the static files (opening `index.html` directly via `file://` blocks the `fetch()` calls in most browsers), and proxies `/api/calendar` to JBlanked. The proxy exists because JBlanked's API doesn't send CORS headers, so a browser calling it directly from `localhost` gets blocked — see the comment at the top of `server.js`.
4. Open http://localhost:3000 in your browser.

## Notes

- Your API keys are visible in browser network requests since there's no real backend logic (`server.js` is just a static file server plus a one-endpoint CORS relay). Fine for personal local use — don't deploy this publicly as-is.
- DXY is always tracked in addition to your 5 chosen assets. If your Twelve Data plan doesn't carry the DXY symbol, that tile will show "unavailable" without affecting the rest of the app.
- JBlanked's free plan is currently rate-limited to 1 request/day (high-traffic notice on their docs). The app caches each day's calendar in `localStorage` so reloading the page doesn't burn the quota — it only re-fetches once the date rolls over.
- Add/remove assets in the Watchlist panel; your 5 picks are saved in the browser (`localStorage`), so they persist between visits on the same device/browser.
- Session/exchange hours are computed locally from fixed schedules — no API or key needed for that panel.

## Tests

Pure logic (session open/closed + countdown math) has unit tests:
```
node --test src/sessions.test.js
```
