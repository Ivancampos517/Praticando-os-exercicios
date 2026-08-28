# Forex Market Dashboard — Design

## Purpose
A personal, browser-only dashboard for forex trading context: when major
markets/sessions are open, live prices for a user-chosen watchlist plus DXY,
and today's key economic-calendar events.

## Scope decisions (from brainstorming)
- **Platform:** static web app (HTML/CSS/vanilla JS), no backend, no build step.
- **Data:** live data via free-tier third-party APIs, keys supplied by the user.
- **Assets:** DXY always pinned; 5 additional assets chosen and persisted
  (localStorage) by the user via an in-page add/remove UI.
- **Exchange hours:** both the 4 FX sessions (Sydney/Tokyo/London/New York) as
  a live timeline, and a secondary list of named stock exchanges
  (NYSE, LSE, TSE, HKEX, Euronext, ASX) with open/closed status — computed
  client-side from timezone data, no API required.
- **News:** today's economic calendar (time, currency, event, impact,
  actual/forecast/previous), not a headline feed.

## Structure
```
forex-dashboard/
  index.html
  styles.css
  config.example.js   (committed — placeholder keys)
  config.js            (git-ignored — user's real keys)
  src/
    sessions.js         pure functions: session/exchange open-closed + countdown logic
    sessions.test.js     unit tests (node --test)
    watchlist.js         localStorage-backed asset list + price polling
    calendar.js           economic calendar fetch + render
    app.js                wiring/bootstrap
  README.md              setup instructions (get API keys, fill config.js)
```

## Data providers
- **Prices:** Twelve Data free-tier `/quote` endpoint for the 5 chosen assets
  and DXY. If DXY is unavailable on the free tier, the UI shows the tile as
  "unavailable" rather than failing the whole page.
- **Economic calendar:** Financial Modeling Prep free-tier economic-calendar
  endpoint. Provider is isolated behind `calendar.js` so it can be swapped
  for another free provider without touching the rest of the app.
- **Exchange/session hours:** no API — computed from fixed UTC session
  windows + `Intl`/timezone conversion.

## Error handling
Each panel (watchlist, calendar) fails independently: a failed fetch shows
the last cached value with a "stale" marker instead of taking down the page.

## Known limitations (flagged to user)
- API keys are visible in browser network calls since there's no backend —
  acceptable for personal local use, not for public deployment as-is.
- Free-tier economic calendars are less complete than paid ones; some
  low-impact/exotic-currency events may be missing.

## Testing
- `src/sessions.js` (pure open/closed + countdown math) gets unit tests via
  Node's built-in `node --test`.
- Watchlist/calendar/UI wiring verified manually in a real browser.
