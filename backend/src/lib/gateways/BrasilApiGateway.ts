/**
 * BrasilApiGateway
 * ────────────────
 * Infrastructure client for the BrasilAPI (CNPJ, FIPE, CEP).
 */

const BRASIL_API = 'https://brasilapi.com.br/api';

export interface BrasilCnpjData {
  cnpj: string;
  razao_social: string;
  nome_fantasia?: string;
  descricao_situacao_cadastral: string;
  data_inicio_atividade?: string;
  cnae_fiscal_descricao?: string;
  logradouro: string;
  numero: string;
  bairro: string;
  municipio: string;
  uf: string;
  cep: string;
}

export async function fetchCnpj(cnpj: string): Promise<BrasilCnpjData> {
  const cleanCnpj = cnpj.replace(/\D/g, '');
  const res = await fetch(`${BRASIL_API}/cnpj/v1/${cleanCnpj}`, {
    headers: {
      'User-Agent': 'MeuContador/1.0 (Enterprise Financial App)',
      'Accept': 'application/json',
    },
    signal: AbortSignal.timeout(10000),
  });

  if (res.status === 404) throw new Error('CNPJ_NOT_FOUND');
  if (!res.ok) throw new Error(`BrasilAPI CNPJ Error: ${res.status}`);

  return res.json();
}

export async function fetchFipePrice(fipeCode: string) {
  const res = await fetch(`${BRASIL_API}/fipe/preco/v1/${fipeCode}`, {
    signal: AbortSignal.timeout(10000)
  });
  if (!res.ok) throw new Error(`BrasilAPI FIPE Error: ${res.status}`);
  return res.json();
}
