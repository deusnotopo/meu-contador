import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatCurrency, formatDate } from "@/lib/formatters";
import type { Transaction } from "@/types";
import { Calendar, Edit2, FileText, Trash2 } from "lucide-react";

interface TransactionListProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: number) => void;
}

export const TransactionList = ({
  transactions,
  onEdit,
  onDelete,
}: TransactionListProps) => {
  return (
    <Card className="shadow-card border-0">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-lg">
            <FileText size={20} className="text-primary" />
            Histórico de Transações
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
          <div className="text-center py-16 text-muted-foreground">
            <FileText size={64} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">Nenhuma transação encontrada</p>
            <p className="text-sm mt-2">
              Adicione sua primeira transação para começar
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-3">
              {transactions.map((transaction, index) => (
                <div
                  key={transaction.id}
                  className="border border-border rounded-xl p-4 hover:shadow-md hover:border-primary/30 transition-all animate-fade-in bg-card"
                  style={{ animationDelay: `${index * 0.05}s` }}
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
                      </div>
                      <h4 className="font-bold text-foreground text-base mb-2">
                        {transaction.description}
                      </h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {formatDate(transaction.date)}
                        </span>
                        <span className="capitalize font-medium">
                          {transaction.paymentMethod}
                        </span>
                      </div>
                      {transaction.notes && (
                        <p className="text-sm text-muted-foreground mt-2 italic">
                          {transaction.notes}
                        </p>
                      )}
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
                        {formatCurrency(transaction.amount)}
                      </span>
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(transaction)}
                          className="h-8 w-8 text-info hover:text-info hover:bg-info/10"
                        >
                          <Edit2 size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(transaction.id)}
                          className="h-8 w-8 text-danger hover:text-danger hover:bg-danger/10"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
