const IMPACT_ORDER = { High: 0, Medium: 1, Low: 2 };
const CACHE_KEY = 'forexDesk.calendarCache';

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

// JBlanked's free plan is rate-limited to 1 request/day, so we cache the
// day's events in localStorage and only re-fetch when the calendar date
// rolls over. See https://www.jblanked.com/news/api/docs/calendar/
function readCache(today) {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
    if (cached && cached.date === today && Array.isArray(cached.events)) {
      return cached.events;
    }
  } catch {
    // ignore malformed cache
  }
  return null;
}

function writeCache(today, events) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ date: today, events }));
  } catch {
    // ignore storage errors (e.g. private browsing quota)
  }
}

export async function fetchTodayEvents(apiKey) {
  const today = todayIsoDate();

  const cached = readCache(today);
  if (cached) return cached;

  // Routed through our own tiny proxy (server.js) so the browser's CORS
  // policy doesn't block the request — see server.js for why.
  const url = '/api/calendar';
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Api-Key ${apiKey}`,
    },
  });
  const data = await res.json();
  if (!Array.isArray(data)) return [];

  const events = data
    .map((e) => ({
      time: e.Date ? e.Date.slice(11, 16) : '',
      currency: e.Currency || '',
      event: e.Name || '',
      impact: e.Impact || 'Low',
      actual: e.Actual,
      forecast: e.Forecast,
      previous: e.Previous,
    }))
    .sort((a, b) => {
      const impactDiff = (IMPACT_ORDER[a.impact] ?? 3) - (IMPACT_ORDER[b.impact] ?? 3);
      if (impactDiff !== 0) return impactDiff;
      return a.time.localeCompare(b.time);
    });

  writeCache(today, events);
  return events;
}
