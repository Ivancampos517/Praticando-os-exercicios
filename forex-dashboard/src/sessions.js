const MINUTES_PER_DAY = 24 * 60;

export function isSessionOpen(openMinUtc, closeMinUtc, nowMinUtc) {
  if (openMinUtc < closeMinUtc) {
    return nowMinUtc >= openMinUtc && nowMinUtc < closeMinUtc;
  }
  return nowMinUtc >= openMinUtc || nowMinUtc < closeMinUtc;
}

export function minutesUntilNextTransition(openMinUtc, closeMinUtc, nowMinUtc) {
  const target = isSessionOpen(openMinUtc, closeMinUtc, nowMinUtc) ? closeMinUtc : openMinUtc;
  return ((target - nowMinUtc) % MINUTES_PER_DAY + MINUTES_PER_DAY) % MINUTES_PER_DAY;
}

const localMinutesFormatter = new Map();

function getFormatter(timeZone) {
  if (!localMinutesFormatter.has(timeZone)) {
    localMinutesFormatter.set(
      timeZone,
      new Intl.DateTimeFormat('en-US', {
        timeZone,
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      })
    );
  }
  return localMinutesFormatter.get(timeZone);
}

export function getLocalMinutesInTimeZone(date, timeZone) {
  const parts = getFormatter(timeZone).formatToParts(date);
  const hour = Number(parts.find((p) => p.type === 'hour').value);
  const minute = Number(parts.find((p) => p.type === 'minute').value);
  return hour * 60 + minute;
}

// Standard forex trading session windows, in UTC. Simplified to fixed
// UTC hours (the common convention for retail session clocks) rather than
// tracking each city's own DST rules.
export const FX_SESSIONS = [
  { name: 'Sydney', openMinUtc: 22 * 60, closeMinUtc: 7 * 60 },
  { name: 'Tokyo', openMinUtc: 0, closeMinUtc: 9 * 60 },
  { name: 'London', openMinUtc: 8 * 60, closeMinUtc: 17 * 60 },
  { name: 'New York', openMinUtc: 13 * 60, closeMinUtc: 22 * 60 },
];

// Major stock exchanges, with hours in their own local time zone.
export const STOCK_EXCHANGES = [
  { name: 'NYSE', timeZone: 'America/New_York', openMin: 9 * 60 + 30, closeMin: 16 * 60 },
  { name: 'LSE', timeZone: 'Europe/London', openMin: 8 * 60, closeMin: 16 * 60 + 30 },
  { name: 'Euronext Paris', timeZone: 'Europe/Paris', openMin: 9 * 60, closeMin: 17 * 60 + 30 },
  { name: 'TSE', timeZone: 'Asia/Tokyo', openMin: 9 * 60, closeMin: 15 * 60 },
  { name: 'HKEX', timeZone: 'Asia/Hong_Kong', openMin: 9 * 60 + 30, closeMin: 16 * 60 },
  { name: 'ASX', timeZone: 'Australia/Sydney', openMin: 10 * 60, closeMin: 16 * 60 },
];

export function getFxSessionsStatus(date) {
  const nowMinUtc = getLocalMinutesInTimeZone(date, 'UTC');
  return FX_SESSIONS.map(({ name, openMinUtc, closeMinUtc }) => ({
    name,
    openMinUtc,
    closeMinUtc,
    isOpen: isSessionOpen(openMinUtc, closeMinUtc, nowMinUtc),
    minutesToNextTransition: minutesUntilNextTransition(openMinUtc, closeMinUtc, nowMinUtc),
  }));
}

export function getExchangesStatus(date) {
  return STOCK_EXCHANGES.map(({ name, timeZone, openMin, closeMin }) => {
    const nowMinLocal = getLocalMinutesInTimeZone(date, timeZone);
    return {
      name,
      timeZone,
      openMin,
      closeMin,
      isOpen: isSessionOpen(openMin, closeMin, nowMinLocal),
      minutesToNextTransition: minutesUntilNextTransition(openMin, closeMin, nowMinLocal),
    };
  });
}
