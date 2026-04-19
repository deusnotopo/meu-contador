/**
 * TesouroGateway
 * ──────────────
 * Infrastructure layer for Treasury Bills.
 */

export interface TesouroBill {
  nome: string;
  vencimento: string;
  taxa: number;
  preco: number;
  tipo: 'IPCA+' | 'Prefixado' | 'Selic';
}

const FALLBACK: TesouroBill[] = [
  { nome: 'Tesouro IPCA+ 2035', vencimento: '15/05/2035', taxa: 6.31, preco: 3248.12, tipo: 'IPCA+' },
  { nome: 'Tesouro Prefixado 2029', vencimento: '01/01/2029', taxa: 12.56, preco: 878.40, tipo: 'Prefixado' },
  { nome: 'Tesouro Selic 2029', vencimento: '01/03/2029', taxa: 0.15, preco: 13780.45, tipo: 'Selic' },
];

export async function fetchBills(): Promise<TesouroBill[]> {
  try {
    const url = 'https://www.tesourodireto.com.br/json/br/com/b3/tesourodireto/component/taxasTesouroDireto.json';
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error('TD_DOWN');
    
    const data = await res.json() as any;
    const list = data.response?.TrsrBdTradgList || [];
    
    if (!list.length) return FALLBACK;
    
    return list.slice(0, 6).map((item: any) => {
      const cd = item.TrsrBd?.bd?.cd;
      return {
        nome: item.TrsrBd?.nm || 'Título',
        vencimento: item.TrsrBd?.mtrtyDt?.slice(0, 10) || 'N/A',
        taxa: parseFloat(item.TrsrBd?.anulInvstmtRate ?? '0'),
        preco: parseFloat(item.TrsrBd?.untrInvstmtVal ?? '0'),
        tipo: cd === 'NTN-B' ? 'IPCA+' : cd === 'LTN' ? 'Prefixado' : 'Selic',
      };
    });
  } catch {
    return FALLBACK;
  }
}
