import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { showSuccess, showError } from "@/lib/toast";
import {
  FileUp,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  SkipForward,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface OFXImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (imported: number) => void;
}

interface ImportResult {
  imported: number;
  skipped: number;
  currency: string;
  period?: { from?: string; to?: string };
  message?: string;
}

export const OFXImportModal = ({
  isOpen,
  onClose,
  onSuccess,
}: OFXImportModalProps) => {
  const [stage, setStage] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [result, setResult] = useState<ImportResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [fileName, setFileName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStage("idle");
    setResult(null);
    setErrorMsg("");
    setFileName("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !["ofx", "qfx", "ofc"].includes(ext)) {
      setStage("error");
      setErrorMsg(
        "Formato inválido. Use um arquivo .ofx ou .qfx exportado pelo seu banco."
      );
      return;
    }

    setFileName(file.name);
    setStage("loading");

    try {
      // Read file as text in the browser
      const rawText = await file.text();

      // Send as standard JSON
      const data = (await api.post("/banking/import-ofx", { ofxContent: rawText })) as ImportResult;

      setResult(data);
      setStage("success");

      if (data.imported > 0) {
        showSuccess(`${data.imported} transações importadas com sucesso!`);
        onSuccess(data.imported);
      }
    } catch (err: any) {
      setStage("error");
      setErrorMsg(
        err?.response?.data?.message ||
          err?.message ||
          "Erro ao processar o arquivo OFX."
      );
      showError("Falha na importação do extrato.");
    }
  };

  const fmt = (d?: string) =>
    d ? new Date(d).toLocaleDateString("pt-BR") : "—";

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="glass border-white/10 bg-[#0a0a0f] text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-black">
            <FileUp className="text-indigo-400" size={20} />
            Importar Extrato Bancário (OFX)
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {/* ─── IDLE ─── */}
          {stage === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-5"
            >
              <p className="text-sm text-slate-400 leading-relaxed">
                Exporte o extrato do seu banco no formato{" "}
                <span className="text-indigo-300 font-bold">.ofx</span> e faça
                o upload aqui. As transações serão importadas automaticamente,
                sem duplicatas.
              </p>

              <div className="grid grid-cols-3 gap-2 text-xs text-center text-slate-500">
                {["Itaú", "Bradesco", "Nubank", "BB", "Santander", "Inter"].map(
                  (b) => (
                    <div
                      key={b}
                      className="bg-white/5 rounded-xl py-2 border border-white/5"
                    >
                      {b}
                    </div>
                  )
                )}
              </div>

              <button
                onClick={() => inputRef.current?.click()}
                className="w-full border-2 border-dashed border-white/10 rounded-2xl p-8 flex flex-col items-center gap-3 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all duration-300 group"
              >
                <FileText
                  size={40}
                  className="text-slate-600 group-hover:text-indigo-400 transition-colors"
                />
                <span className="text-sm font-bold text-slate-400 group-hover:text-white transition-colors">
                  Clique para selecionar o arquivo OFX
                </span>
                <span className="text-xs text-slate-600">
                  .ofx · .qfx · máx. 10MB
                </span>
              </button>

              <input
                ref={inputRef}
                type="file"
                accept=".ofx,.qfx,.ofc"
                className="hidden"
                onChange={handleFileChange}
              />
            </motion.div>
          )}

          {/* ─── LOADING ─── */}
          {stage === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-10 flex flex-col items-center gap-4"
            >
              <Loader2
                size={40}
                className="text-indigo-400 animate-spin"
              />
              <p className="text-sm font-bold text-slate-400">
                Lendo{" "}
                <span className="text-white">{fileName}</span>…
              </p>
              <p className="text-xs text-slate-600">Categorizando transações</p>
            </motion.div>
          )}

          {/* ─── SUCCESS ─── */}
          {stage === "success" && result && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-5"
            >
              <div className="flex flex-col items-center gap-3 py-4">
                <CheckCircle2 size={48} className="text-emerald-400" />
                <h3 className="text-xl font-black text-white">
                  Extrato importado!
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-center">
                  <p className="text-3xl font-black text-emerald-400">
                    {result.imported}
                  </p>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">
                    Importadas
                  </p>
                </div>
                <div className="bg-white/5 border border-white/5 rounded-2xl p-4 text-center">
                  <p className="text-3xl font-black text-slate-400 flex items-center justify-center gap-1">
                    <SkipForward size={20} />
                    {result.skipped}
                  </p>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">
                    Duplicatas
                  </p>
                </div>
              </div>

              {result.period?.from && (
                <p className="text-xs text-slate-500 text-center">
                  Período:{" "}
                  <span className="text-slate-300 font-bold">
                    {fmt(result.period.from)} → {fmt(result.period.to)}
                  </span>
                </p>
              )}

              {result.imported === 0 && result.message && (
                <p className="text-xs text-amber-400 text-center bg-amber-500/10 rounded-xl p-3 border border-amber-500/20">
                  {result.message}
                </p>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 border-white/10"
                  onClick={reset}
                >
                  Importar outro
                </Button>
                <Button
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500"
                  onClick={handleClose}
                >
                  Concluir
                </Button>
              </div>
            </motion.div>
          )}

          {/* ─── ERROR ─── */}
          {stage === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-5"
            >
              <div className="flex flex-col items-center gap-3 py-4">
                <AlertCircle size={48} className="text-rose-400" />
                <h3 className="text-lg font-black text-white">
                  Falha na importação
                </h3>
                <p className="text-sm text-slate-400 text-center max-w-xs">
                  {errorMsg}
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 border-white/10"
                  onClick={handleClose}
                >
                  <X size={16} className="mr-2" /> Fechar
                </Button>
                <Button
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500"
                  onClick={reset}
                >
                  Tentar novamente
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};
