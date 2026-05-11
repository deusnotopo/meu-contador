/**
 * AssetService
 * ────────────
 * Managed business logic for vehicles and assets.
 */

import * as FipeGateway from "../lib/gateways/FipeGateway.js";
import type { FipeYear } from "../lib/gateways/FipeGateway.js";
import * as BrasilApiGateway from "../lib/gateways/BrasilApiGateway.js";
import { getCacheValue, setCacheValue } from "../lib/cache.js";

const LONG_CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days
const SHORT_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export async function getFipeBrands(type: FipeGateway.VehicleType) {
  const cacheKey = `fipe:brands:${type}`;
  const cached = await getCacheValue<FipeGateway.FipeBrand[]>(cacheKey);
  if (cached) return cached;

  const data = await FipeGateway.fetchBrands(type);
  await setCacheValue(cacheKey, data, LONG_CACHE_TTL);
  return data;
}

export async function getFipeModels(type: FipeGateway.VehicleType, brandId: string) {
  const cacheKey = `fipe:models:${type}:${brandId}`;
  const cached = await getCacheValue<FipeGateway.FipeModel[]>(cacheKey);
  if (cached) return cached;

  const data = await FipeGateway.fetchModels(type, brandId);
  await setCacheValue(cacheKey, data, LONG_CACHE_TTL);
  return data;
}

export async function getFipeYears(type: FipeGateway.VehicleType, brandId: string, modelId: string) {
  const cacheKey = `fipe:years:${type}:${brandId}:${modelId}`;
  const cached = await getCacheValue<FipeYear[]>(cacheKey);
  if (cached) return cached;

  const data = await FipeGateway.fetchYears(type, brandId, modelId);
  await setCacheValue(cacheKey, data, LONG_CACHE_TTL);
  return data;
}

export async function getVehicleValuation(type: FipeGateway.VehicleType, brandId: string, modelId: string, yearId: string) {
  const cacheKey = `fipe:val:${type}:${brandId}:${modelId}:${yearId}`;
  const cached = await getCacheValue<FipeGateway.FipeValuation>(cacheKey);
  if (cached) return cached;

  const data = await FipeGateway.fetchValuation(type, brandId, modelId, yearId);
  await setCacheValue(cacheKey, data, SHORT_CACHE_TTL);
  return data;
}

export async function getPriceByFipeCode(fipeCode: string) {
  return BrasilApiGateway.fetchFipePrice(fipeCode);
}
