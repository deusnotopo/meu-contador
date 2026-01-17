import { Button } from "@/components/ui/button";
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
import type { Invoice } from "@/types";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Edit2,
  FileText,
  Plus,
  Trash2,
} from "lucide-react";
import { EmptyState } from "../ui/EmptyState";
import { PrivacyValue } from "../ui/PrivacyValue";
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
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h3 className="text-xl font-black uppercase tracking-widest text-white">
              Notas <span className="text-amber-400">Fiscais</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Controle total do faturamento e recebíveis
            </p>
          </div>

          <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button className="bg-white text-black hover:bg-white/90 font-black rounded-2xl h-14 px-8 shadow-xl shadow-white/5 transition-all text-xs uppercase tracking-widest">
                <Plus size={18} className="mr-2" />
                Emitir Nova Nota
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px] glass-premium border-white/10 p-0 overflow-hidden">
              <div className="p-8 space-y-8">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black tracking-tight text-white">
                    {editingInv ? "Editar Nota Fiscal" : "Dados do Faturamento"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 pt-2">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label
                        htmlFor="number"
                        className="text-[10px] font-black uppercase tracking-widest text-slate-500"
                      >
                        Número NF
                      </Label>
                      <Input
                        id="number"
                        className="bg-white/5 border-white/10 rounded-xl h-12 focus:ring-emerald-500/20"
                        value={formData.number}
                        onChange={(e) =>
                          setFormData({ ...formData, number: e.target.value })
                        }
                        placeholder="Ex: NF-2024-001"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="amount"
                        className="text-[10px] font-black uppercase tracking-widest text-slate-500"
                      >
                        Valor Bruto
                      </Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        className="bg-white/5 border-white/10 rounded-xl h-12 focus:ring-emerald-500/20"
                        value={formData.amount}
                        onChange={(e) =>
                          setFormData({ ...formData, amount: e.target.value })
                        }
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="client"
                      className="text-[10px] font-black uppercase tracking-widest text-slate-500"
                    >
                      Cliente / Tomador
                    </Label>
                    <Input
                      id="client"
                      className="bg-white/5 border-white/10 rounded-xl h-12 focus:ring-emerald-500/20"
                      value={formData.client}
                      onChange={(e) =>
                        setFormData({ ...formData, client: e.target.value })
                      }
                      placeholder="Nome completo ou Razão Social"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label
                        htmlFor="date"
                        className="text-[10px] font-black uppercase tracking-widest text-slate-500"
                      >
                        Data Vencimento
                      </Label>
                      <Input
                        id="date"
                        type="date"
                        className="bg-white/5 border-white/10 rounded-xl h-12 focus:ring-emerald-500/20"
                        value={formData.dueDate}
                        onChange={(e) =>
                          setFormData({ ...formData, dueDate: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="status"
                        className="text-[10px] font-black uppercase tracking-widest text-slate-500"
                      >
                        Status Atual
                      </Label>
                      <Select
                        value={formData.status}
                        onValueChange={(v: "paid" | "pending" | "overdue") =>
                          setFormData({ ...formData, status: v })
                        }
                      >
                        <SelectTrigger className="bg-white/5 border-white/10 rounded-xl h-12">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-white/10 text-white">
                          <SelectItem value="pending">Pendente</SelectItem>
                          <SelectItem value="paid">Pago</SelectItem>
                          <SelectItem value="overdue">Atrasado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter className="pt-6">
                    <Button
                      type="submit"
                      className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-2xl h-14 uppercase tracking-widest transition-all"
                    >
                      {editingInv
                        ? "Atualizar Faturamento"
                        : "Registrar Nota Fiscal"}
                    </Button>
                  </DialogFooter>
                </form>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="premium-card overflow-hidden">
          {invoices.length === 0 ? (
            <div className="p-12">
              <EmptyState
                icon={FileText}
                title="Nenhuma NF Registrada"
                description="Simplifique sua contabilidade registrando suas notas fiscais aqui."
                actionLabel="Começar Faturamento"
                onAction={() => setIsOpen(true)}
                tips={[
                  "A organização das notas fiscais é o segredo para uma DRE saudável.",
                ]}
              />
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {invoices.map((inv) => {
                const config = statusConfig[inv.status];
                const Icon = config.icon;

                return (
                  <div
                    key={inv.id}
                    className="group flex flex-col md:flex-row md:items-center justify-between p-6 hover:bg-white/[0.02] transition-colors gap-6"
                  >
                    <div className="flex items-center gap-6">
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center ${config.color
                          .split(" ")[0]
                          .replace("10", "20")} ${config.color.split(" ")[1]}`}
                      >
                        <Icon size={24} />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <p className="font-black text-lg text-white tracking-tight">
                            {inv.number}
                          </p>
                          <span
                            className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${config.color}`}
                          >
                            {config.label}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                          {inv.client}{" "}
                          <span className="mx-2 text-slate-700">|</span>{" "}
                          <span className="text-slate-400">
                            Venc:{" "}
                            {new Date(inv.dueDate).toLocaleDateString("pt-BR")}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-10">
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-1">
                          Valor Total
                        </p>
                        <span className="font-black text-2xl text-white tracking-tighter">
                          <PrivacyValue value={inv.amount} />
                        </span>
                      </div>

                      <div className="flex items-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-12 w-12 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/5"
                          onClick={() => handleEdit(inv)}
                        >
                          <Edit2 size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-12 w-12 rounded-xl bg-white/5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 border border-white/5"
                          onClick={() => deleteInvoice(inv.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </FadeIn>
  );
};
