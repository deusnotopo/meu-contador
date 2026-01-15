import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    businessCategories,
    initialTransactionFormData,
    paymentMethods,
    personalCategories,
} from "@/lib/constants";
import {
    SUPPORTED_CURRENCIES,
    currencyService,
} from "@/lib/currency";
import { getDefaultClassification } from "@/lib/financial-health";
import type { CurrencyCode, Transaction, TransactionFormData } from "@/types";
import { Edit2, PlusCircle, Save, X } from "lucide-react";
import { useEffect, useState } from "react";

interface TransactionFormProps {
  editingTransaction: Transaction | null;
  onSubmit: (formData: TransactionFormData, isEditing: boolean) => void;
  onCancel: () => void;
  scope?: "personal" | "business";
}

export const TransactionForm = ({
  editingTransaction,
  onSubmit,
  onCancel,
  scope = "personal",
}: TransactionFormProps) => {
  const [formData, setFormData] = useState<TransactionFormData>({
    ...initialTransactionFormData,
    ...initialTransactionFormData,
    currency: "BRL",
    scope,
  });

  const categories =
    scope === "personal" ? personalCategories : businessCategories;

  useEffect(() => {
    if (editingTransaction) {
      setFormData({
        ...editingTransaction,
        amount: editingTransaction.amount.toString(),
      });
    } else {
      setFormData({ ...initialTransactionFormData, scope });
    }
  }, [editingTransaction, scope]);

  const handleSubmit = () => {
    if (!formData.description || !formData.amount || !formData.category) {
      showError("Por favor, preencha todos os campos obrigatórios");
      return;
    }
    // Convert Amount if needed (Base is BRL)
    const finalAmount = currencyService.convertToBRL(
      parseFloat(formData.amount),
      (formData.currency as CurrencyCode) || "BRL"
    );

    // Save with original specs
    const payload = {
      ...formData,
      amount: finalAmount.toString(),
      originalAmount: parseFloat(formData.amount),
      exchangeRate: currencyService
        .getRate((formData.currency as CurrencyCode) || "BRL")
        .toString(),
    };

    onSubmit(payload, !!editingTransaction);
  };

  return (
    <Card className="shadow-card border-0 animate-scale-in">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          {editingTransaction ? (
            <Edit2 size={22} className="text-primary" />
          ) : (
            <PlusCircle size={22} className="text-primary" />
          )}
          {editingTransaction ? "Editar Transação" : "Nova Transação"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Tipo *</Label>
            <Select
              value={formData.type}
              onValueChange={(value: "income" | "expense") =>
                setFormData({ ...formData, type: value, category: "" })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Receita</SelectItem>
                <SelectItem value="expense">Despesa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Categoria *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  category: value,
                  classification: getDefaultClassification(value),
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {categories[formData.type].map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Valor (R$) *</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              placeholder="0,00"
            />
          </div>

          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Moeda</Label>
            <Select
              value={formData.currency || "BRL"}
              onValueChange={(value: CurrencyCode) =>
                setFormData({ ...formData, currency: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_CURRENCIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.symbol} - {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formData.currency && formData.currency !== "BRL" && (
              <p className="text-[10px] text-muted-foreground">
                Cotação: 1 {formData.currency} ={" "}
                {currencyService
                  .getRate(formData.currency as CurrencyCode)
                  .toFixed(2)}{" "}
                BRL
              </p>
            )}
          </div>

          <div className="md:col-span-2 space-y-2">
            <Label className="text-sm font-semibold">Descrição *</Label>
            <Input
              type="text"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder={
                scope === "personal"
                  ? "Ex: Supermercado"
                  : "Ex: Venda de produtos"
              }
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Data *</Label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Forma de Pagamento</Label>
            <Select
              value={formData.paymentMethod}
              onValueChange={(value) =>
                setFormData({ ...formData, paymentMethod: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((method) => (
                  <SelectItem key={method} value={method.toLowerCase()}>
                    {method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {scope === "personal" && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold">
                Classificação (50-30-20)
              </Label>
              <Select
                value={formData.classification}
                onValueChange={(value: FinancialClassification) =>
                  setFormData({ ...formData, classification: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="necessity">Necessidade (50%)</SelectItem>
                  <SelectItem value="want">Desejo (30%)</SelectItem>
                  <SelectItem value="investment">Investimento (20%)</SelectItem>
                  <SelectItem value="debt">Dívida / Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="md:col-span-2 space-y-2">
            <Label className="text-sm font-semibold">Observações</Label>
            <Input
              type="text"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Informações adicionais..."
            />
          </div>

          <div className="flex items-center gap-4 md:col-span-2 p-4 bg-muted/30 rounded-lg border border-border/50">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="recurring"
                checked={formData.recurring}
                onChange={(e) =>
                  setFormData({ ...formData, recurring: e.target.checked })
                }
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label
                htmlFor="recurring"
                className="text-sm font-semibold cursor-pointer"
              >
                Transação Recorrente
              </Label>
            </div>

            {formData.recurring && (
              <Select
                value={formData.recurrenceInterval || "monthly"}
                onValueChange={(
                  value: "monthly" | "weekly" | "bi-weekly" | "yearly"
                ) => setFormData({ ...formData, recurrenceInterval: value })}
              >
                <SelectTrigger className="w-[180px] h-8 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="bi-weekly">Quinzenal</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="yearly">Anual</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            onClick={handleSubmit}
            className="flex-1 gradient-primary border-0 text-primary-foreground font-semibold h-12"
          >
            <Save size={18} className="mr-2" />
            {editingTransaction ? "Salvar Alterações" : "Adicionar Transação"}
          </Button>
          <Button
            variant="secondary"
            onClick={onCancel}
            className="px-8 h-12 font-semibold"
          >
            <X size={18} className="mr-2" />
            Cancelar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
