import { db } from "../lib/db.js";
import * as CentralBankGateway from "../gateways/CentralBankGateway.js";
import { logger } from "../lib/logger.js";

const MODALITIES = [
  'Pessoa Física - Empréstimo pessoal não consignado',
  'Pessoa Física - Empréstimo pessoal consignado público',
  'Pessoa Física - Cheque especial',
  'Pessoa Física - Aquisição de veículos',
  'Pessoa Jurídica - Capital de giro girado no exterior',
  'Pessoa Jurídica - Desconto de duplicatas',
];

export async function syncMarketInterestRates() {
  logger.info('[MarketSync] Iniciando sincronização de taxas de juros...');
  
  let totalUpserted = 0;

  for (const modality of MODALITIES) {
    try {
      logger.debug(`[MarketSync] Buscando modalidade: ${modality}`);
      const records = await CentralBankGateway.fetchInterestRates(modality, 50); // Pegamos o Top 50
      
      if (!records || records.length === 0) {
        logger.warn(`[MarketSync] Nenhum registro encontrado para modalidade: ${modality}`);
        continue;
      }

      // Upsert cada registro para manter o banco atualizado sem duplicar
      // Usamos uma transação para garantir atomicidade por modalidade
      await db.$transaction(
        records.map((record) => 
          db.marketInterestRate.upsert({
            where: {
              modality_institution: {
                modality: record.Modalidade,
                institution: record.InstituicaoFinanceira,
              }
            },
            update: {
              monthlyRate: record.TaxaJurosAoMes,
              annualRate: record.TaxaJurosAoAno,
              cnpj8: record.cnpj8,
              updatedAt: new Date(),
            },
            create: {
              modality: record.Modalidade,
              institution: record.InstituicaoFinanceira,
              cnpj8: record.cnpj8,
              monthlyRate: record.TaxaJurosAoMes,
              annualRate: record.TaxaJurosAoAno,
            },
          })
        )
      );
      
      totalUpserted += records.length;
      logger.info(`[MarketSync] ${records.length} registros sincronizados para: ${modality}`);
    } catch (error) {
      logger.error(`[MarketSync] Falha ao sincronizar modalidade: ${modality}`, error);
    }
  }

  logger.info(`[MarketSync] Sincronização concluída. Total de registros: ${totalUpserted}`);
  return { totalUpserted };
}
