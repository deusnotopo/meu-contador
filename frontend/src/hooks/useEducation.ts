import { useState, useEffect } from "react";
import { EDUCATION_MODULES } from "@/data/educationData";

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

  useEffect(() => {
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
    } catch (e) {
      console.error(e);
    }
  }, []);

  const completeModule = (moduleId: string) => {
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
  };

  const isModuleCompleted = (moduleId: string) => state.completedModules.includes(moduleId);
  const getProgressPct = () => state.completedModules.length === 0 ? 0 : Math.round((state.completedModules.length / EDUCATION_MODULES.length) * 100);

  return {
    state,
    completeModule,
    isModuleCompleted,
    getProgressPct
  };
};
