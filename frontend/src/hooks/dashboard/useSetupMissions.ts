import { useMemo } from "react";
import { useInvestments } from "../useInvestments";
import { useDebts } from "../useDebts";
import { useGoals } from "../useGoals";
import type { SetupMission } from "@/components/dashboard/SetupJourneyWidget";
import type { TabType } from "@/types/navigation";

export const useSetupMissions = () => {
  const { totals: investTotals } = useInvestments();
  const { totals: debtTotals } = useDebts();
  const { goals } = useGoals();

  const missions = useMemo<SetupMission[]>(() => {
    return [
      {
        id: "invest",
        emoji: "📈",
        label: "Cadastrar Investimentos",
        sub: "Sincronize sua carteira",
        xp: 150,
        done: investTotals.currentValue > 0,
        tab: "investments" as TabType,
      },
      {
        id: "debts",
        emoji: "💳",
        label: "Mapear Dívidas",
        sub: "Controle seus passivos",
        xp: 100,
        done: debtTotals.totalBalance > 0,
        tab: "debts" as TabType,
      },
      {
        id: "goals",
        emoji: "🎯",
        label: "Definir Primeira Meta",
        sub: "Crie um objetivo futuro",
        xp: 200,
        done: goals.length > 0,
        tab: "planning" as TabType,
      },
    ];
  }, [investTotals.currentValue, debtTotals.totalBalance, goals.length]);

  return { missions };
};
