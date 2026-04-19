import { useState, useCallback } from "react";
import { api } from "@/lib/api";

export type VehicleType = "carros" | "motos" | "caminhoes";

export interface FipeBrand {
  codigo: string;
  nome: string;
}

export interface FipeModel {
  codigo: number;
  nome: string;
}

export interface FipeYear {
  codigo: string;
  nome: string;
}

export interface FipePrice {
  Valor: string;
  Marca: string;
  Modelo: string;
  AnoModelo: number;
  Combustivel: string;
  CodigoFipe: string;
  MesReferencia: string;
  TipoVeiculo: number;
  SiglaCombustivel: string;
  DataConsulta: string;
}

export function useFipe() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getBrands = useCallback(
    async (type: VehicleType): Promise<FipeBrand[]> => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.get<{ records: FipeBrand[] }>(
          `/assets/fipe/brands/${type}`,
        );
        return data.records || [];
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : "Falha ao buscar marcas na Tabela FIPE.",
        );
        return [];
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const getModels = useCallback(
    async (type: VehicleType, brandCode: string): Promise<FipeModel[]> => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.get<{ records: { modelos: FipeModel[] } }>(
          `/assets/fipe/models/${type}/${brandCode}`,
        );
        return data.records?.modelos || [];
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : "Falha ao buscar modelos na Tabela FIPE.",
        );
        return [];
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const getYears = useCallback(
    async (
      type: VehicleType,
      brandCode: string,
      modelCode: string,
    ): Promise<FipeYear[]> => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.get<{ records: FipeYear[] }>(
          `/assets/fipe/years/${type}/${brandCode}/${modelCode}`,
        );
        return data.records || [];
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : "Falha ao buscar anos na Tabela FIPE.",
        );
        return [];
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const getPrice = useCallback(
    async (fipeCode: string): Promise<FipePrice | null> => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.get<{ records: FipePrice[] }>(
          `/assets/fipe/prices/${fipeCode}`,
        );
        // A API /prices/:fipe_code retorna uma lista de todos os anos ou o mais recente dependendo da impl.
        // Assumimos que o backend faz proxy do BrasilAPI que retorna [{ Valor... }]
        return data.records?.[0] || null;
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : "Falha ao consultar preço na Tabela FIPE.",
        );
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Busca o preço exato com marca, modelo e ano (caso o código FIPE não esteja disponível diretamente)
  const getSpecificPrice = useCallback(
    async (
      type: VehicleType,
      brandCode: string,
      modelCode: string,
      yearCode: string,
    ): Promise<FipePrice | null> => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.get<{ records: FipePrice }>(
          `/assets/fipe/valuation/${type}/${brandCode}/${modelCode}/${yearCode}`,
        );
        return data.records || null;
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : "Falha ao consultar avaliação na Tabela FIPE.",
        );
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return {
    loading,
    error,
    getBrands,
    getModels,
    getYears,
    getPrice,
    getSpecificPrice,
  };
}
