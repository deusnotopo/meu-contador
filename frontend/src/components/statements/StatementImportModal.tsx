import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { logger } from '@/lib/logger';
import { parseStatementFile, detectFormat } from '@/lib/statements/parser';
import { categorizeTransaction, detectDuplicates, getCategorySuggestions } from '@/lib/statements/categorizer';
import type { StatementTransaction, StatementFormat } from '../../../../shared/types-statement';
import { showSuccess, showError } from '@/lib/toast';
import { useTransactions } from '@/hooks/useTransactions';
import type { TransactionFormData } from '@/types';

interface StatementImportModalProps {
  onClose: () => void;
  onImportComplete?: () => void;
}

export const StatementImportModal: React.FC<StatementImportModalProps> = ({
  onClose,
  onImportComplete,
}) => {
  const [fileName, setFileName] = useState('');
  const [format, setFormat] = useState<StatementFormat>('csv');
  const [transactions, setTransactions] = useState<StatementTransaction[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'upload' | 'review' | 'confirm'>('upload');
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const personalTransactions = useTransactions('personal');

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  const handleFileSelect = async (selectedFile: File) => {
    if (selectedFile.size > MAX_FILE_SIZE) {
      showError('Arquivo muito grande (máximo 10MB)');
      return;
    }
    setFileName(selectedFile.name);
    setImportErrors([]);
    const detectedFormat = detectFormat(selectedFile);
    setFormat(detectedFormat);
    setIsProcessing(true);
    try {
      const parsed = await parseStatementFile(selectedFile, detectedFormat);
      const categorized = parsed.map((tx) => {
        const cat = categorizeTransaction(tx.description);
        return { ...tx, category: cat.category, categoryConfidence: cat.confidence };
      });
      const existingTransactions = personalTransactions.transactions.map((tx) => ({
        date: tx.date,
        description: tx.description,
        amount: tx.amount,
      }));
      const duplicates = detectDuplicates(
        categorized.map((tx) => ({ date: tx.date, description: tx.description, amount: tx.amount })),
        existingTransactions
      );
      const prepared = categorized.map((tx, index) => ({
        ...tx,
        isDuplicate: duplicates.has(index),
        status: duplicates.has(index) ? 'ignored' as const : 'confirmed' as const,
      }));
      setTransactions(prepared);
      setStep('review');
      showSuccess(`${prepared.length} transações encontradas`);
    } catch (err) {
      showError('Erro ao processar arquivo');
      logger.error('[StatementImport] File parse failed', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = async () => {
    setStep('confirm');
    setIsProcessing(true);
    let imported = 0;
    const errors: string[] = [];
    for (const tx of transactions) {
      if (tx.status !== 'confirmed') continue;
      try {
        const formData: TransactionFormData = {
          type: tx.type === 'income' ? 'income' : 'expense',
          description: tx.description,
          amount: tx.amount.toString(),
          category: tx.category || 'Outros',
          date: tx.date,
          paymentMethod: 'pix',
          notes: `Importado via ${format.toUpperCase()} · origem=${tx.provenance?.origin || 'N/A'} · confiabilidade=${tx.dataReliability || 'REAL'}`,
          recurring: false,
          scope: 'personal',
          classification: 'necessity',
        };
        await personalTransactions.addTransaction(formData);
        imported++;
      } catch (err) {
        errors.push(tx.description);
        logger.error('[StatementImport] Transaction import failed', { description: tx.description, err });
      }
    }
    setImportErrors(errors);
    if (errors.length > 0) {
      showError(`${errors.length} transações falharam na importação`);
      setIsProcessing(false);
      setStep('review');
      return;
    }
    showSuccess(`${imported} transações importadas`);
    onImportComplete?.();
    onClose();
  };

  const confirmedCount = transactions.filter((t) => t.status === 'confirmed').length;
  const totalIncome = transactions.filter((t) => t.status === 'confirmed' && t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.status === 'confirmed' && t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const lowConfidenceCount = transactions.filter((t) => (t.categoryConfidence || 0) < 0.6).length;
  const duplicateCount = transactions.filter((t) => t.isDuplicate).length;
  const heuristicCount = transactions.filter((t) => t.dataReliability && t.dataReliability !== 'REAL').length;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        >
          <Card className="glass-premium border-white/10">
            <CardHeader className="border-b border-white/10">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <FileText className="text-indigo-400" size={24} />
                  Importar Extrato
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl">
                  <X size={20} />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {step === 'upload' && (
                <div className="space-y-6">
                  <p className="text-neutral-500 text-sm">
                    Faça upload de um arquivo CSV, OFX, PDF ou imagem do seu extrato bancário.
                  </p>
                  <div
                    className="border-2 border-dashed border-white/20 rounded-xl p-12 text-center cursor-pointer hover:border-indigo-500/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload size={48} className="mx-auto mb-4 text-neutral-500" />
                    <p className="text-neutral-400 font-medium mb-2">
                      Arraste o arquivo ou clique para selecionar
                    </p>
                    <p className="text-neutral-500 text-sm">
                      Suporta CSV, OFX, PDF e imagens (JPG, PNG, WEBP)
                    </p>
                  </div>
                  {fileName && <p className="text-neutral-500 text-xs">Arquivo: {fileName}</p>}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.ofx,.pdf,.jpg,.jpeg,.png,.webp"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  />
                  {isProcessing && (
                    <div className="text-center py-4">
                      <Loader2 className="animate-spin text-indigo-400 mx-auto mb-2" size={32} />
                      <p className="text-neutral-500">Processando arquivo...</p>
                    </div>
                  )}
                </div>
              )}

              {step === 'review' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-white font-bold">{transactions.length} transações encontradas</p>
                      <p className="text-neutral-500 text-xs">
                        {duplicateCount} duplicadas ignoradas · {lowConfidenceCount} com baixa confiança · {heuristicCount} estimadas/heurísticas
                      </p>
                      <p className="text-neutral-500 text-sm">
                        {confirmedCount} confirmadas · R$ {totalIncome.toFixed(2)} receita · R$ {totalExpense.toFixed(2)} despesa
                      </p>
                    </div>
                    <Button onClick={() => setTransactions(transactions.map((t) => ({ ...t, status: t.isDuplicate ? 'ignored' : 'confirmed' })))} variant="outline" size="sm">
                      Confirmar todas
                    </Button>
                  </div>

                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {transactions.map((tx, i) => (
                      <div key={tx.id} className="glass rounded-xl p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={tx.status === 'confirmed'}
                              disabled={tx.isDuplicate}
                              onChange={() => {
                                const updated = [...transactions];
                                if (updated[i]) {
                                  updated[i].status = updated[i].status === 'confirmed' ? 'pending' : 'confirmed';
                                  setTransactions(updated);
                                }
                              }}
                              className="w-4 h-4 rounded border-white/20 bg-transparent"
                            />
                            <div>
                              <p className="text-white font-medium text-sm">{tx.description}</p>
                              <p className="text-neutral-500 text-xs">{tx.date} · {tx.category}</p>
                              {tx.provenance && (
                                <p className="text-neutral-500 text-[11px]">
                                  Origem: {tx.provenance.origin} · Confiabilidade: {tx.provenance.reliability}
                                </p>
                              )}
                              {tx.isDuplicate && <p className="text-amber-400 text-xs">Duplicada detectada</p>}
                              {(tx.categoryConfidence || 0) < 0.6 && !tx.isDuplicate && (
                                <p className="text-yellow-400 text-xs">
                                  Baixa confiança · sugestões: {getCategorySuggestions(tx.description, 2).map((s) => s.category).join(', ')}
                                </p>
                              )}
                              {tx.provenance?.issues?.map((issue) => (
                                <p key={`${tx.id}-${issue.code}`} className="text-amber-300 text-xs">
                                  {issue.message}
                                </p>
                              ))}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold text-sm ${tx.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                              {tx.type === 'income' ? '+' : '-'} R$ {tx.amount.toFixed(2)}
                            </p>
                            <p className="text-neutral-500 text-xs">
                              {Math.round((tx.categoryConfidence || 0) * 100)}% confiança
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" onClick={() => { setStep('upload'); setTransactions([]); }} className="flex-1">
                      Voltar
                    </Button>
                    <Button onClick={handleConfirm} className="flex-1 bg-indigo-600 hover:bg-indigo-500" disabled={confirmedCount === 0}>
                      Importar {confirmedCount} transações
                    </Button>
                  </div>
                </div>
              )}

              {step === 'confirm' && (
                <div className="text-center py-12">
                  <Loader2 className="animate-spin text-indigo-400 mx-auto mb-4" size={48} />
                  <p className="text-white font-bold text-lg">Importando transações...</p>
                  <p className="text-neutral-500">Aguarde enquanto processamos seus dados</p>
                  {importErrors.length > 0 && (
                    <div className="mt-4 text-left text-xs text-red-300">
                      {importErrors.map((error) => (
                        <div key={error}>Falha: {error}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
