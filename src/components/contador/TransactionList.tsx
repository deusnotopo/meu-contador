import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDate } from "@/lib/formatters";
import type { Transaction } from "@/types";
import { Calendar, ChevronDown, Edit2, FileText, Trash2 } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "../ui/EmptyState";
import { PrivacyValue } from "../ui/PrivacyValue";

interface TransactionListProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: number) => void;
}

const PAGE_SIZE = 20;

export const TransactionList = ({
  transactions,
  onEdit,
  onDelete,
}: TransactionListProps) => {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const hasMore = transactions.length > visibleCount;
  const visibleTransactions = transactions.slice(0, visibleCount);

  const getEstimatedTax = (amount: number, category: string) => {
    const rates: Record<string, number> = {
      Alimentação: 0.18,
      Transporte: 0.35,
      Lazer: 0.3,
      Saúde: 0.15,
      Educação: 0.15,
      Moradia: 0.1,
      Compras: 0.38,
      Eletrônicos: 0.45,
      Assinaturas: 0.25,
      default: 0.2,
    };
    const rate = rates[category] || rates["default"];
    return amount * rate;
  };

  const confirmDelete = () => {
    if (deleteConfirmId !== null) {
      onDelete(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  return (
    <Card className="shadow-card border-0">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-lg">
            <FileText size={20} className="text-primary" aria-hidden="true" />
            <span>Histórico de Transações</span>
            <Badge
              variant="secondary"
              className="ml-2 bg-accent text-accent-foreground"
            >
              {transactions.length}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Sem Transações"
            description="Nenhuma transação encontrada para este período."
            tips={[
              "Registrar cada centavo é o primeiro passo para a liberdade financeira.",
              "Experimente agrupar pagamentos mensais no mesmo dia para facilitar o controle.",
            ]}
          />
        ) : (
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-3" role="list">
              {visibleTransactions.map((transaction, index) => (
                <div
                  key={transaction.id}
                  role="listitem"
                  className="border border-border rounded-xl p-4 hover:shadow-md hover:border-primary/30 transition-all animate-fade-in bg-card"
                  style={{ animationDelay: `${Math.min(index, 10) * 0.05}s` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <Badge
                          variant="secondary"
                          className={`text-xs font-bold ${
                            transaction.type === "income"
                              ? "bg-success/10 text-success"
                              : "bg-danger/10 text-danger"
                          }`}
                        >
                          {transaction.type === "income"
                            ? "RECEITA"
                            : "DESPESA"}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-xs font-semibold"
                        >
                          {transaction.category}
                        </Badge>
                        {transaction.recurring && (
                          <Badge
                            variant="secondary"
                            className="text-xs bg-info/10 text-info"
                          >
                            Recorrente
                          </Badge>
                        )}
                        {transaction.scope === "personal" &&
                          transaction.classification && (
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-bold uppercase tracking-tighter ${
                                transaction.classification === "necessity"
                                  ? "border-primary text-primary"
                                  : transaction.classification === "want"
                                  ? "border-warning text-warning"
                                  : transaction.classification === "investment"
                                  ? "border-success text-success"
                                  : "border-muted text-muted-foreground"
                              }`}
                            >
                              {transaction.classification === "necessity"
                                ? "Necessidade"
                                : transaction.classification === "want"
                                ? "Desejo"
                                : transaction.classification === "investment"
                                ? "Investimento"
                                : "Dívida/Outros"}
                            </Badge>
                          )}
                      </div>
                      <h4 className="font-bold text-foreground text-base mb-2">
                        {transaction.description}
                      </h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar size={14} aria-hidden="true" />
                          {formatDate(transaction.date)}
                        </span>
                        <span className="capitalize font-medium">
                          {transaction.paymentMethod}
                        </span>
                        {transaction.type === "expense" && (
                          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-amber-500/5 text-amber-500/60 text-[9px] font-bold uppercase tracking-widest border border-amber-500/10">
                            Imposto Est:{" "}
                            {formatCurrency(
                              getEstimatedTax(
                                transaction.amount,
                                transaction.category
                              )
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span
                        className={`text-xl font-bold ${
                          transaction.type === "income"
                            ? "text-success"
                            : "text-danger"
                        }`}
                      >
                        {transaction.type === "income" ? "+" : "-"}{" "}
                        <PrivacyValue value={transaction.amount} />
                      </span>
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(transaction)}
                          className="h-8 w-8 text-info hover:text-info hover:bg-info/10"
                          title="Editar transação"
                          aria-label={`Editar ${transaction.description}`}
                        >
                          <Edit2 size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteConfirmId(transaction.id)}
                          className="h-8 w-8 text-danger hover:text-danger hover:bg-danger/10"
                          title="Excluir transação"
                          aria-label={`Excluir ${transaction.description}`}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {hasMore && (
                <div className="pt-4 pb-8 flex justify-center">
                  <Button
                    variant="ghost"
                    onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                    className="gap-2 text-slate-400 hover:text-white font-bold"
                  >
                    <ChevronDown size={16} />
                    Carregar mais transações
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>

      <Dialog
        open={deleteConfirmId !== null}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
      >
        <DialogContent className="glass-premium border-white/10 text-white rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">
              Confirmar Exclusão
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Esta ação não pode ser desfeita. A transação será removida
              permanentemente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => setDeleteConfirmId(null)}
              className="text-slate-400 hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              className="bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl"
            >
              Excluir Permanentemente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
