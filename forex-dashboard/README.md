# Forex Desk

A browser-only dashboard: live forex/DXY session hours, a 5-asset watchlist (plus DXY, always pinned), and today's economic calendar.

## Setup

1. Get two free API keys:
   - [Twelve Data](https://twelvedata.com/pricing) — free plan — for live prices.
   - [Financial Modeling Prep](https://site.financialmodelingprep.com/developer/docs/pricing) — free plan — for the economic calendar.
2. Copy `config.example.js` to `config.js` and paste your keys in:
   ```
   cp config.example.js config.js
   ```
3. Serve the folder with any static server (opening `index.html` directly via `file://` will block the `fetch()` calls in most browsers). For example:
   ```
   npx serve .
   ```
   or
   ```
   python -m http.server 8080
   ```
4. Open the served URL in your browser.

## Notes

- Your API keys are visible in browser network requests since there's no backend. Fine for personal local use — don't deploy this publicly as-is.
- DXY is always tracked in addition to your 5 chosen assets. If your Twelve Data plan doesn't carry the DXY symbol, that tile will show "unavailable" without affecting the rest of the app.
- Add/remove assets in the Watchlist panel; your 5 picks are saved in the browser (`localStorage`), so they persist between visits on the same device/browser.
- Session/exchange hours are computed locally from fixed schedules — no API or key needed for that panel.

## Tests

Pure logic (session open/closed + countdown math) has unit tests:
```
node --test src/sessions.test.js
```
