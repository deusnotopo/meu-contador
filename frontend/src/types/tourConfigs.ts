import { DriveStep } from "driver.js";

export const TOUR_CONFIGS: Record<string, DriveStep[]> = {
  dashboard: [
    {
      element: "#dashboard-overview",
      popover: {
        title: "Raio-X do Dinheiro 🩻",
        description: "Saldo positivo não é sinônimo de lucro real. Esta é a sua visão executiva primária. Mantenha a sangria de gastos sob controle e sua taxa de acumulação viva.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "#main-navigation",
      popover: {
        title: "Mudança de Chapéu 🎩",
        description: "Alterne sua mentalidade instantaneamente: de Consumidor (Pessoal) para Acionista (Investimentos). O foco constante gera consistência.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "#quick-actions-fab",
      popover: {
        title: "Operação Conta Gotas 💧",
        description: "Sem controle no micro, você morre no macro. Registre qualquer entrada ou saída em segundos. Pare de confiar na memória, delegue para o sistema.",
        side: "left",
        align: "center",
      },
    },
  ],
  budgets: [
    {
      element: "#budget-hero",
      popover: {
        title: "Teto de Gastos Implacável 🛡️",
        description: "A regra de ouro de quem acumula capital: pague a si mesmo primeiro. Os envelopes estancam o consumismo e criam escassez intencional.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "#add-envelope-btn",
      popover: {
        title: "Crie Suas Barreiras ➕",
        description: "Crie um novo limite para categorias onde seu dinheiro vaza (ex: delivery). Estourou a cota do mês? É o sinal verde para fechar a carteira.",
        side: "left",
        align: "center",
      },
    },
    {
      element: "#budget-groups",
      popover: {
        title: "A Lei de Ferro do Orçamento 🧠",
        description: "Suas finanças na navalha 50/30/20. Se seus 'Custos de Sobrevivência' passarem dos 50%, seu próprio padrão de vida é o seu maior passivo.",
        side: "top",
        align: "start",
      },
    },
  ],
  investments: [
    {
      element: "#investments-summary",
      popover: {
        title: "Cockpit do Patrimônio 💼",
        description: "Isso não é apenas um cofre, é uma máquina de alocação de risco. Seu dinheiro deve suar por você contra a taxa Selic e o IPCA. Avalie aqui o estrago.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "#asset-allocation-chart",
      popover: {
        title: "Matriz de Alocação 📈",
        description: "Risco invisível custa caro. Monitore sua correlação: renda fixa protege o chão, variável levanta o teto. Distribua o risco com frieza institucional.",
        side: "top",
        align: "center",
      },
    },
  ],
  health: [
    {
      element: "#health-score",
      popover: {
        title: "Score 360° Real 🩺",
        description: "Uma métrica calculada baseada em liquidez, diversificação, alavancagem e sua psicologia atual. O ser humano quebra por dívida ou por Pânico.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: "#health-dimensions",
      popover: {
        title: "Diagnóstico Tático 🧬",
        description: "Nada de dicas genéricas. Clique nas dimensões para ver o parecer do motor heurístico. Menos de 6 meses em caixa emergencial? Acenda o alerta amarelo.",
        side: "top",
        align: "start",
      },
    }
  ],
  ai: [
    {
      element: "#ai-chat-container",
      popover: {
        title: "CFO Neural Particular 🤖",
        description: "Esqueça perguntas triviais. Peça auditorias críticas de caixa, projeções de aposentadoria F.I.R.E, e estresse seus piores cenários orçamentários com a IA.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "#ai-context-indicator",
      popover: {
        title: "Algoritmos Cientes 📡",
        description: "Nossa IA absorve as curvas passadas do seu histórico bancário para detectar anomalias automáticas. O insight que você nem sabia que precisava nasce aqui.",
        side: "top",
        align: "start",
      },
    },
  ],
};
