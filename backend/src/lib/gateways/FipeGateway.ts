/**
 * FipeGateway
 * ───────────
 * Infrastructure client for the Tabela FIPE API.
 */

const FIPE_API = 'https://parallelum.com.br/fipe/api/v1';

export type VehicleType = 'carros' | 'motos' | 'caminhoes';

export interface FipeBrand {
  codigo: string;
  nome: string;
}

export interface FipeModel {
  codigo: number;
  nome: string;
}

export interface FipeValuation {
  TipoVeiculo: number;
  Valor: string;
  Marca: string;
  Modelo: string;
  AnoModelo: number;
  Combustivel: string;
  CodigoFipe: string;
  MesReferencia: string;
  SiglaCombustivel: string;
}

export async function fetchBrands(type: VehicleType): Promise<FipeBrand[]> {
  const res = await fetch(`${FIPE_API}/${type}/marcas`, {
    signal: AbortSignal.timeout(10000)
  });
  if (!res.ok) throw new Error(`FIPE API Brands Error: ${res.status}`);
  return res.json();
}

export async function fetchModels(type: VehicleType, brandId: string): Promise<FipeModel[]> {
  const res = await fetch(`${FIPE_API}/${type}/marcas/${brandId}/modelos`, {
    signal: AbortSignal.timeout(10000)
  });
  if (!res.ok) throw new Error(`FIPE API Models Error: ${res.status}`);
  const data = await res.json();
  return data.modelos || data;
}

export async function fetchYears(type: VehicleType, brandId: string, modelId: string): Promise<any[]> {
  const res = await fetch(`${FIPE_API}/${type}/marcas/${brandId}/modelos/${modelId}/anos`, {
    signal: AbortSignal.timeout(10000)
  });
  if (!res.ok) throw new Error(`FIPE API Years Error: ${res.status}`);
  return res.json();
}

export async function fetchValuation(type: VehicleType, brandId: string, modelId: string, yearId: string): Promise<FipeValuation> {
  const res = await fetch(`${FIPE_API}/${type}/marcas/${brandId}/modelos/${modelId}/anos/${yearId}`, {
    signal: AbortSignal.timeout(10000)
  });
  if (!res.ok) throw new Error(`FIPE API Valuation Error: ${res.status}`);
  return res.json();
}
