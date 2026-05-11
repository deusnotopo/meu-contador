/**
 * TesouroGateway
 * ──────────────
 * Infrastructure layer for Treasury Bills (Tesouro Direto).
 * Sem dados de fallback hardcoded — se a fonte estiver offline, retorna [].
 * O frontend é responsável por exibir o estado "indisponível".
 */

export interface TesouroBill {
  nome: string;
  vencimento: string;
  taxa: number;
  preco: number;
  tipo: 'IPCA+' | 'Prefixado' | 'Selic';
}

// Endpoint público do Tesouro Nacional (sem autenticação)
const TD_URL = 'https://www.tesourodireto.com.br/json/br/com/b3/tesourodireto/component/taxasTesouroDireto.json';

function parseTipo(cd: string | undefined): TesouroBill['tipo'] {
  if (!cd) return 'Selic';
  if (cd.includes('NTN-B') || cd.includes('IPCA')) return 'IPCA+';
  if (cd.includes('LTN') || cd.includes('Prefixado')) return 'Prefixado';
  return 'Selic';
}

export async function fetchBills(): Promise<TesouroBill[]> {
  try {
    const res = await fetch(TD_URL, {
      signal: AbortSignal.timeout(8000),
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) throw new Error(`TD_HTTP_${res.status}`);

    const data = await res.json() as { response?: { TrsrBdTradgList?: unknown[] } };
    const list = data.response?.TrsrBdTradgList ?? [];
    if (!list.length) return [];

    return list.slice(0, 6).map((item: unknown) => {
      const i = item as Record<string, Record<string, unknown>>;
      const bd = i.TrsrBd ?? {};
      return {
        nome: String(bd.nm ?? 'Título'),
        vencimento: String(bd.mtrtyDt ?? 'N/A').slice(0, 10),
        taxa: parseFloat(String(bd.anulInvstmtRate ?? '0')),
        preco: parseFloat(String(bd.untrInvstmtVal ?? '0')),
        tipo: parseTipo(String((bd.bd as Record<string, unknown>)?.cd ?? '')),
      };
    });
  } catch {
    // Sem fallback hardcoded — dados desatualizados são piores que nenhum dado
    return [];
  }
}
