import { useState, useEffect, useCallback } from "react";
import { EDUCATION_MODULES } from "@/data/educationData";
import { showError } from "@/lib/toast";

export interface EducationState {
  completedModules: string[];
  xp: number;
  streak: number;
  lastActiveDate: string | null;
}

const DEFAULT_STATE: EducationState = {
  completedModules: [],
  xp: 0,
  streak: 0,
  lastActiveDate: null,
};

export const useEducation = () => {
  const [state, setState] = useState<EducationState>(DEFAULT_STATE);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    try {
      const saved = localStorage.getItem("mc_education");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Simple streak logic
        const targetState = { ...DEFAULT_STATE, ...parsed };
        
        if (targetState.lastActiveDate) {
          const last = new Date(targetState.lastActiveDate);
          const today = new Date();
          const diffDays = Math.floor((today.getTime() - last.getTime()) / (1000 * 3600 * 24));
          
          if (diffDays > 1) {
            targetState.streak = 0; // lost streak
          } else if (diffDays === 1) {
            targetState.streak += 1;
            targetState.lastActiveDate = today.toISOString();
          }
        } else {
          targetState.streak = 1;
          targetState.lastActiveDate = new Date().toISOString();
        }
        
        setState(targetState);
        localStorage.setItem("mc_education", JSON.stringify(targetState));
      } else {
        const init = { ...DEFAULT_STATE, lastActiveDate: new Date().toISOString(), streak: 1 };
        setState(init);
        localStorage.setItem("mc_education", JSON.stringify(init));
      }
    } catch (e: any) {
      console.error(e);
      setError("Erro interno ao carregar o seu avanço educacional: " + e.message);
      showError("Não foi possível carregar as aulas.");
      setState(DEFAULT_STATE);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const completeModule = useCallback((moduleId: string) => {
    try {
      setError(null);
      setState((prev) => {
        if (prev.completedModules.includes(moduleId)) return prev;

        const mod = EDUCATION_MODULES.find(m => m.id === moduleId);
        const reward = mod?.xp || 50;

        const newState = {
          ...prev,
          completedModules: [...prev.completedModules, moduleId],
          xp: prev.xp + reward,
          lastActiveDate: new Date().toISOString()
        };
        
        localStorage.setItem("mc_education", JSON.stringify(newState));
        return newState;
      });
    } catch (e: any) {
      const msg = "Erro crítico ao tentar aprovar sua aula: " + e.message;
      console.error(msg);
      setError(msg);
      showError("Falha ao salvar progresso educativo!");
    }
  }, []);

  const isModuleCompleted = useCallback((moduleId: string) => state.completedModules.includes(moduleId), [state.completedModules]);
  
  const getProgressPct = useCallback(() => {
    return state.completedModules.length === 0 
      ? 0 
      : Math.round((state.completedModules.length / EDUCATION_MODULES.length) * 100);
  }, [state.completedModules]);

  return {
    state,
    error,
    isLoading,
    completeModule,
    isModuleCompleted,
    getProgressPct
  };
};
