import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, TrendingDown, TrendingUp, Plus, X, PieChart } from "lucide-react";

interface SmartLaunchMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: "expense" | "income" | "voice" | "asset") => void;
}

export const SmartLaunchMenu: React.FC<SmartLaunchMenuProps> = ({
  isOpen,
  onClose,
  onAction,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="slm-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 50,
              background: "rgba(0,0,0,0.65)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              touchAction: "none",
            }}
          />

          {/* Bottom Sheet */}
          <motion.div
            key="slm-sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 250 }}
            style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 51,
              borderRadius: "32px 32px 0 0",
              background: "linear-gradient(180deg, #0f172a 0%, #0a0f1e 100%)",
              borderTop: "1px solid rgba(255,255,255,0.08)",
              padding: "24px 20px calc(env(safe-area-inset-bottom, 24px) + 16px)",
              boxShadow: "0 -24px 80px rgba(0,0,0,0.5)",
            }}
          >
            {/* Handle */}
            <div style={{
              width: 48, height: 4, borderRadius: 9999,
              background: "rgba(255,255,255,0.12)",
              margin: "0 auto 24px",
            }} />

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <div>
                <h2 style={{ color: "#fff", fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", margin: 0 }}>
                  O que vamos lançar?
                </h2>
                <p style={{ color: "rgba(148,163,184,0.8)", fontSize: 13, marginTop: 4 }}>
                  Escolha uma ação rápida
                </p>
              </div>
              <button
                onClick={onClose}
                style={{
                  width: 40, height: 40, borderRadius: "50%",
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(148,163,184,0.9)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", flexShrink: 0,
                  transition: "background 0.15s",
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Bento Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>

              {/* Card grande — Voz (col 1-2) */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onAction("voice")}
                style={{
                  gridColumn: "1 / -1",
                  position: "relative",
                  overflow: "hidden",
                  borderRadius: 20,
                  padding: "24px 24px 20px",
                  background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  minHeight: 120,
                }}
              >
                {/* Glow decoration */}
                <div style={{
                  position: "absolute", top: -20, right: -20, width: 100, height: 100,
                  borderRadius: "50%", background: "rgba(255,255,255,0.1)",
                  filter: "blur(20px)",
                }} />
                <div style={{
                  position: "absolute", top: 16, right: 16, opacity: 0.15,
                }}>
                  <Mic size={72} color="#fff" />
                </div>
                <div style={{ position: "relative", zIndex: 1 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: "50%",
                    background: "rgba(255,255,255,0.2)",
                    backdropFilter: "blur(8px)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    marginBottom: 14,
                  }}>
                    <Mic size={20} color="#fff" />
                  </div>
                  <div style={{ color: "#fff", fontWeight: 700, fontSize: 17, marginBottom: 4 }}>
                    Comando de Voz
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 13 }}>
                    "Gastei 50 reais de padaria"
                  </div>
                </div>
              </motion.button>

              {/* Card — Despesa */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onAction("expense")}
                style={{
                  borderRadius: 18,
                  padding: "20px 18px",
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: "rgba(239,68,68,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 12,
                }}>
                  <TrendingDown size={18} color="#f87171" />
                </div>
                <div style={{ color: "#f87171", fontWeight: 700, fontSize: 15 }}>Despesa</div>
                <div style={{ color: "rgba(148,163,184,0.7)", fontSize: 12, marginTop: 2 }}>Registrar saída</div>
              </motion.button>

              {/* Card — Receita */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onAction("income")}
                style={{
                  borderRadius: 18,
                  padding: "20px 18px",
                  background: "rgba(34,197,94,0.08)",
                  border: "1px solid rgba(34,197,94,0.2)",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: "rgba(34,197,94,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 12,
                }}>
                  <TrendingUp size={18} color="#4ade80" />
                </div>
                <div style={{ color: "#4ade80", fontWeight: 700, fontSize: 15 }}>Receita</div>
                <div style={{ color: "rgba(148,163,184,0.7)", fontSize: 12, marginTop: 2 }}>Registrar entrada</div>
              </motion.button>

              {/* Card — Investimento (col 1-2) */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onAction("asset")}
                style={{
                  gridColumn: "1 / -1",
                  borderRadius: 18,
                  padding: "16px 18px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: "50%",
                    background: "rgba(255,255,255,0.08)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <PieChart size={20} color="rgba(203,213,225,0.9)" />
                  </div>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>Novo Investimento</div>
                    <div style={{ color: "rgba(148,163,184,0.7)", fontSize: 12, marginTop: 2 }}>
                      Adicionar ativo à carteira
                    </div>
                  </div>
                </div>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: "rgba(255,255,255,0.08)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <Plus size={16} color="rgba(148,163,184,0.8)" />
                </div>
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
