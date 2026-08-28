const IMPACT_ORDER = { High: 0, Medium: 1, Low: 2 };

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export async function fetchTodayEvents(apiKey) {
  const today = todayIsoDate();
  const url = `https://financialmodelingprep.com/api/v3/economic_calendar?from=${today}&to=${today}&apikey=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!Array.isArray(data)) return [];

  return data
    .map((e) => ({
      time: e.date ? e.date.slice(11, 16) : '',
      currency: e.country || '',
      event: e.event || '',
      impact: e.impact || 'Low',
      actual: e.actual,
      forecast: e.estimate,
      previous: e.previous,
    }))
    .sort((a, b) => {
      const impactDiff = (IMPACT_ORDER[a.impact] ?? 3) - (IMPACT_ORDER[b.impact] ?? 3);
      if (impactDiff !== 0) return impactDiff;
      return a.time.localeCompare(b.time);
    });
}
