import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { useEffect, useRef } from "react";
import { useLanguage } from "../context/LanguageContext";

export function useTour() {
  const { t } = useLanguage();
  const driverObj = useRef(
    driver({
      showProgress: true,
      animate: true,
      doneBtnText: "Pronto!",
      nextBtnText: "Próximo",
      prevBtnText: "Voltar",
      steps: [
        {
          element: "#dashboard-overview",
          popover: {
            title: "Visão Geral",
            description: "Aqui você tem um resumo rápido da sua saúde financeira.",
          },
        },
        {
          element: "#quick-actions-fab",
          popover: {
            title: "Ações Rápidas",
            description: "Adicione transações ou lembretes rapidamente clicando aqui.",
          },
        },
        {
          element: "#main-navigation",
          popover: {
            title: "Navegação",
            description: "Alterne entre Finanças Pessoais, Empresariais e Investimentos.",
          },
        },
        {
          element: "#ai-chat-trigger",
          popover: {
            title: "Assistente IA",
            description: "Converse com sua IA financeira para tirar dúvidas e obter insights.",
          },
        },
      ],
    })
  );

  const startTour = () => {
    const hasSeenTour = localStorage.getItem("hasSeenTour");
    if (!hasSeenTour) {
      driverObj.current.drive();
      localStorage.setItem("hasSeenTour", "true");
    }
  };

  const forceStartTour = () => {
    driverObj.current.drive();
  };

  return { startTour, forceStartTour };
}
