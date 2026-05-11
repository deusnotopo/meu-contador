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
  Send,
  ShieldCheck,
  X,
} from "lucide-react";
import { EmptyState } from "../ui/EmptyState";
import { PrivacyValue } from "../ui/PrivacyValue";
import { FadeIn } from "../ui/skeleton";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// ── SEFAZ Sandbox Modal ───────────────────────────────────────────────────────
interface SefazStep { label: string; detail: string; done: boolean; active: boolean; }

const SEFAZ_STEPS = [
  { label: "Validação do XML", detail: "Verificando schema NF-e 4.0..." },
  { label: "Envio ao SEFAZ", detail: "POST /NFeAutorizacao4..." },
  { label: "Processamento", detail: "Aguardando retorno cStat..." },
  { label: "Autorização", detail: "cStat 100 — Uso Autorizado" },
];

const SefazTransmissionModal = ({ inv, onClose }: { inv: Invoice; onClose: () => void }) => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [protocol, setProtocol] = useState("");
  const [done, setDone] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    let p = 0;
    let st = 0;
    const iv = setInterval(() => {
      p += Math.random() * 6 + 2;
      setProgress(Math.min(p, 100));
      const nextStep = Math.floor((p / 100) * SEFAZ_STEPS.length);
      if (nextStep > st && nextStep < SEFAZ_STEPS.length) { st = nextStep; setCurrentStep(st); }
      if (p >= 100) {
        clearInterval(iv);
        setCurrentStep(SEFAZ_STEPS.length);
        const proto = `135240420${Math.floor(100000000 + Math.random() * 899999999)}`;
        setProtocol(proto);
        setDone(true);
      }
    }, 180);
    return () => clearInterval(iv);
  }, []);

  const stepList: SefazStep[] = SEFAZ_STEPS.map((s, i) => ({
    ...s,
    done: i < currentStep,
    active: i === currentStep && !done,
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#080e1f] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-gradient-to-r from-emerald-500/10 to-teal-500/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <ShieldCheck size={18} className="text-emerald-400" />
            </div>
            <div>
              <div className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold">SEFAZ Nacional</div>
              <div className="text-[15px] font-black text-white">Transmissão NF-e Sandbox</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black uppercase tracking-widest text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-1 rounded-full">DEMO</span>
            {done && <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors"><X size={14} /></button>}
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-white/50">NF-e: <span className="text-white font-bold">{inv.number}</span></span>
            <span className="text-white/50">Tomador: <span className="text-white font-bold">{inv.client ?? inv.customerName}</span></span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.2 }}
            />
          </div>

          {/* Steps */}
          <div className="space-y-2">
            {stepList.map((s, i) => (
              <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                s.done ? 'bg-emerald-500/8 border border-emerald-500/20' :
                s.active ? 'bg-blue-500/8 border border-blue-500/20' :
                'bg-white/[0.02] border border-white/5 opacity-40'
              }`}>
                {s.done
                  ? <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                  : s.active
                  ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full shrink-0" />
                  : <div className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-bold text-white">{s.label}</div>
                  <div className="text-[10px] text-white/40 font-mono truncate">{s.detail}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Protocol */}
          {done && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
                <div className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold mb-1">Protocolo de Autorização</div>
                <div className="text-[13px] font-mono font-black text-white">{protocol}</div>
                <div className="text-[10px] text-emerald-400/70 mt-1">NF-e Autorizada · cStat 100</div>
              </div>
              <div className="text-[10px] text-white/30 text-center">Dados sandbox — sem validade fiscal real</div>
              <Button onClick={onClose} className="w-full bg-emerald-600 hover:bg-emerald-500 font-black rounded-2xl h-11">
                Fechar
              </Button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
// ─────────────────────────────────────────────────────────────────────────────

type InvoiceStatus = Invoice["status"];

interface AutoTableDoc extends jsPDF {
  lastAutoTable?: {
    finalY: number;
  };
}

export const InvoicesSection = () => {
  const { invoices, addInvoice, updateInvoice, deleteInvoice } = useInvoices();
  const [isOpen, setIsOpen] = useState(false);
  const [editingInv, setEditingInv] = useState<Invoice | null>(null);
  const [sefazInv, setSefazInv] = useState<Invoice | null>(null);

  const [formData, setFormData] = useState({
    number: "",
    client: "",
    amount: "",
    status: "pending" as InvoiceStatus,
    dueDate: new Date().toISOString().substring(0, 10),
    customerName: "",
    customerTaxId: "",
    issueDate: new Date().toISOString().substring(0, 10),
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
        dueDate: new Date().toISOString().substring(0, 10),
        customerName: "",
        customerTaxId: "",
        issueDate: new Date().toISOString().substring(0, 10),
      });
    }
  };

  const handleEdit = (inv: Invoice) => {
    setEditingInv(inv);
    setFormData({
      number: inv.number,
      client: inv.client ?? "",
      amount: inv.amount.toString(),
      status: inv.status,
      dueDate: inv.dueDate ?? "",
      customerName: inv.customerName,
      customerTaxId: inv.customerTaxId ?? "",
      issueDate: inv.issueDate ?? new Date().toISOString().substring(0, 10),
    });
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      amount: parseFloat(formData.amount),
      customerName: formData.client,
      customerTaxId: formData.customerTaxId || "00000000000",
    };

    if (editingInv) {
      updateInvoice(editingInv.id, data);
    } else {
      addInvoice(data);
    }
    handleOpenChange(false);
  };

  const handleDownloadPDF = (inv: Invoice) => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(22);
    doc.text("NOTA FISCAL DE SERVIÇOS", 105, 20, { align: "center" });

    doc.setFontSize(10);
    doc.text(`Número: ${inv.number}`, 20, 40);
    doc.text(
      `Data de Emissão: ${new Date().toLocaleDateString("pt-BR")}`,
      20,
      45,
    );
    doc.text(
      `Vencimento: ${inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("pt-BR") : "N/A"}`,
      20,
      50,
    );

    // Client Info
    doc.setFontSize(14);
    doc.text("TOMADOR DO SERVIÇO", 20, 65);
    doc.setFontSize(10);
    doc.text(`Cliente: ${inv.client ?? inv.customerName}`, 20, 75);

    // Table
    autoTable(doc, {
      startY: 90,
      head: [["Descrição", "Valor Base", "Impostos", "Total"]],
      body: [
        [
          `Serviços prestados conforme NF ${inv.number}`,
          `R$ ${inv.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
          "R$ 0,00",
          `R$ ${inv.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
        ],
      ],
      theme: "grid",
      headStyles: { fillColor: [79, 70, 229] },
    });

    const finalY = ((doc as AutoTableDoc).lastAutoTable?.finalY ?? 90) + 20;
    doc.setFontSize(12);
    doc.text(
      `VALOR TOTAL: R$ ${inv.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      140,
      finalY,
    );

    doc.save(
      `NF_${inv.number}_${(inv.client ?? inv.customerName).replace(/\s+/g, "_")}.pdf`,
    );
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
            <p className="text-xs text-neutral-500 font-medium">
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
                        className="text-[10px] font-black uppercase tracking-widest text-neutral-500"
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
                        className="text-[10px] font-black uppercase tracking-widest text-neutral-500"
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
                      className="text-[10px] font-black uppercase tracking-widest text-neutral-500"
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
                        className="text-[10px] font-black uppercase tracking-widest text-neutral-500"
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
                        className="text-[10px] font-black uppercase tracking-widest text-neutral-500"
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
                  "Mantenha os dados do faturamento em dia para facilitar sua declaração de IR anual.",
                  "Notas pendentes de recebimento são ativos circulantes; monitore o fluxo de caixa.",
                ]}
              />
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {invoices.map((inv) => {
                const config =
                  statusConfig[inv.status as keyof typeof statusConfig] ||
                  statusConfig.pending;
                const Icon = config.icon;

                return (
                  <div
                    key={inv.id}
                    className="group flex flex-col md:flex-row md:items-center justify-between p-6 hover:bg-white/[0.02] transition-colors gap-6"
                  >
                    <div className="flex items-center gap-6">
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center ${(
                          config.color || ""
                        )
                          .split(" ")[0]
                          ?.replace(
                            "10",
                            "20",
                          )} ${(config.color || "").split(" ")[1] || ""}`}
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
                        <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider">
                          {inv.client ?? inv.customerName}{" "}
                          <span className="mx-2 text-neutral-800">|</span>{" "}
                          <span className="text-neutral-500">
                            Venc:{" "}
                            {inv.dueDate
                              ? new Date(inv.dueDate).toLocaleDateString(
                                  "pt-BR",
                                )
                              : "N/A"}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex-1 flex justify-center md:justify-start">
                      {inv.status !== "paid" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 rounded-lg text-[10px] font-black uppercase tracking-widest px-4"
                          onClick={() =>
                            updateInvoice(inv.id, { status: "paid" })
                          }
                        >
                          Marcar como Pago
                        </Button>
                      )}
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-10">
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest text-neutral-700 mb-1">
                          Valor Total
                        </p>
                        <span className="font-black text-2xl text-white tracking-tighter">
                          <PrivacyValue value={inv.amount} />
                        </span>
                      </div>

                      <div className="flex items-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all duration-300">
                        {/* SEFAZ Transmit */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-10 px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 text-[10px] font-black uppercase tracking-widest gap-1.5"
                          onClick={() => setSefazInv(inv)}
                          title="Transmitir ao SEFAZ (Sandbox)"
                        >
                          <Send size={12} />
                          SEFAZ
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-12 w-12 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-500 hover:text-white border border-white/5"
                          onClick={() => handleDownloadPDF(inv)}
                          title="Baixar PDF"
                        >
                          <FileText size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-12 w-12 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-500 hover:text-white border border-white/5"
                          onClick={() => handleEdit(inv)}
                        >
                          <Edit2 size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-12 w-12 rounded-xl bg-white/5 hover:bg-rose-500/10 text-neutral-500 hover:text-rose-400 border border-white/5"
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

      {/* SEFAZ Transmission Modal */}
      <AnimatePresence>
        {sefazInv && (
          <SefazTransmissionModal inv={sefazInv} onClose={() => setSefazInv(null)} />
        )}
      </AnimatePresence>
    </FadeIn>
  );
};
