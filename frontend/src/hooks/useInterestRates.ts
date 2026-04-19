import { useState, useCallback, useEffect } from 'react';
import { api } from '@/lib/api';

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

export type CreditModality = 
  | "CREDITO PESSOAL NAO CONSIGNADO VINCULADO AO ARRANJO PIX"
  | "CREDITO PESSOAL NAO CONSIGNADO"
  | "CREDITO PESSOAL CONSIGNADO INSS"
  | "CREDITO PESSOAL CONSIGNADO PUBLICO"
  | "CREDITO PESSOAL CONSIGNADO PRIVADO"
  | "CHEQUE ESPECIAL"
  | "AQUISICAO DE VEICULOS"
  | "CARTAO DE CREDITO - PARCELADO"
  | "CARTAO DE CREDITO - ROTATIVO REGULAR"
  | "CARTAO DE CREDITO - ROTATIVO NAO REGULAR"
  | "CARTAO DE CREDITO - ROTATIVO TOTAL"
  | "ANTECIPACAO DE SAQUE ANIVERSARIO FGTS";

export function useInterestRates(autoFetchModality: CreditModality | null = null) {
  const [rates, setRates] = useState<InterestRateRecord[]>([]);
  const [modalities, setModalities] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRates = useCallback(async (modality: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<{ records: InterestRateRecord[] }>(`/market/interest-rates?modality=${encodeURIComponent(modality)}&$top=20`);
      setRates(data.records || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Falha ao buscar ranking de juros.');
      setRates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchModalities = useCallback(async () => {
    try {
      // Usaremos as opções pré-definidas ou um endpoint de lista caso criemos no backend futuramente.
      // Atualmente listamos localmente as principais.
      setModalities([
        "CREDITO PESSOAL NAO CONSIGNADO",
        "AQUISICAO DE VEICULOS",
        "CHEQUE ESPECIAL",
        "CARTAO DE CREDITO - PARCELADO",
        "CARTAO DE CREDITO - ROTATIVO TOTAL",
        "CREDITO PESSOAL CONSIGNADO INSS"
      ]);
    } catch (e) {
      // fallback
    }
  }, []);

  useEffect(() => {
    fetchModalities();
    if (autoFetchModality) {
      fetchRates(autoFetchModality);
    }
  }, [autoFetchModality, fetchRates, fetchModalities]);

  return {
    rates,
    modalities,
    loading,
    error,
    fetchRates
  };
}
