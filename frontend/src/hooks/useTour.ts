import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { useRef, useCallback } from "react";
import { useTourStatus } from "../context/TourContext";
import { TOUR_CONFIGS } from "../types/tourConfigs";

export function useTour() {
  const { markTourAsCompleted, hasSeenTour } = useTourStatus();
  
  const activeDriver = useRef<ReturnType<typeof driver> | null>(null);

  const startTour = useCallback((sectionId: string, force = false) => {
    // Se o tour já foi visto e não estamos forçando, cancela
    if (hasSeenTour(sectionId) && !force) return;

    // Se não há passos configurados para essa seção, cancela
    const steps = TOUR_CONFIGS[sectionId];
    if (!steps || steps.length === 0) return;

    // Garante que não haja múltiplos tours simultâneos
    if (activeDriver.current) {
      activeDriver.current.destroy();
    }

    const driverObj = driver({
      showProgress: true,
      animate: true,
      doneBtnText: "Pronto! ✨",
      nextBtnText: "Próximo",
      prevBtnText: "Voltar",
      steps: steps,
      onDestroyStarted: () => {
        // Marca como concluído ao fechar o tour
        markTourAsCompleted(sectionId);
        driverObj.destroy();
        activeDriver.current = null;
      },
    });

    activeDriver.current = driverObj;
    driverObj.drive();
  }, [hasSeenTour, markTourAsCompleted]);

  return { startTour };
}
