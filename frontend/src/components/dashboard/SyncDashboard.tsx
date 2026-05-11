/**
 * SyncDashboard.tsx
 * ─────────────────
 * Phase 21: Open Finance Sync Dashboard
 *
 * Displays reconciliation health for all connected bank accounts.
 * Data source: GET /banking/health
 *
 * Features:
 *  - Health score gauge (0-100%)
 *  - Per-account matched / discrepancy status
 *  - Last sync time
 *  - Quick sync trigger per connection
 *  - Discrepancy amount in BRL
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, ShieldAlert, Shield, RefreshCw,
  Building2, Clock, CheckCircle2, AlertTriangle,
  Loader2, TrendingDown, Wifi
} from "lucide-react";
import { api } from "@/lib/api";
import { useOpenFinance } from "@/hooks/useOpenFinance";

// ── Types ────────────────────────────────────────────────────────────────────

interface AccountHealth {
  bankAccountId: string;
  accountName: string;
  bankName: string;
  bankImageUrl: string | null;
  actualBalance: number;         // cents × 100
  calculatedBalance: number;     // cents × 100
  discrepancy: number;           // cents × 100
  reconciliationStatus: "matched" | "discrepancy" | "no_data";
  connectionStatus: string;
  lastSyncAt: string | null;
  transactionCount: number;
}

interface HealthSummary {
  totalAccounts: number;
  matched: number;
  discrepant: number;
  noData: number;
  healthScore: number;
  totalDiscrepancyCents: number;
}

interface BankingHealth {
  accounts: AccountHealth[];
  summary: HealthSummary;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function formatLastSync(dt: string | null) {
  if (!dt) return "Nunca";
  const diff = (Date.now() - new Date(dt).getTime()) / 60000;
  if (diff < 1) return "Agora";
  if (diff < 60) return `${Math.round(diff)}min`;
  if (diff < 1440) return `${Math.round(diff / 60)}h`;
  return `${Math.round(diff / 1440)}d`;
}

// ── Health Score Gauge ────────────────────────────────────────────────────────

const HealthGauge = ({ score }: { score: number }) => {
  const color =
    score >= 90 ? "#22d3a0" : score >= 70 ? "#f59e0b" : "#f43f5e";
  const label =
    score >= 90 ? "Excelente" : score >= 70 ? "Atenção" : "Crítico";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-20 h-20">
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
          <circle
            cx="40" cy="40" r="32"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 32}`}
            strokeDashoffset={`${2 * Math.PI * 32 * (1 - score / 100)}`}
            style={{ transition: "stroke-dashoffset 1s ease, stroke 0.5s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-black" style={{ color }}>{score}%</span>
        </div>
      </div>
      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color }}>
        {label}
      </span>
    </div>
  );
};

// ── Account Health Row ────────────────────────────────────────────────────────

const AccountHealthRow = ({
  account,
  onSync,
  syncing,
}: {
  account: AccountHealth;
  onSync: () => void;
  syncing: boolean;
}) => {
  const isOk = account.reconciliationStatus === "matched";
  const isDiscrepant = account.reconciliationStatus === "discrepancy";
  const noData = account.reconciliationStatus === "no_data";

  return (
    <div
      className={`
        flex items-center gap-3 p-3 rounded-xl border transition-all
        ${isOk ? "border-emerald-500/20 bg-emerald-500/[0.03]" : ""}
        ${isDiscrepant ? "border-rose-500/20 bg-rose-500/[0.04]" : ""}
        ${noData ? "border-white/[0.04] bg-white/[0.02]" : ""}
      `}
    >
      {/* Bank logo */}
      {account.bankImageUrl ? (
        <img
          src={account.bankImageUrl}
          alt={account.bankName}
          className="w-8 h-8 rounded-lg object-contain bg-white/5 border border-white/10 p-1 flex-shrink-0"
        />
      ) : (
        <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
          <Building2 size={15} className="text-blue-400" />
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-bold text-white/90 truncate">{account.accountName}</div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="flex items-center gap-1 text-[9px] text-white/30">
            <Clock size={9} />
            {formatLastSync(account.lastSyncAt)}
          </span>
          <span className="text-[9px] text-white/20">·</span>
          <span className="text-[9px] text-white/30">{account.transactionCount} transações</span>
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {isOk && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle2 size={10} className="text-emerald-400" />
            <span className="text-[9px] font-bold text-emerald-400">OK</span>
          </div>
        )}
        {isDiscrepant && (
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20">
              <AlertTriangle size={10} className="text-rose-400" />
              <span className="text-[9px] font-bold text-rose-400">Divergência</span>
            </div>
            <span className="text-[9px] font-mono text-rose-400/70 mt-0.5">
              {fmt(account.discrepancy)}
            </span>
          </div>
        )}
        {noData && (
          <span className="text-[9px] text-white/30">Sem dados</span>
        )}

        <button
          onClick={onSync}
          disabled={syncing}
          className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/5 hover:bg-blue-500/10 border border-white/10 text-white/40 hover:text-blue-400 transition-all disabled:opacity-40"
          aria-label="Forçar sincronização"
        >
          <RefreshCw size={11} className={syncing ? "animate-spin" : ""} />
        </button>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

export const SyncDashboard = () => {
  const [health, setHealth] = useState<BankingHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const { forceSync, connections } = useOpenFinance();

  const loadHealth = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<BankingHealth>("/banking/health");
      setHealth(data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    loadHealth();
  }, [loadHealth]);

  const handleSync = async (pluggyItemId: string, bankAccountId: string) => {
    setSyncingId(bankAccountId);
    try {
      await forceSync(pluggyItemId);
      await loadHealth(); // refresh health after sync
    } catch { /* silent */ }
    finally { setSyncingId(null); }
  };

  // Find pluggyItemId for an account
  const findPluggyItem = (bankAccountId: string): string | null => {
    for (const conn of connections) {
      const acc = conn.accounts.find(a => a.id === bankAccountId);
      if (acc) return conn.pluggyItemId;
    }
    return null;
  };

  const score = health?.summary.healthScore ?? 100;
  const { matched = 0, discrepant = 0, noData = 0, totalDiscrepancyCents = 0 } =
    health?.summary ?? {};

  return (
    <div className="bento-card bento-full p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wifi size={16} className="text-blue-400" />
          <h3 className="text-[11px] font-black uppercase tracking-widest text-white/80">
            Open Finance — Saúde da Sync
          </h3>
        </div>
        <button
          onClick={loadHealth}
          disabled={loading}
          className="flex items-center gap-1.5 text-[10px] font-bold text-white/30 hover:text-white transition-all disabled:opacity-40"
        >
          <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
          Atualizar
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 gap-3 text-white/30">
          <Loader2 size={22} className="animate-spin" />
          <span className="text-xs">Verificando reconciliações...</span>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Stats bar */}
            <div className="flex items-center gap-4">
              <HealthGauge score={score} />

              <div className="flex-1 grid grid-cols-3 gap-3">
                {[
                  { label: "Sincronizadas", value: matched, color: "text-emerald-400", icon: <ShieldCheck size={14} className="text-emerald-400" /> },
                  { label: "Divergências", value: discrepant, color: "text-rose-400", icon: <ShieldAlert size={14} className="text-rose-400" /> },
                  { label: "Sem Dados", value: noData, color: "text-white/30", icon: <Shield size={14} className="text-white/30" /> },
                ].map(({ label, value, color, icon }) => (
                  <div key={label} className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    {icon}
                    <div className={`text-xl font-black ${color}`}>{value}</div>
                    <div className="text-[8px] font-bold uppercase tracking-widest text-white/30 text-center leading-tight">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Discrepancy alert */}
            {discrepant > 0 && totalDiscrepancyCents > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-500/5 border border-rose-500/20">
                <TrendingDown size={14} className="text-rose-400 flex-shrink-0" />
                <p className="text-[11px] text-rose-300/80">
                  Total em divergência: <strong>{fmt(totalDiscrepancyCents)}</strong> — sincronize as contas para reconciliar.
                </p>
              </div>
            )}

            {/* Account list */}
            {(health?.accounts.length ?? 0) > 0 ? (
              <div className="space-y-2">
                {health!.accounts.map(account => (
                  <AccountHealthRow
                    key={account.bankAccountId}
                    account={account}
                    syncing={syncingId === account.bankAccountId}
                    onSync={() => {
                      const itemId = findPluggyItem(account.bankAccountId);
                      if (itemId) handleSync(itemId, account.bankAccountId);
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-8 text-white/30">
                <Wifi size={28} />
                <span className="text-xs">Nenhuma conta bancária conectada</span>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};
