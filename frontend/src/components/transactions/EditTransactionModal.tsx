import { useState, useRef } from "react";
import { X, Save, Paperclip, Loader2, Trash2, ExternalLink } from "lucide-react";
import type { Transaction } from "@/types";
import { uploadReceipt, deleteReceipt } from "@/lib/firebase-storage";
import { showSuccess, showError } from "@/lib/toast";
import { confirmAction } from "@/lib/confirm";

const CATEGORIES_INCOME = ["Salário", "Freelance", "Investimentos", "Presente", "Outros"];
const CATEGORIES_EXPENSE = [
  "Moradia", "Mercado", "Delivery", "Transporte", "Saúde",
  "Lazer", "Roupas", "Educação", "Assinaturas", "Outros",
];

const fieldClass =
  "w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-[11px] text-sm text-[var(--t1)] outline-none focus:border-blue-500/50 focus:bg-white/[0.06] transition-colors appearance-none";

const labelClass =
  "block text-[10px] uppercase tracking-widest text-[var(--t3)] font-semibold mb-1.5";

interface EditTransactionModalProps {
  transaction: Transaction;
  onSave: (id: string, updates: Partial<Transaction>) => Promise<void>;
  onClose: () => void;
}

export const EditTransactionModal = ({ transaction, onSave, onClose }: EditTransactionModalProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    description: transaction.description,
    amount: String(transaction.amount),
    type: transaction.type,
    category: transaction.category,
    date: transaction.date.split("T")[0] ?? transaction.date.slice(0, 10),
    receiptUrl: transaction.receiptUrl || "",
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const categories = form.type === "income" ? CATEGORIES_INCOME : CATEGORIES_EXPENSE;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadReceipt(transaction.id, file);
      setForm(prev => ({ ...prev, receiptUrl: url }));
      showSuccess("Comprovante anexado!");
    } catch {
      showError("Erro ao fazer upload do arquivo.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveReceipt = async () => {
    if (!form.receiptUrl) return;
    if (!await confirmAction('Deseja remover o comprovante anexo?')) return;
    try {
      await deleteReceipt(form.receiptUrl);
      setForm(prev => ({ ...prev, receiptUrl: '' }));
      showSuccess('Comprovante removido.');
    } catch {
      showError('Erro ao remover arquivo.');
    }
  };

  const handleSave = async () => {
    if (!form.description.trim() || !form.amount) return;
    setSaving(true);
    try {
      await onSave(transaction.id, {
        description: form.description.trim(),
        amount: parseFloat(form.amount.replace(",", ".")),
        type: form.type as "income" | "expense",
        category: form.category,
        date: form.date,
        receiptUrl: form.receiptUrl,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[300] bg-black/75 backdrop-blur-md flex items-end justify-center"
      onClick={onClose}
    >
      {/* Bottom Sheet */}
      <div
        className="w-full max-w-[480px] rounded-t-[24px] border border-white/[0.08] bg-gradient-to-b from-[#141820] to-[#0e1117] shadow-[0_-20px_60px_rgba(0,0,0,0.5)] px-6 pt-7 pb-[calc(env(safe-area-inset-bottom,0px)+28px)] animate-in slide-in-from-bottom-4 duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-[11px] text-[var(--t3)] uppercase tracking-widest">Editar</div>
            <div className="text-[20px] font-bold text-[var(--t1)] tracking-tight">Transação</div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-[var(--t2)] hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X size={16} />
          </button>
        </div>

        {/* Type Toggle */}
        <div className="flex gap-2 p-1 rounded-xl bg-white/[0.04] mb-5">
          {(["income", "expense"] as const).map(t => (
            <button
              key={t}
              onClick={() => setForm({ ...form, type: t, category: t === "income" ? CATEGORIES_INCOME[0]! : CATEGORIES_EXPENSE[0]! })}
              className={`flex-1 py-2 rounded-[10px] text-[13px] font-semibold transition-all cursor-pointer border-none ${
                form.type === t
                  ? t === "income"
                    ? "bg-[var(--green)] text-black"
                    : "bg-[var(--red)] text-black"
                  : "bg-transparent text-[var(--t3)]"
              }`}
            >
              {t === "income" ? "Receita" : "Despesa"}
            </button>
          ))}
        </div>

        {/* Fields */}
        <div className="flex flex-col gap-4">
          {/* Description */}
          <div>
            <label className={labelClass}>Descrição</label>
            <input
              className={fieldClass}
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Ex: Supermercado"
            />
          </div>

          {/* Amount + Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Valor (R$)</label>
              <input
                className={fieldClass}
                type="number"
                step="0.01"
                min="0"
                value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>Data</label>
              <input
                className={fieldClass}
                type="date"
                value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className={labelClass}>Categoria</label>
            <select
              className={fieldClass}
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })}
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Receipt Upload */}
          <div className="rounded-2xl bg-white/[0.02] border border-dashed border-white/10 p-4 mt-1">
            <label className={labelClass}>Comprovante (Opcional)</label>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileUpload}
              accept="image/*,application/pdf"
            />

            {form.receiptUrl ? (
              <div className="flex items-center gap-3 bg-white/[0.04] p-2 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                  <Paperclip size={16} />
                </div>
                <span className="text-[13px] text-[var(--t2)] flex-1 truncate">Arquivo anexado</span>
                <div className="flex gap-1 shrink-0">
                  <a
                    href={form.receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-[var(--t2)] hover:text-white transition-colors"
                    aria-label="Ver comprovante"
                  >
                    <ExternalLink size={14} />
                  </a>
                  <button
                    onClick={handleRemoveReceipt}
                    className="p-1.5 text-rose-400 hover:text-rose-300 bg-transparent border-none cursor-pointer transition-colors"
                    aria-label="Remover comprovante"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full py-2.5 rounded-xl border border-white/10 bg-transparent text-[var(--t2)] text-[13px] flex items-center justify-center gap-2 hover:bg-white/5 hover:text-white disabled:opacity-50 transition-all cursor-pointer"
              >
                {uploading ? <Loader2 size={16} className="animate-spin" /> : <Paperclip size={16} />}
                {uploading ? "Fazendo upload..." : "Anexar comprovante"}
              </button>
            )}
          </div>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving || uploading || !form.description.trim() || !form.amount}
          className="mt-6 w-full py-3.5 rounded-[14px] border-none text-[15px] font-bold text-white flex items-center justify-center gap-2 bg-gradient-to-r from-[#4A8BFF] to-[#5032A8] hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? "Salvando..." : "Salvar alterações"}
        </button>
      </div>
    </div>
  );
};
