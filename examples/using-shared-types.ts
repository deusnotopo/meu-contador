// 📝 Exemplo: Como Usar Tipos Compartilhados
// Este arquivo mostra como importar e usar os tipos de shared/types.ts

// ============================================
// FRONTEND - Exemplo de Hook
// ============================================

import { useState, useEffect } from 'react';
import type { Transaction, ApiResponse } from '../../shared/types';

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTransactions() {
      try {
        setLoading(true);
        const response = await fetch('/api/transactions');
        const data: ApiResponse<Transaction[]> = await response.json();
        
        if (data.success && data.data) {
          setTransactions(data.data);
        } else {
          setError(data.error?.message || 'Erro ao carregar transações');
        }
      } catch (err) {
        setError('Erro de conexão');
      } finally {
        setLoading(false);
      }
    }

    fetchTransactions();
  }, []);

  return { transactions, loading, error };
}

// ============================================
// FRONTEND - Exemplo de Componente
// ============================================

import React from 'react';
import type { Transaction, TransactionCategory } from '../../shared/types';
import { TRANSACTION_CATEGORIES } from '../../shared/types';

interface TransactionListProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
}

export function TransactionList({ transactions, onEdit, onDelete }: TransactionListProps) {
  const getCategoryLabel = (category: TransactionCategory): string => {
    return TRANSACTION_CATEGORIES.find(c => c.value === category)?.label || category;
  };

  return (
    <div className="space-y-4">
      {transactions.map((transaction) => (
        <div key={transaction.id} className="p-4 border rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold">{transaction.description}</h3>
              <p className="text-sm text-gray-500">
                {getCategoryLabel(transaction.category)} • {transaction.date.toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                R$ {transaction.amount.toFixed(2)}
              </span>
              <button onClick={() => onEdit(transaction)}>Editar</button>
              <button onClick={() => onDelete(transaction.id)}>Excluir</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================
// BACKEND - Exemplo de Rota
// ============================================

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { Transaction, ApiResponse } from '../shared/types';

// Schema de validação com Zod
const createTransactionSchema = z.object({
  type: z.enum(['income', 'expense', 'transfer']),
  category: z.enum([
    'alimentacao', 'transporte', 'moradia', 'saude', 'educacao',
    'lazer', 'vestuario', 'servicos', 'investimentos', 'outros'
  ]),
  amount: z.number().positive(),
  description: z.string().min(1).max(255),
  date: z.string().datetime(),
  tags: z.array(z.string()).optional(),
});

export async function transactionRoutes(fastify: FastifyInstance) {
  // Listar transações
  fastify.get('/api/transactions', async (request, reply): Promise<ApiResponse<Transaction[]>> => {
    try {
      const userId = request.user.id;
      const transactions = await fastify.prisma.transaction.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
      });

      return {
        success: true,
        data: transactions as Transaction[],
      };
    } catch (error) {
      request.log.error(error);
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'Erro ao buscar transações',
        },
      };
    }
  });

  // Criar transação
  fastify.post('/api/transactions', {
    schema: {
      body: createTransactionSchema,
    },
  }, async (request, reply): Promise<ApiResponse<Transaction>> => {
    try {
      const userId = request.user.id;
      const data = request.body as z.infer<typeof createTransactionSchema>;

      const transaction = await fastify.prisma.transaction.create({
        data: {
          ...data,
          userId,
          date: new Date(data.date),
        },
      });

      return {
        success: true,
        data: transaction as Transaction,
      };
    } catch (error) {
      request.log.error(error);
      return {
        success: false,
        error: {
          code: 'CREATE_ERROR',
          message: 'Erro ao criar transação',
        },
      };
    }
  });
}

// ============================================
// UTILITÁRIOS - Exemplo de Helper
// ============================================

import type { TransactionCategory, InvestmentType } from '../shared/types';
import { TRANSACTION_CATEGORIES, INVESTMENT_TYPES } from '../shared/types';

export function getCategoryLabel(category: TransactionCategory): string {
  return TRANSACTION_CATEGORIES.find(c => c.value === category)?.label || category;
}

export function getInvestmentTypeLabel(type: InvestmentType): string {
  return INVESTMENT_TYPES.find(t => t.value === type)?.label || type;
}

export function formatCurrency(amount: number, currency: 'BRL' | 'USD' | 'EUR' = 'BRL'): string {
  const formatters = {
    BRL: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }),
    USD: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
    EUR: new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }),
  };
  
  return formatters[currency].format(amount);
}

export function calculatePercentage(current: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((current / total) * 100);
}