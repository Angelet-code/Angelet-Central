import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const dataDir = path.join(rootDir, "data");
const jsonPath = path.join(dataDir, "market-prices.json");
const jsPath = path.join(dataDir, "market-prices.js");
const timeoutMs = 12000;

const stooqAssets = [
  { id: "sp500", label: "S&P 500", symbol: "^SPX", sourceSymbol: "%5Espx", source: "Stooq" },
  { id: "gold", label: "Oro", symbol: "XAUUSD", sourceSymbol: "xauusd", source: "Stooq" },
  { id: "eurusd", label: "Euro/Dolar", symbol: "EURUSD", sourceSymbol: "eurusd", source: "Stooq" }
];

const assetDefaults = {
  sp500: { label: "S&P 500", symbol: "^SPX", source: "Stooq" },
  gold: { label: "Oro", symbol: "XAUUSD", source: "Stooq" },
  btc: { label: "Bitcoin", symbol: "BTC/USD", source: "CoinGecko" },
  eurusd: { label: "Euro/Dolar", symbol: "EURUSD", source: "Stooq" }
};

const readPreviousData = async () => {
  try {
    return JSON.parse(await readFile(jsonPath, "utf8"));
  } catch {
    return { assets: {} };
  }
};

const fetchText = async (url) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
};

const fetchJson = async (url) => JSON.parse(await fetchText(url));

const parseNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseStooqCsv = (csv) => {
  const [, row] = csv.trim().split(/\r?\n/);

  if (!row) throw new Error("Missing CSV row");

  const [symbol, date, time, open, high, low, close, volume] = row.split(",");

  if (date === "N/D") throw new Error(`No data for ${symbol}`);

  return {
    symbol,
    date,
    time,
    open: parseNumber(open),
    high: parseNumber(high),
    low: parseNumber(low),
    close: parseNumber(close),
    volume: parseNumber(volume)
  };
};

const fetchStooqAsset = async (config) => {
  const url = `https://stooq.com/q/l/?s=${config.sourceSymbol}&f=sd2t2ohlcv&h&e=csv`;
  const quote = parseStooqCsv(await fetchText(url));
  const change = quote.close - quote.open;
  const changePercent = quote.open ? (change / quote.open) * 100 : 0;

  return {
    label: config.label,
    symbol: config.symbol,
    price: quote.close,
    change,
    changePercent,
    asOf: `${quote.date} ${quote.time}`,
    source: config.source,
    status: "ok"
  };
};

const fetchBitcoin = async () => {
  const url = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true&include_last_updated_at=true";
  const data = await fetchJson(url);
  const quote = data.bitcoin || {};
  const price = parseNumber(quote.usd);
  const changePercent = parseNumber(quote.usd_24h_change);
  const lastUpdatedAt = parseNumber(quote.last_updated_at);

  if (price === null || changePercent === null) throw new Error("Missing BTC price");

  return {
    label: "Bitcoin",
    symbol: "BTC/USD",
    price,
    change: price * (changePercent / 100),
    changePercent,
    asOf: lastUpdatedAt ? new Date(lastUpdatedAt * 1000).toISOString() : null,
    source: "CoinGecko",
    status: "ok"
  };
};

const staleAsset = (id, previousAsset, error) => {
  const defaults = assetDefaults[id];

  if (previousAsset?.price !== undefined && previousAsset.price !== null) {
    return {
      ...previousAsset,
      status: "stale",
      error: error.message
    };
  }

  return {
    ...defaults,
    price: null,
    change: null,
    changePercent: null,
    asOf: null,
    status: "error",
    error: error.message
  };
};

const settleAsset = async (id, fetcher, previousAssets) => {
  try {
    return [id, await fetcher()];
  } catch (error) {
    return [id, staleAsset(id, previousAssets[id], error)];
  }
};

const main = async () => {
  const previousData = await readPreviousData();
  const previousAssets = previousData.assets || {};
  const entries = await Promise.all([
    ...stooqAssets.map((asset) => settleAsset(asset.id, () => fetchStooqAsset(asset), previousAssets)),
    settleAsset("btc", fetchBitcoin, previousAssets)
  ]);
  const assets = Object.fromEntries(entries);
  const payload = {
    generatedAt: new Date().toISOString(),
    assets
  };
  const json = `${JSON.stringify(payload, null, 2)}\n`;

  await mkdir(dataDir, { recursive: true });
  await writeFile(jsonPath, json, "utf8");
  await writeFile(jsPath, `window.ANGELET_MARKET_PRICES = ${json};`, "utf8");

  const summary = Object.entries(assets)
    .map(([id, asset]) => `${id}:${asset.status}`)
    .join(" ");
  console.log(`market-prices updated ${summary}`);
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
