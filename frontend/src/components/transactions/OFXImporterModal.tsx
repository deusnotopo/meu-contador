import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, FileCode, ArrowRight } from "lucide-react";
import { parseOFX, type OFXTransaction } from "@/utils/ofxParser";
import { useTransactions } from "@/hooks/useTransactions";

interface OFXImporterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OFXImporterModal: React.FC<OFXImporterModalProps> = ({ isOpen, onClose }) => {
  const [dragActive, setDragActive] = useState(false);
  const [parsedItems, setParsedItems] = useState<OFXTransaction[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { addTransaction } = useTransactions();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === 'string') {
        const items = parseOFX(text);
        setParsedItems(items);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleImport = async () => {
    if (parsedItems.length === 0) return;
    setIsProcessing(true);
    try {
      for (const item of parsedItems) {
        await addTransaction({
          amount: item.amount.toString(),
          category: item.category,
          date: item.date,
          description: item.description,
          notes: "Importado via OFX",
          paymentMethod: "bank_transfer",
          recurring: false,
          scope: "personal",
          type: item.type
        });
      }
      onClose();
      setParsedItems([]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          className="bg-[#0b0f19] border border-white/10 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]"
        >
          <div className="flex items-center justify-between p-5 border-b border-white/5">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <FileCode className="text-indigo-400" size={20} />
              Importação Nativa OFX
            </h2>
            <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white/50 transition-colors">
              <X size={16} />
            </button>
          </div>

          <div className="p-5 overflow-y-auto flex-1">
            {parsedItems.length === 0 ? (
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  dragActive ? "border-indigo-400 bg-indigo-500/10" : "border-white/10 hover:border-white/20 hover:bg-white/5"
                }`}
              >
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 text-white/40">
                  <Upload size={28} />
                </div>
                <h3 className="text-white font-bold mb-1">Arraste seu arquivo .OFX</h3>
                <p className="text-sm text-slate-400 max-w-[200px]">Ou clique para procurar nos seus arquivos locais</p>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".ofx"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
                />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-sm font-bold text-indigo-300 mb-4 bg-indigo-500/10 p-3 rounded-xl border border-indigo-500/20 text-center">
                  {parsedItems.length} transações encontradas!
                </div>
                {parsedItems.map((tx, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                    <div className="overflow-hidden">
                      <div className="text-sm font-bold text-white truncate">{tx.description}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{tx.category} • {tx.date}</div>
                    </div>
                    <div className={`font-mono font-bold whitespace-nowrap ml-2 ${tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {tx.type === 'income' ? '+' : '-'} R$ {tx.amount.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {parsedItems.length > 0 && (
            <div className="p-5 border-t border-white/5 bg-white/[0.02]">
              <button
                onClick={handleImport}
                disabled={isProcessing}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-12 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isProcessing ? "Processando..." : (
                  <>
                    Salvar {parsedItems.length} transações
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
