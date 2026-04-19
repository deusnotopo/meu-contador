import React, { useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { Mic, TrendingDown, TrendingUp, Plus, X, PieChart, Sparkles, Upload } from "lucide-react";

interface SmartLaunchMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: "expense" | "income" | "voice" | "asset" | "scan_receipt") => void;
}

// Stagger variants for child tiles
const tileVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: 0.06 + i * 0.055, type: "spring" as const, stiffness: 340, damping: 28 },
  }),
  exit: { opacity: 0, y: 16, scale: 0.97, transition: { duration: 0.15 } },
};

export const SmartLaunchMenu: React.FC<SmartLaunchMenuProps> = ({ isOpen, onClose, onAction }) => {
  // Swipe-down to dismiss
  const y = useMotionValue(0);
  const opacity = useTransform(y, [0, 160], [1, 0]);
  const sheetRef = useRef<HTMLDivElement>(null);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ── Backdrop ── */}
          <motion.div
            key="slm-bd"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 z-50 touch-none"
            style={{ background: "rgba(3,7,18,0.78)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)" }}
          />

          {/* ── Bottom Sheet ── */}
          <motion.div
            key="slm-sheet"
            ref={sheetRef}
            style={{
              y,
              opacity,
              borderRadius: "28px 28px 0 0",
              background: "linear-gradient(180deg, rgba(10,13,28,0.98) 0%, rgba(5,8,18,1) 100%)",
              borderTop: "1px solid rgba(255,255,255,0.07)",
              boxShadow: "0 -32px 80px rgba(0,0,0,0.75)",
              paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)",
            }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.35 }}
            onDragEnd={(_, info) => { if (info.offset.y > 90) onClose(); }}
            className="fixed bottom-0 left-0 right-0 z-[51] overflow-hidden overscroll-none"
          >
            {/* Ambient ring glow */}
            <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[300px] h-[200px] rounded-full"
              style={{ background: "radial-gradient(ellipse at top, rgba(99,102,241,0.18) 0%, transparent 70%)", filter: "blur(24px)" }} />

            <div className="px-5 pt-5">
              {/* ── Handle ── */}
              <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: "rgba(255,255,255,0.12)" }} />

              {/* ── Header ── */}
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.04, duration: 0.3 }}
                className="flex items-center justify-between mb-5"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 rounded-[8px] flex items-center justify-center"
                      style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)", boxShadow: "0 4px 12px rgba(79,70,229,0.4)" }}>
                      <Plus size={14} strokeWidth={2.8} color="#fff" />
                    </div>
                    <span className="font-display text-[18px] font-bold text-white tracking-tight">Menu Rápido</span>
                    <span className="text-[9px] font-mono text-indigo-400 tracking-[0.1em] px-1.5 py-0.5 border border-indigo-500/30 rounded bg-indigo-500/10">FAB</span>
                  </div>
                  <p className="text-[12px] text-[rgba(148,163,184,0.6)] font-medium tracking-wide">
                    Selecione a operação
                  </p>
                </div>
                <button
                  onClick={onClose}
                  aria-label="Fechar menu"
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}
                >
                  <X size={17} color="rgba(148,163,184,0.8)" />
                </button>
              </motion.div>

              {/* ── Bento Grid ── */}
              <div className="grid grid-cols-2 gap-2.5">

                {/* ── VOICE — span full, hero tile ── */}
                <motion.button
                  custom={0} variants={tileVariants} initial="hidden" animate="visible" exit="exit"
                  whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.96 }}
                  onClick={() => onAction("voice")}
                  className="col-span-2 relative overflow-hidden rounded-[20px] p-5 text-left cursor-pointer group min-h-[108px]"
                  style={{
                    background: "linear-gradient(135deg, #2563eb 0%, #4f46e5 55%, #7c3aed 100%)",
                    boxShadow: "0 12px 32px rgba(79,70,229,0.4), 0 0 0 1px rgba(99,102,241,0.3)",
                  }}
                >
                  {/* decoration rings */}
                  <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full opacity-15 group-hover:opacity-25 transition-opacity duration-500"
                    style={{ background: "radial-gradient(circle, rgba(255,255,255,0.9), transparent)" }} />
                  <div className="absolute top-0 right-0 p-4 opacity-[0.08] group-hover:opacity-[0.13] transition-opacity duration-500">
                    <Mic size={72} color="#fff" />
                  </div>
                  <div className="relative z-10 flex flex-col justify-between h-full">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center mb-3"
                      style={{ background: "rgba(255,255,255,0.22)", backdropFilter: "blur(8px)" }}>
                      <Mic size={18} color="#fff" />
                    </div>
                    <div>
                      <div className="text-white font-bold text-[16px] tracking-tight leading-tight mb-0.5">Comando de Voz</div>
                      <div className="text-blue-100/75 text-[11px] font-medium tracking-wide">"Gastei R$50 de padaria hoje"</div>
                    </div>
                  </div>
                </motion.button>

                {/* ── DESPESA ── */}
                <motion.button
                  custom={1} variants={tileVariants} initial="hidden" animate="visible" exit="exit"
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }}
                  onClick={() => onAction("expense")}
                  className="rounded-[18px] p-4 text-left cursor-pointer transition-colors"
                  style={{ background: "rgba(239,68,68,0.09)", border: "1px solid rgba(239,68,68,0.2)" }}
                >
                  <div className="w-9 h-9 rounded-full flex items-center justify-center mb-3"
                    style={{ background: "rgba(239,68,68,0.18)" }}>
                    <TrendingDown size={17} color="#f87171" />
                  </div>
                  <div className="text-[#f87171] font-bold text-[14px] tracking-tight">Despesa</div>
                  <div className="text-[rgba(148,163,184,0.6)] text-[11px] font-medium mt-0.5">Saída de dinheiro</div>
                </motion.button>

                {/* ── RECEITA ── */}
                <motion.button
                  custom={2} variants={tileVariants} initial="hidden" animate="visible" exit="exit"
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }}
                  onClick={() => onAction("income")}
                  className="rounded-[18px] p-4 text-left cursor-pointer transition-colors"
                  style={{ background: "rgba(16,185,129,0.09)", border: "1px solid rgba(16,185,129,0.2)" }}
                >
                  <div className="w-9 h-9 rounded-full flex items-center justify-center mb-3"
                    style={{ background: "rgba(16,185,129,0.18)" }}>
                    <TrendingUp size={17} color="#34d399" />
                  </div>
                  <div className="text-[#34d399] font-bold text-[14px] tracking-tight">Receita</div>
                  <div className="text-[rgba(148,163,184,0.6)] text-[11px] font-medium mt-0.5">Entrada de dinheiro</div>
                </motion.button>

                {/* ── INVESTIMENTO ── */}
                <motion.button
                  custom={3} variants={tileVariants} initial="hidden" animate="visible" exit="exit"
                  whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.97 }}
                  onClick={() => onAction("asset")}
                  className="col-span-2 rounded-[18px] p-4 cursor-pointer flex items-center justify-between group transition-colors"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.07)" }}>
                      <PieChart size={19} color="rgba(148,163,184,0.8)" />
                    </div>
                    <div className="text-left">
                      <div className="text-white font-bold text-[14px] tracking-tight">Novo Investimento</div>
                      <div className="text-[rgba(148,163,184,0.55)] text-[11px] font-medium">Adicionar ativo à carteira</div>
                    </div>
                  </div>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors duration-200"
                    style={{ background: "rgba(255,255,255,0.05)" }}>
                    <Plus size={14} color="rgba(148,163,184,0.7)" />
                  </div>
                </motion.button>

                {/* ── GEMINI AI IMPORTER ── */}
                <motion.button
                  custom={4} variants={tileVariants} initial="hidden" animate="visible" exit="exit"
                  whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.97 }}
                  onClick={() => onAction("scan_receipt")}
                  className="col-span-2 rounded-[18px] p-4 cursor-pointer flex items-center justify-between group transition-colors"
                  style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.22)" }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0"
                      style={{ background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.3)" }}>
                      <Sparkles size={19} color="#a5b4fc" />
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[#a5b4fc] font-bold text-[14px] tracking-tight">Leitor de Fatura</span>
                        <span className="text-[8px] font-bold tracking-[0.08em] px-1.5 py-[2px] rounded-sm"
                          style={{ background: "rgba(99,102,241,0.25)", color: "#c7d2fe" }}>GEMINI</span>
                      </div>
                      <div className="text-[rgba(167,178,252,0.55)] text-[11px] font-medium">Extrai PDFs e prints com IA</div>
                    </div>
                  </div>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors duration-200"
                    style={{ background: "rgba(99,102,241,0.25)" }}>
                    <Upload size={14} color="#a5b4fc" />
                  </div>
                </motion.button>

              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
