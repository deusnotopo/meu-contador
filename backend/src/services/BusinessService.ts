/**
 * BusinessService
 * ───────────────
 * Managed business logic for company data and legal entity validation.
 */

import * as BrasilApiGateway from "../lib/gateways/BrasilApiGateway.js";
import { getCacheValue, setCacheValue } from "../lib/cache.js";

const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export async function getCompanyByCnpj(cnpj: string) {
  const cleanCnpj = cnpj.replace(/\D/g, '');
  const cacheKey = `business:cnpj:${cleanCnpj}`;
  
  const cached = await getCacheValue<any>(cacheKey);
  if (cached) return cached;

  const data = await BrasilApiGateway.fetchCnpj(cleanCnpj);
  
  const result = {
    cnpj: data.cnpj,
    razao_social: data.razao_social,
    nome_fantasia: data.nome_fantasia,
    situacao_cadastral: data.descricao_situacao_cadastral,
    data_inicio_atividade: data.data_inicio_atividade,
    cnae_fiscal_descricao: data.cnae_fiscal_descricao,
    endereco: {
      logradouro: data.logradouro,
      numero: data.numero,
      bairro: data.bairro,
      municipio: data.municipio,
      uf: data.uf,
      cep: data.cep,
    },
  };

  await setCacheValue(cacheKey, result, CACHE_TTL);
  return result;
}
