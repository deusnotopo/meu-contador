import React from "react";
import { Activity } from "lucide-react";
import { DashboardErrorBoundary } from "@/components/ui/DashboardErrorBoundary";
import { SmartAnomalyDetector } from "@/components/dashboard/SmartAnomalyDetector";
import { OpenBillsWidget } from "@/components/dashboard/OpenBillsWidget";
import { useReminders } from "@/hooks/useReminders";
import type { TabType } from "@/types/navigation";

interface ActionSectionProps {
  onNavigate: (tab: TabType) => void;
}

export const ActionSection: React.FC<ActionSectionProps> = ({
  onNavigate,
}) => {
  const remindersCtx = useReminders();

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2.5 px-1 mb-1">
        <div className="w-1 h-4 rounded-full bg-gradient-to-b from-blue-500 to-indigo-600" />
        <h2 className="text-[11px] font-black uppercase tracking-[0.18em] text-white/60 flex items-center gap-2">
          <Activity size={12} className="text-blue-400" /> Ações Imediatas
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Alertas Críticos da IA */}
        <div className="md:col-span-2">
          <DashboardErrorBoundary componentName="SmartAnomalyDetector" compact>
            <SmartAnomalyDetector />
          </DashboardErrorBoundary>
        </div>

        {/* Contas a Pagar (Prioridade Máxima) */}
        <div className="md:col-span-2">
          <OpenBillsWidget remindersCtx={remindersCtx} onNavigate={onNavigate} />
        </div>
      </div>
    </section>
  );
};

