/**
 * OpenFinanceWidget.tsx
 * Exibe conexões bancárias (Pluggy/Open Finance) com status de sincronização
 * e botão de force-sync. Usa useOpenFinance hook existente.
 */
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, Building2, Unplug, Check, AlertTriangle, ChevronRight, Wifi } from "lucide-react";
import { useOpenFinance, type BankConnection } from "@/hooks/useOpenFinance";
import type { TabType } from "@/types/navigation";
import { DataReliabilityBadge } from "@/components/ui/DataReliabilityBadge";

interface OpenFinanceWidgetProps {
  onNavigate?: (tab: TabType) => void;
}

function formatLastSync(dt: string | null) {
  if (!dt) return "Nunca sincronizado";
  const d = new Date(dt);
  const diff = (Date.now() - d.getTime()) / 60000; // minutos
  if (diff < 1) return "Agora mesmo";
  if (diff < 60) return `${Math.round(diff)}min atrás`;
  if (diff < 1440) return `${Math.round(diff / 60)}h atrás`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

const StatusBadge = ({ status }: { status: string }) => {
  const s = status?.toLowerCase();
  if (s === "updated" || s === "connected")
    return <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full"><Check size={8}/> Sync</span>;
  if (s === "error" || s === "login_error")
    return <span className="flex items-center gap-1 text-[9px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded-full"><AlertTriangle size={8}/> Erro</span>;
  return <span className="flex items-center gap-1 text-[9px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full"><RefreshCw size={8}/> {status ?? "Aguardando"}</span>;
};

const ConnectionCard = ({
  conn,
  onSync,
  syncing,
}: {
  conn: BankConnection;
  onSync: (id: string) => void;
  syncing: boolean;
}) => {
  const totalBalance = conn.accounts.reduce((s, a) => s + (a.balance ?? 0), 0);
  const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4 hover:bg-white/[0.04] transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {conn.accounts[0]?.bankImageUrl ? (
            <img
              src={conn.accounts[0].bankImageUrl}
              alt={conn.accounts[0].bankName}
              className="w-9 h-9 rounded-xl object-contain bg-white/5 border border-white/10 p-1"
            />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Building2 size={18} />
            </div>
          )}
          <div>
            <div className="text-[13px] font-bold text-white leading-snug">
              {conn.accounts[0]?.bankName || "Banco"}
            </div>
            <div className="text-[10px] text-neutral-500 font-mono">
              {formatLastSync(conn.lastSyncAt)}
            </div>
          </div>
        </div>
        <StatusBadge status={conn.status} />
      </div>

      {/* Contas */}
      {conn.accounts.length > 0 && (
        <div className="space-y-1 mb-3">
          {conn.accounts.slice(0, 3).map((acc) => (
            <div key={acc.id} className="flex items-center justify-between text-[11px]">
              <span className="text-neutral-400 truncate max-w-[130px]">{acc.name}</span>
              <span className={`font-mono font-bold ${acc.balance >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {fmt(acc.balance ?? 0)}
              </span>
            </div>
          ))}
          {conn.accounts.length > 3 && (
            <div className="text-[10px] text-neutral-600">+{conn.accounts.length - 3} mais contas</div>
          )}
        </div>
      )}

      {/* Total + Sync button */}
      <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
        <div>
          <div className="text-[9px] uppercase tracking-widest text-neutral-600 font-bold">Total</div>
          <div className={`text-[14px] font-black font-mono ${totalBalance >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {fmt(totalBalance)}
          </div>
        </div>
        <button
          onClick={() => onSync(conn.pluggyItemId)}
          disabled={syncing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/15 disabled:opacity-50 transition-all"
          aria-label="Forçar sincronização"
        >
          <RefreshCw size={12} className={syncing ? "animate-spin" : ""} />
          {syncing ? "Sync..." : "Sync"}
        </button>
      </div>
    </motion.div>
  );
};

export const OpenFinanceWidget = ({ onNavigate }: OpenFinanceWidgetProps) => {
  const { connections, isLoading, error, fetchConnections, forceSync } = useOpenFinance();
  const [syncingId, setSyncingId] = useState<string | null>(null);

  useEffect(() => {
    const handleReady = () => fetchConnections();
    window.addEventListener("auth:session-ready", handleReady);
    return () => window.removeEventListener("auth:session-ready", handleReady);
  }, [fetchConnections]);

  const handleSync = async (itemId: string) => {
    setSyncingId(itemId);
    try { await forceSync(itemId); }
    catch { /* error shown in status */ }
    finally { setSyncingId(null); }
  };

  // Empty state — user has no connections
  if (!isLoading && !error && connections.length === 0) {
    return (
      <div className="bento-card bento-full p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
          <Wifi size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-bold text-white/70">Nenhum banco conectado</p>
          <p className="text-[10px] text-white/30">Open Finance — importação automática</p>
        </div>
        <button
          onClick={() => onNavigate?.("settings")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold text-blue-300 border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 transition-all whitespace-nowrap shrink-0"
        >
          <Unplug size={11} /> Conectar
        </button>
      </div>
    );
  }

  return (
    <div className="bento-card bento-full p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="flex items-center gap-2 text-[10px] font-black text-white uppercase tracking-widest">
          <Wifi className="text-blue-400" size={14} aria-hidden />
          Open Finance
        </h4>
        <div className="flex items-center gap-2">
          {connections.length > 0 && (
            <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {connections.length} {connections.length === 1 ? "banco" : "bancos"}
            </span>
          )}
          <button
            onClick={() => onNavigate?.("settings")}
            className="flex items-center gap-1 text-[10px] text-neutral-500 hover:text-white transition-colors"
            aria-label="Gerenciar conexões"
          >
            Gerenciar <ChevronRight size={12} />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <DataReliabilityBadge reliability="EXTERNAL_SOURCE" sourceLabel="Pluggy / Open Finance" compact />
        <p className="text-[10px] text-white/40 leading-relaxed">
          Saldos dependem da última sincronização e podem divergir do internet banking em tempo real.
        </p>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center items-center gap-2 py-6">
          <div className="w-5 h-5 rounded-full border-2 border-white/10 border-t-blue-400 animate-spin" />
          <p className="text-xs text-white/40">Carregando conexões...</p>
        </div>
      )}

      {/* Error */}
      {error && !isLoading && (
        <div className="text-center py-4">
          <p className="text-[12px] text-rose-400">{error}</p>
          <button onClick={() => fetchConnections()} className="text-[11px] text-blue-400 mt-2 hover:underline">
            Tentar novamente
          </button>
        </div>
      )}

      {/* Connections list */}
      <AnimatePresence>
        {!isLoading && !error && (
          <div className="space-y-3">
            {connections.map((conn) => (
              <ConnectionCard
                key={conn.id}
                conn={conn}
                onSync={handleSync}
                syncing={syncingId === conn.pluggyItemId}
              />
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
