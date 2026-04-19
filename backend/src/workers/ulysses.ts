// src/workers/ulysses.ts

import { db } from '../lib/db';
import { writeAuditLog } from '../lib/audit';

/**
 * Ulysses Engine (O Contrato de Ulisses)
 * 
 * Este worker realiza varreduras em background para usuários sob o plano Pro.
 * O conceito baseia-se em "amarrar" o usuário aos seus próprios limites pré-estabelecidos
 * (thresholds de limite), alertando e recomendando a transferência inteligente 
 * do excedente para "Investimentos", visando proteger o patrimônio de impulsos emocionais.
 */
export class UlyssesEngine {
  /**
   * Avalia as regras do "Contrato de Ulisses" para garantir a integridade do planejamento.
   * Quando o saldo em conta corrobora a quebra de um teto pre-estabelecido, a engine 
   * atua de forma preditiva.
   */
  public static async evaluateRules() {
    console.log('[Neural AI] Iniciando varredura do Ulysses Contract...');
    
    // Busca os usuários PRO elegíveis para o monitoramento inteligente
    const users = await db.user.findMany({ 
      where: { isPro: true },
      select: { id: true } 
    });

    let triggeredCount = 0;
    
    for (const user of users) {
      try {
        // Cálculo preditivo do saldo recente
        const transactions = await db.transaction.findMany({
            where: { userId: user.id },
            orderBy: { date: 'desc' },
            take: 100 // Limitando histórico para agilidade
        });

        const currentBalance = transactions.reduce(
          (acc, t) => acc + (t.type === 'income' ? t.amount : -t.amount), 
          0
        );

        // Simulador heurístico: Assumimos um teto médio protetivo de R$ 5.000,00 para disparo
        // (Em produção: buscar isso das preferências do usuário no BD)
        const SAFE_THRESHOLD = 5000 * 100; // Multiplicado por 100 por causa da arquitetura Cents
        
        if (currentBalance > SAFE_THRESHOLD) {
          const surplus = currentBalance - SAFE_THRESHOLD;
          
          await writeAuditLog({
            userId: user.id,
            action: 'ULYSSES_RULE_TRIGGERED',
            resource: 'ulysses_engine',
            metadata: {
              currentBalance: currentBalance / 100,
              surplus: surplus / 100,
              action_taken: `Alerta Neuronal: Saldo ultrapassou o teto. Sugerimos realocar R$ ${(surplus / 100).toFixed(2)} para Investimentos/Segurança imediatamente.`
            }
          });
          
          triggeredCount++;
        }
      } catch (err) {
        console.error(`[Neural AI] Falha ao processar Ulysses para o usuário ${user.id}`, err);
      }
    }
    
    return { 
      status: 'completed', 
      usersScanned: users.length, 
      engagementsTriggered: triggeredCount 
    };
  }
}
