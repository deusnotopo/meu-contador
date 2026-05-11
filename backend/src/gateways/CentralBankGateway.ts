/**
 * CentralBankGateway
 * ──────────────────
 * Infrastructure layer for Brazilian Central Bank signals.
 */

export interface PtaxRate {
  compra: number;
  venda: number;
}

export async function fetchSeriesValue(seriesId: number): Promise<number | null> {
  try {
    const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${seriesId}/dados/ultimos/1?formato=json`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    
    const data = await res.json() as Array<{ valor: string }>;
    const value = parseFloat(data?.[0]?.valor);
    return isNaN(value) ? null : value;
  } catch {
    return null;
  }
}

export interface InterestRateRecord {
  Mes: string;
  Modalidade: string;
  Posicao: number;
  InstituicaoFinanceira: string;
  TaxaJurosAoMes: number;
  TaxaJurosAoAno: number;
  cnpj8: string;
  anoMes: string;
}

/**
 * Busca ranking de taxas de juros por modalidade na API pública do BCB (IF.data).
 * Endpoint: https://olinda.bcb.gov.br/olinda/servico/taxaJuros/versao/v2/...
 * Sem autenticação. Cache de 1h recomendado.
 */
export async function fetchInterestRates(modality: string, top = 20): Promise<InterestRateRecord[]> {
  try {
    const filter = encodeURIComponent(`Modalidade eq '${modality}'`);
    const url = `https://olinda.bcb.gov.br/olinda/servico/taxaJuros/versao/v2/odata/ResponsabilidadeCredito?$top=${top}&$filter=${filter}&$format=json&$orderby=TaxaJurosAoMes%20asc`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const json = await res.json() as { value?: InterestRateRecord[] };
    return json.value ?? [];
  } catch {
    return [];
  }
}

export async function fetchPtax(): Promise<PtaxRate | null> {
  const findPtax = async (date: Date) => {
    const ds = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}-${date.getFullYear()}`;
    const url = `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarDia(dataCotacao=@dataCotacao)?@dataCotacao='${ds}'&$format=json`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    return res.json() as Promise<{ value: Array<{ cotacaoCompra: number; cotacaoVenda: number }> }>;
  };

  try {
    let ptax = await findPtax(new Date());
    if (!ptax?.value?.length) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      ptax = await findPtax(yesterday);
    }

    if (ptax?.value?.length) {
      const last = ptax.value[ptax.value.length - 1];
      return { compra: last.cotacaoCompra, venda: last.cotacaoVenda };
    }
    return null;
  } catch {
    return null;
  }
}
