import { getFxSessionsStatus, getExchangesStatus } from './sessions.js';
import { loadWatchlist, saveWatchlist, addAsset, removeAsset, fetchQuotes, PINNED_ASSET } from './watchlist.js';
import { fetchTodayEvents } from './calendar.js';
import { CONFIG } from '../config.js';

const PRICE_REFRESH_MS = 60_000;
const CALENDAR_REFRESH_MS = 60 * 60_000;
const CLOCK_TICK_MS = 1_000;

function formatCountdown(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function renderClock() {
  const el = document.getElementById('local-clock');
  const now = new Date();
  el.textContent = now.toLocaleString(undefined, {
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function renderSessions() {
  const now = new Date();
  const sessions = getFxSessionsStatus(now);
  const container = document.getElementById('session-tiles');
  container.innerHTML = '';

  for (const s of sessions) {
    const tile = document.createElement('div');
    tile.className = `flip-tile${s.isOpen ? ' is-open' : ''}`;
    tile.innerHTML = `
      <div class="flip-city">${s.name}</div>
      <div class="flip-status">${s.isOpen ? 'OPEN' : 'CLOSED'}</div>
      <div class="flip-countdown">${s.isOpen ? 'closes in' : 'opens in'} ${formatCountdown(s.minutesToNextTransition)}</div>
    `;
    container.appendChild(tile);
  }

  const openNames = sessions.filter((s) => s.isOpen).map((s) => s.name);
  const note = document.getElementById('overlap-note');
  note.textContent = openNames.length >= 2 ? `Overlap now: ${openNames.join(' × ')}` : '';
}

function renderExchanges() {
  const now = new Date();
  const exchanges = getExchangesStatus(now);
  const container = document.getElementById('exchange-strip');
  container.innerHTML = '';

  for (const e of exchanges) {
    const item = document.createElement('span');
    item.className = `strip-item${e.isOpen ? ' is-open' : ''}`;
    item.innerHTML = `<span class="strip-dot"></span>${e.name} ${e.isOpen ? 'open' : 'closed'}`;
    container.appendChild(item);
  }
}

async function renderWatchlist() {
  const assets = loadWatchlist();
  const body = document.getElementById('watchlist-body');
  const note = document.getElementById('watchlist-note');
  const allSymbols = [PINNED_ASSET, ...assets];

  body.innerHTML = allSymbols
    .map(
      (symbol) => `
        <div class="ledger-row${symbol === PINNED_ASSET ? ' is-pinned' : ''}" data-symbol="${symbol}">
          <span class="ledger-symbol">${symbol}</span>
          <span class="ledger-price">…</span>
          <span class="ledger-change"></span>
          ${symbol === PINNED_ASSET ? '' : '<button class="ledger-remove" title="Remove" data-remove>×</button>'}
        </div>
      `
    )
    .join('');

  wireRemoveButtons(assets);

  if (!CONFIG.twelveDataApiKey || CONFIG.twelveDataApiKey.startsWith('YOUR_')) {
    note.textContent = 'Add your Twelve Data API key to config.js to see live prices.';
    return;
  }

  try {
    const quotes = await fetchQuotes(assets, CONFIG.twelveDataApiKey);
    for (const symbol of allSymbols) {
      const row = body.querySelector(`[data-symbol="${CSS.escape(symbol)}"]`);
      if (!row) continue;
      const quote = quotes[symbol];
      const priceEl = row.querySelector('.ledger-price');
      const changeEl = row.querySelector('.ledger-change');
      if (!quote || !quote.available) {
        priceEl.textContent = 'unavailable';
        continue;
      }
      priceEl.textContent = quote.price.toFixed(quote.price < 10 ? 4 : 2);
      const pct = quote.changePercent;
      changeEl.textContent = `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`;
      changeEl.classList.add(pct >= 0 ? 'is-up' : 'is-down');
    }
    note.textContent = '';
  } catch {
    note.textContent = 'Could not refresh prices — showing last known values.';
  }
}

function wireRemoveButtons(assets) {
  document.querySelectorAll('[data-remove]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const symbol = btn.closest('.ledger-row').dataset.symbol;
      saveWatchlist(removeAsset(assets, symbol));
      renderWatchlist();
    });
  });
}

function wireAddAssetForm() {
  const form = document.getElementById('add-asset-form');
  const input = document.getElementById('add-asset-input');
  const addNote = document.getElementById('add-asset-note');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const assets = loadWatchlist();
    const symbol = input.value.trim().toUpperCase();
    const next = addAsset(assets, input.value);

    if (next.length === assets.length) {
      addNote.textContent = assets.includes(symbol)
        ? `${symbol} is already on your watchlist.`
        : 'Watchlist is full (5 assets max) — remove one first.';
    } else {
      addNote.textContent = '';
    }

    saveWatchlist(next);
    input.value = '';
    renderWatchlist();
  });
}

async function renderCalendar() {
  const body = document.getElementById('calendar-body');
  const note = document.getElementById('calendar-note');

  if (!CONFIG.jblankedApiKey || CONFIG.jblankedApiKey.startsWith('YOUR_')) {
    note.textContent = 'Add your JBlanked API key to config.js to see today’s calendar.';
    return;
  }

  try {
    const events = await fetchTodayEvents(CONFIG.jblankedApiKey);
    if (!events.length) {
      body.innerHTML = '';
      note.textContent = 'No scheduled events found for today.';
      return;
    }
    body.innerHTML = events
      .map(
        (e) => `
          <div class="manifest-row">
            <span class="manifest-time">${e.time}</span>
            <span class="manifest-currency">${e.currency}</span>
            <span class="manifest-event">${e.event}</span>
            <span class="manifest-impact impact-${e.impact.toLowerCase()}">${e.impact}</span>
          </div>
        `
      )
      .join('');
    note.textContent = '';
  } catch {
    note.textContent = 'Could not load today’s calendar right now.';
  }
}

function init() {
  renderClock();
  renderSessions();
  renderExchanges();
  renderWatchlist();
  renderCalendar();
  wireAddAssetForm();

  setInterval(renderClock, CLOCK_TICK_MS);
  setInterval(() => {
    renderSessions();
    renderExchanges();
  }, CLOCK_TICK_MS * 30);
  setInterval(renderWatchlist, PRICE_REFRESH_MS);
  setInterval(renderCalendar, CALENDAR_REFRESH_MS);
}

init();
