import { getCacheValue, setCacheValue } from "../lib/cache.js";
import * as CryptoGateway from "../gateways/CryptoGateway.js";
import * as CentralBankGateway from "../gateways/CentralBankGateway.js";
import * as BrapiGateway from "../gateways/BrapiGateway.js";
import * as TesouroGateway from "../gateways/TesouroGateway.js";
import { logger } from "../lib/logger.js";

const CACHE_TTL = 15 * 60 * 1000; // 15 min
const MACRO_CACHE_TTL = 60 * 60 * 1000; // 1 hora

export async function getMarketOverview() {
  const cacheKey = 'market:overview';
  const cached = await getCacheValue<Record<string, unknown>>(cacheKey);
  if (cached) return { ...cached, cached: true };

  const [crypto, selic, cdi, ipca, ptax, forex] = await Promise.allSettled([
    CryptoGateway.fetchPrices(),
    CentralBankGateway.fetchSeriesValue(11),
    CentralBankGateway.fetchSeriesValue(4389),
    CentralBankGateway.fetchSeriesValue(433),
    CentralBankGateway.fetchPtax(),
    BrapiGateway.fetchForex(['USD', 'EUR', 'GBP']),
  ]);

  const getValue = <T>(r: PromiseSettledResult<T>, fallback: T): T =>
    r.status === 'fulfilled' ? r.value : fallback;

  const cryptoData = getValue(crypto, { btc: { price: 0, change24h: 0 }, eth: { price: 0, change24h: 0 } });
  const forexData  = getValue(forex, [] as BrapiGateway.ForexResult[]);
  const selicVal   = getValue(selic, null as number | null);
  const cdiVal     = getValue(cdi, null as number | null);
  const ipcaVal    = getValue(ipca, null as number | null);
  const ptaxData   = getValue(ptax, null);

  const getForex = (sym: string) =>
    forexData.find(r => r.symbol === `${sym}BRL=X`);

  // Poupança só calculada se Selic for conhecida (regra do BCB)
  const poupanca = selicVal !== null
    ? (selicVal > 8.5 ? 6.17 : selicVal * 0.7)
    : null;

  const data = {
    updatedAt: new Date().toISOString(),
    btc: cryptoData.btc.price,
    btc_change: cryptoData.btc.change24h,
    eth: cryptoData.eth.price,
    eth_change: cryptoData.eth.change24h,
    usd: getForex('USD')?.regularMarketPrice ?? 0,
    usd_change: getForex('USD')?.regularMarketChangePercent ?? 0,
    eur: getForex('EUR')?.regularMarketPrice ?? 0,
    eur_change: getForex('EUR')?.regularMarketChangePercent ?? 0,
    gbp: getForex('GBP')?.regularMarketPrice ?? 0,
    gbp_change: getForex('GBP')?.regularMarketChangePercent ?? 0,
    selic: selicVal,
    cdi: cdiVal,
    ipca: ipcaVal,
    poupanca,
    ptax: ptaxData ?? undefined,
    // Flags de disponibilidade para o frontend saber o que mostrar
    dataAvailability: {
      selic: selicVal !== null,
      cdi: cdiVal !== null,
      ipca: ipcaVal !== null,
      forex: forexData.length > 0,
      crypto: cryptoData.btc.price > 0,
    },
  };

  if (logger) logger.info('[MarketService] dados coletados', { sources: data.dataAvailability });
  await setCacheValue(cacheKey, data, CACHE_TTL);
  return { ...data, cached: false };
}

export async function getQuotes(tickers: string[]) {
  const cacheKey = `market:quotes:${tickers.sort().join(',')}`;
  const cached = await getCacheValue<Array<{ symbol: string; name: string; price: number; change: number; changePercent: number; logo: string | null }>>(cacheKey);
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
  const cached = await getCacheValue<unknown>(cacheKey);
  if (cached) return cached;

  const data = await TesouroGateway.fetchBills();
  await setCacheValue(cacheKey, data, MACRO_CACHE_TTL);
  return data;
}
