import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { History, User, Clock, Info } from "lucide-react";
import type { AuditLogEntry } from "@/lib/audit-service";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export const AuditLogViewer = ({ workspaceId }: { workspaceId: string }) => {
  const [logs, setLogs] = useState<(AuditLogEntry & { id: string })[]>([]);

  useEffect(() => {
    if (!workspaceId) return;

    try {
      const q = query(
        collection(db, "workspaces", workspaceId, "audit_logs"),
        orderBy("timestamp", "desc"),
        limit(15)
      );

      return onSnapshot(q, (snap) => {
        const docs = snap.docs.map((doc) => ({
          ...(doc.data() as AuditLogEntry),
          id: doc.id,
        }));
        setLogs(docs);
      });
    } catch (error) {
      console.error("Error setting up audit log listener:", error);
    }
  }, [workspaceId]);

  if (logs.length === 0) return (
     <div className="pt-10 border-t border-white/5 opacity-50 text-center py-10">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
          Nenhuma atividade registrada ainda
        </p>
     </div>
  );

  return (
    <div className="space-y-6 pt-10 border-t border-white/5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-pink-500/10 rounded-lg text-pink-400">
            <History size={16} />
          </div>
          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            Histórico da <span className="text-white">Equipe</span>
          </h4>
        </div>
        <span className="text-[8px] font-black px-2 py-1 rounded bg-white/5 text-slate-500 uppercase tracking-widest">
          {logs.length} EVENTOS RECENTES
        </span>
      </div>

      <div className="space-y-3">
        <TooltipProvider>
          {logs.map((log) => {
            const date = log.timestamp?.toDate() || new Date();
            return (
              <div
                key={log.id}
                className="group p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between hover:bg-white/[0.04] transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center text-[10px] font-black text-white shrink-0 shadow-lg shadow-indigo-500/10">
                    {log.userName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-black text-white">{log.userName}</span>
                      <span className="text-[10px] font-bold text-pink-400/80 uppercase tracking-tight">
                        {log.action.replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium truncate max-w-[200px]">
                      {log.details}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="text-slate-600 hover:text-white transition-colors">
                        <Info size={14} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-slate-900 border-white/10 text-white text-[10px]">
                      <p>{log.details}</p>
                    </TooltipContent>
                  </Tooltip>
                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-600 group-hover:text-slate-400 transition-colors uppercase tracking-widest">
                      <Clock size={10} />
                      {date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                    <div className="text-[8px] text-slate-700 group-hover:text-slate-500 font-bold uppercase">
                      {date.toLocaleDateString("pt-BR")}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </TooltipProvider>
      </div>
    </div>
  );
};
