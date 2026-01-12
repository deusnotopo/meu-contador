import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useInvoices } from "@/hooks/useInvoices";
import { formatCurrency } from "@/lib/formatters";
import type { Invoice } from "@/types";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Edit2,
  Plus,
  Trash2,
} from "lucide-react";
import { NoInvoicesEmpty } from "../ui/empty-state";
import { FadeIn } from "../ui/skeleton";

export const InvoicesSection = () => {
  const { invoices, addInvoice, updateInvoice, deleteInvoice } = useInvoices();
  const [isOpen, setIsOpen] = useState(false);
  const [editingInv, setEditingInv] = useState<Invoice | null>(null);

  const [formData, setFormData] = useState({
    number: "",
    client: "",
    amount: "",
    status: "pending" as const,
    dueDate: new Date().toISOString().split("T")[0],
  });

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setEditingInv(null);
      setFormData({
        number: "",
        client: "",
        amount: "",
        status: "pending",
        dueDate: new Date().toISOString().split("T")[0],
      });
    }
  };

  const handleEdit = (inv: Invoice) => {
    setEditingInv(inv);
    setFormData({
      number: inv.number,
      client: inv.client,
      amount: inv.amount.toString(),
      status: inv.status,
      dueDate: inv.dueDate,
    });
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      amount: parseFloat(formData.amount),
    };

    if (editingInv) {
      updateInvoice(editingInv.id, data);
    } else {
      addInvoice(data);
    }
    handleOpenChange(false);
  };

  const statusConfig = {
    paid: {
      label: "Pago",
      color: "bg-success/10 text-success",
      icon: CheckCircle2,
    },
    pending: {
      label: "Pendente",
      color: "bg-warning/10 text-warning",
      icon: Clock,
    },
    overdue: {
      label: "Atrasado",
      color: "bg-danger/10 text-danger",
      icon: AlertCircle,
    },
  };

  return (
    <FadeIn>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Notas Fiscais</h3>
            <p className="text-sm text-muted-foreground">
              Gerencie o faturamento do seu negócio
            </p>
          </div>

          <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button className="gradient-primary border-0">
                <Plus size={16} className="mr-2" />
                Nova NF
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  {editingInv
                    ? "Editar Nota Fiscal"
                    : "Emitir Nova Nota Fiscal"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="number">Número da NF</Label>
                    <Input
                      id="number"
                      value={formData.number}
                      onChange={(e) =>
                        setFormData({ ...formData, number: e.target.value })
                      }
                      placeholder="NF-001"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Valor (R$)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData({ ...formData, amount: e.target.value })
                      }
                      placeholder="0,00"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client">Cliente</Label>
                  <Input
                    id="client"
                    value={formData.client}
                    onChange={(e) =>
                      setFormData({ ...formData, client: e.target.value })
                    }
                    placeholder="Nome do Cliente ou Empresa"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Vencimento</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) =>
                        setFormData({ ...formData, dueDate: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(v: any) =>
                        setFormData({ ...formData, status: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="paid">Pago</SelectItem>
                        <SelectItem value="overdue">Atrasado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter className="pt-4">
                  <Button
                    type="submit"
                    className="w-full gradient-primary border-0"
                  >
                    {editingInv ? "Salvar Alterações" : "Cadastrar Nota"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="shadow-card border-0 overflow-hidden">
          <CardContent className="p-0">
            {invoices.length === 0 ? (
              <NoInvoicesEmpty onAddClick={() => setIsOpen(true)} />
            ) : (
              <div className="divide-y border-t">
                {invoices.map((inv) => {
                  const config = statusConfig[inv.status];
                  const Icon = config.icon;

                  return (
                    <div
                      key={inv.id}
                      className="group flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`p-2 rounded-lg ${
                            config.color.split(" ")[0]
                          }`}
                        >
                          <Icon size={18} />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground flex items-center gap-2">
                            {inv.number}
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-bold uppercase tracking-wider ${config.color}`}
                            >
                              {config.label}
                            </Badge>
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {inv.client} • Venc:{" "}
                            {new Date(inv.dueDate).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <span className="font-bold text-lg">
                          {formatCurrency(inv.amount)}
                        </span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            onClick={() => handleEdit(inv)}
                          >
                            <Edit2 size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-danger"
                            onClick={() => deleteInvoice(inv.id)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </FadeIn>
  );
};
