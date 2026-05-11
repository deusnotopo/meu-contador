import { PluggyClient, Item } from 'pluggy-sdk';
import { db } from '../lib/db';
import { logger } from '../lib/logger.js';

const clientId = process.env.PLUGGY_CLIENT_ID;
const clientSecret = process.env.PLUGGY_CLIENT_SECRET;

// Lazy initialization - only create client when credentials are available
let _pluggyClient: PluggyClient | null = null;

export function getPluggyClient(): PluggyClient | null {
  if (!_pluggyClient && clientId && clientSecret) {
    _pluggyClient = new PluggyClient({
      clientId,
      clientSecret,
    });
  }
  return _pluggyClient;
}

// For backward compatibility
export const pluggyClient = getPluggyClient();

/**
 * Retorna o Connect Token usado pelo FrontEnd para renderizar o Widget do Pluggy.
 */
export async function getConnectToken(itemId?: string) {
  try {
    const client = getPluggyClient();
    if (!client) throw new Error("Pluggy Client not configured");
    const token = await client.createConnectToken(itemId);
    return token.accessToken;
  } catch (err) {
    logger.error('[Pluggy] Erro ao gerar Connect Token', err);
    throw new Error("Não foi possível conectar ao provedor Open Finance.");
  }
}

/**
 * Função para iniciar a sincronização inicial após o item ser conectado.
 * (Pode demorar, o ideal é o webhook assumir isso)
 */
export async function syncBankConnection(itemId: string, userId: string) {
  try {
    const client = getPluggyClient();
    if (!client) throw new Error("Pluggy Client not configured");

    // 1. Pega informações do Item
    const item = await client.fetchItem(itemId);
    
    // 2. Registra o Item (Conexão) no nosso BD
    const bankConnection = await db.bankConnection.upsert({
      where: { pluggyItemId: itemId },
      update: {
        status: item.status,
      },
      create: {
        pluggyItemId: itemId,
        status: item.status,
        userId: userId,
      }
    });

    // 3. Pega as contas atreladas a esta conexão
    const accounts = await client.fetchAccounts(itemId);
    
    // 4. Salva contas no nosso BD
    for (const acc of accounts.results) {
      const bankAccount = await db.bankAccount.upsert({
        where: { pluggyAccountId: acc.id },
        update: {
          balance: Math.round(acc.balance * 100),
          currencyCode: acc.currencyCode,
          type: acc.type,
          subtype: acc.subtype,
          bankName: item.connector ? item.connector.name : null,
          bankImageUrl: item.connector ? item.connector.imageUrl : null,
          userId: userId,
          connectionId: bankConnection.id,
        },
        create: {
          pluggyAccountId: acc.id,
          name: acc.name,
          balance: Math.round(acc.balance * 100),
          currencyCode: acc.currencyCode,
          type: acc.type,
          subtype: acc.subtype,
          bankName: item.connector ? item.connector.name : null,
          bankImageUrl: item.connector ? item.connector.imageUrl : null,
          userId: userId,
          connectionId: bankConnection.id,
        }
      });

      // 4.1. Sincroniza as transações dessa conta
      try {
        const transactions = await client.fetchTransactions(acc.id);
        
        const insertData = transactions.results.map((t) => ({
          userId: userId,
          description: t.description || 'Transação Pluggy',
          amount: Math.abs(Math.round(t.amount * 100)),
          type: t.amount >= 0 ? "income" : "expense",
          category: "Outros",
          date: new Date(t.date),
          paymentMethod: "Pluggy",
          scope: "personal", // Transações pluggy são pessoais por padrão (no app Meu Contador, o usuário separa se quiser)
          bankAccountId: bankAccount.id,
          pluggyTransactionId: t.id,
        }));

        if (insertData.length > 0) {
          // Utiliza tipagem correta em vez de as any. O TransactionRepository cuida das validações severas.
          await db.transaction.createMany({
            data: insertData,
          });
        }

        // 4.2 Conciliação: Injetar Saldo Inicial de Ajuste
        // O app se baseia na soma de Transaction para o saldo. Somar apenas 90 dias do Pluggy daria saldo distorcido.
        // Calculamos o Saldo Importado e criamos uma transação no passado para o Saldo Total bater com o BankAccount.balance
        const sumImported = transactions.results.reduce((acc, t) => {
          return acc + Math.round(t.amount * 100);
        }, 0);

        const diff = bankAccount.balance - sumImported;
        
        await db.transaction.upsert({
          where: { pluggyTransactionId: `opening-${bankAccount.id}` },
          update: { 
            amount: Math.abs(diff), 
            type: diff >= 0 ? 'income' : 'expense' 
          },
          create: {
            userId: userId,
            description: `Saldo Inicial - ${bankAccount.name}`,
            amount: Math.abs(diff),
            type: diff >= 0 ? "income" : "expense",
            category: "Outros",
            date: new Date("2020-01-01T00:00:00.000Z"), // Bem no passado
            paymentMethod: "Pluggy",
            scope: "personal",
            bankAccountId: bankAccount.id,
            pluggyTransactionId: `opening-${bankAccount.id}`,
          }
        });

      } catch (err) {
        logger.error(`[Pluggy] Erro ao sincronizar transações da conta ${acc.id}`, err);
        // Não quebra a sync das outras contas
      }
    }

    // 5. Atualiza data de sync
    await db.bankConnection.update({
      where: { id: bankConnection.id },
      data: { lastSyncAt: new Date() }
    });

    return bankConnection;
  } catch (error) {
    logger.error('[Pluggy] Error syncing Pluggy Item', error);
    throw error;
  }
}


