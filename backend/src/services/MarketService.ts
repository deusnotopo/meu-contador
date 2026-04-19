/**
 * MarketService
 * ─────────────
 * Application layer for market indicators and quotes.
 */

import { getCacheValue, setCacheValue } from "../lib/cache.js";
import * as CryptoGateway from "../gateways/CryptoGateway.js";
import * as CentralBankGateway from "../gateways/CentralBankGateway.js";
import * as BrapiGateway from "../gateways/BrapiGateway.js";
import * as TesouroGateway from "../gateways/TesouroGateway.js";

const CACHE_TTL = 15 * 60 * 1000; // 15 mins
const MACRO_CACHE_TTL = 60 * 60 * 1000; // 1 hour

export async function getMarketOverview() {
  const cacheKey = 'market:overview';
  const cached = await getCacheValue<any>(cacheKey);
  if (cached) return { ...cached, cached: true };

  const [crypto, selic, cdi, ipca, ptax, forex] = await Promise.all([
    CryptoGateway.fetchPrices(),
    CentralBankGateway.fetchSeriesValue(11),   // Selic
    CentralBankGateway.fetchSeriesValue(4389), // CDI
    CentralBankGateway.fetchSeriesValue(433),  // IPCA
    CentralBankGateway.fetchPtax(),
    BrapiGateway.fetchForex(['USD', 'EUR', 'GBP']),
  ]);

  const selicVal = selic || 13.75;
  const poupanca = selicVal > 8.5 ? 6.17 : selicVal * 0.7;

  const getForex = (sym: string) => forex.find(r => r.symbol === `${sym}BRL=X`);

  const data = {
    updatedAt: new Date().toISOString(),
    btc: crypto.btc.price,
    btc_change: crypto.btc.change24h,
    eth: crypto.eth.price,
    eth_change: crypto.eth.change24h,
    usd: getForex('USD')?.regularMarketPrice || 0,
    usd_change: getForex('USD')?.regularMarketChangePercent || 0,
    eur: getForex('EUR')?.regularMarketPrice || 0,
    eur_change: getForex('EUR')?.regularMarketChangePercent || 0,
    gbp: getForex('GBP')?.regularMarketPrice || 0,
    gbp_change: getForex('GBP')?.regularMarketChangePercent || 0,
    selic: selicVal,
    cdi: cdi || 13.65,
    ipca: ipca || 5.06,
    poupanca,
    ptax: ptax || undefined,
  };

  await setCacheValue(cacheKey, data, CACHE_TTL);
  return { ...data, cached: false };
}

export async function getQuotes(tickers: string[]) {
  const cacheKey = `market:quotes:${tickers.sort().join(',')}`;
  const cached = await getCacheValue<any>(cacheKey);
  if (cached) return cached;

  const quotes = await BrapiGateway.fetchQuotes(tickers);
  const data = quotes.map(r => ({
    symbol: r.symbol,
    name: r.shortName,
    price: r.regularMarketPrice,
    change: r.regularMarketChange,
    changePercent: r.regularMarketChangePercent,
    logo: r.logourl || null,
  }));

  await setCacheValue(cacheKey, data, CACHE_TTL);
  return data;
}

export async function getTesouro() {
  const cacheKey = 'market:tesouro';
  const cached = await getCacheValue<any>(cacheKey);
  if (cached) return cached;

  const data = await TesouroGateway.fetchBills();
  await setCacheValue(cacheKey, data, MACRO_CACHE_TTL);
  return data;
}
