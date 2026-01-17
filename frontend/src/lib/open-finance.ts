import type { Transaction } from "@/types";
import { v4 as uuidv4 } from "uuid";

export interface BankAccount {
  id: string;
  name: string;
  institution: string;
  balance: number;
  currency: string;
  type: "checking" | "savings" | "credit_card";
}

export interface BankConnection {
  id: string;
  institution: string;
  status: "active" | "error" | "disconnected";
  lastSync: string;
}

/**
 * High-fidelity Mock Provider for Open Finance testing.
 * Simulates real-world banking API responses.
 */
export const MockBankProvider = {
  getInstitutions: () => [
    { id: "nubank", name: "Nubank", color: "#8a05be" },
    { id: "itau", name: "Itaú", color: "#ec7000" },
    { id: "inter", name: "Inter", color: "#ff7a00" },
    { id: "btg", name: "BTG Pactual", color: "#001a33" },
  ],

  getAccounts: async (institution: string): Promise<BankAccount[]> => {
    // Artificial delay to simulate network
    await new Promise(r => setTimeout(r, 1500));
    return [
      {
        id: uuidv4(),
        name: "Conta Corrente",
        institution,
        balance: 15420.50,
        currency: "BRL",
        type: "checking"
      }
    ];
  },

  syncTransactions: async (accountId: string): Promise<Partial<Transaction>[]> => {
    await new Promise(r => setTimeout(r, 2000));
    
    // Simulate 3 new transactions
    return [
      {
        description: "Assinatura Netflix",
        amount: 55.90,
        type: "expense",
        category: "Entertainment",
        date: new Date().toISOString().split('T')[0],
        paymentMethod: "Cartão de Crédito",
        status: "confirmed"
      },
      {
        description: "Mercado Central",
        amount: 432.15,
        type: "expense",
        category: "Food",
        date: new Date().toISOString().split('T')[0],
        paymentMethod: "Débito",
        status: "confirmed"
      },
      {
        description: "Pix Recebido",
        amount: 2500.00,
        type: "income",
        category: "Freelance",
        date: new Date().toISOString().split('T')[0],
        paymentMethod: "Pix",
        status: "confirmed"
      }
    ];
  }
};
