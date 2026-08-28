const STORAGE_KEY = 'forex-dashboard:watchlist';
const DEFAULT_ASSETS = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'XAU/USD', 'BTC/USD'];
const PINNED_ASSET = 'DXY';
const MAX_ASSETS = 5;

export function loadWatchlist() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [...DEFAULT_ASSETS];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : [...DEFAULT_ASSETS];
  } catch {
    return [...DEFAULT_ASSETS];
  }
}

export function saveWatchlist(assets) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(assets));
}

export function addAsset(assets, symbol) {
  const clean = symbol.trim().toUpperCase();
  if (!clean || assets.includes(clean) || assets.length >= MAX_ASSETS) return assets;
  return [...assets, clean];
}

export function removeAsset(assets, symbol) {
  return assets.filter((s) => s !== symbol);
}

export async function fetchQuotes(symbols, apiKey) {
  const allSymbols = [PINNED_ASSET, ...symbols];
  const url = `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(allSymbols.join(','))}&apikey=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url);
  const data = await res.json();

  const bySymbol = allSymbols.length === 1 ? { [allSymbols[0]]: data } : data;
  const quotes = {};
  for (const symbol of allSymbols) {
    const entry = bySymbol[symbol];
    if (!entry || entry.status === 'error' || entry.code) {
      quotes[symbol] = { available: false };
    } else {
      quotes[symbol] = {
        available: true,
        price: Number(entry.close),
        changePercent: Number(entry.percent_change),
      };
    }
  }
  return quotes;
}

export { PINNED_ASSET, MAX_ASSETS };
