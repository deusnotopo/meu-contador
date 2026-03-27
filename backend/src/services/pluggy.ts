import { PluggyClient, Item } from 'pluggy-sdk';
import { db } from '../lib/db';

const clientId = process.env.PLUGGY_CLIENT_ID;
const clientSecret = process.env.PLUGGY_CLIENT_SECRET;

export const pluggyClient = new PluggyClient({
  clientId: clientId || '',
  clientSecret: clientSecret || '',
});

/**
 * Retorna o Connect Token usado pelo FrontEnd para renderizar o Widget do Pluggy.
 */
export async function getConnectToken(itemId?: string) {
  try {
    const token = await pluggyClient.createConnectToken(itemId);
    return token.accessToken;
  } catch (err) {
    console.error("Erro ao gerar Pluggy Connect Token:", err);
    throw new Error("Não foi possível conectar ao provedor Open Finance.");
  }
}

/**
 * Função para iniciar a sincronização inicial após o item ser conectado.
 * (Pode demorar, o ideal é o webhook assumir isso)
 */
export async function syncBankConnection(itemId: string, userId: string) {
  try {
    // 1. Pega informações do Item
    const item = await pluggyClient.fetchItem(itemId);
    
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
    const accounts = await pluggyClient.fetchAccounts(itemId);
    
    // 4. Salva contas no nosso BD
    for (const acc of accounts.results) {
      const bankAccount = await db.bankAccount.upsert({
        where: { pluggyAccountId: acc.id },
        update: {
          balance: acc.balance,
          bankName: item.connector ? item.connector.name : null,
          bankImageUrl: item.connector ? item.connector.imageUrl : null,
        },
        create: {
          pluggyAccountId: acc.id,
          name: acc.name,
          balance: acc.balance,
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
        const transactions = await pluggyClient.fetchTransactions(acc.id);
        
        const insertData = transactions.results.map((t) => ({
          userId: userId,
          description: t.description || 'Transação Pluggy',
          amount: t.amount,
          type: t.amount >= 0 ? "income" : "expense",
          category: "Outros", // Dependendo do Pluggy t.category, pode-se mapear
          date: new Date(t.date),
          paymentMethod: "Pluggy",
          scope: "personal", // Transações pluggy são pessoais por padrão (no app Meu Contador, o usuário separa se quiser)
          bankAccountId: bankAccount.id,
          pluggyTransactionId: t.id,
        }));

        if (insertData.length > 0) {
          await db.transaction.createMany({
            data: insertData,
            skipDuplicates: true, // pluggyTransactionId é @unique, previne duplicadas
          });
        }

        // 4.2 Conciliação: Injetar Saldo Inicial de Ajuste
        // O app se baseia na soma de Transaction para o saldo. Somar apenas 90 dias do Pluggy daria saldo distorcido.
        // Calculamos o Saldo Importado e criamos uma transação no passado para o Saldo Total bater com o BankAccount.balance
        const sumImported = transactions.results.reduce((acc, t) => {
          return acc + (t.amount >= 0 ? t.amount : -Math.abs(t.amount)); 
          // O amount do Pluggy já vem com sinal na maioria dos casos, mas dependendo pode vir apenas positivo e com type em outro field. 
          // O SDK garante amount negativo para despesa.
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
        console.error(`Erro ao sincronizar transações da conta ${acc.id}:`, err);
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
    console.error("Error syncing Pluggy Item:", error);
    throw error;
  }
}


