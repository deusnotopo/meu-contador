import { DriveStep } from "driver.js";

export const TOUR_CONFIGS: Record<string, DriveStep[]> = {
  dashboard: [
    {
      element: "#dashboard-overview",
      popover: {
        title: "Visão Geral 📊",
        description: "Aqui está o resumo do seu lucro líquido e saúde financeira atual.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "#main-navigation",
      popover: {
        title: "Navegação Rápida 🚀",
        description: "Alterne entre os pilares: Pessoal, Investimentos e Empresa.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "#quick-actions-fab",
      popover: {
        title: "Ações Instantâneas ⚡",
        description: "Clique aqui para adicionar ganhos, gastos ou notas rapidamente.",
        side: "left",
        align: "center",
      },
    },
  ],
  budgets: [
    {
      element: "#budget-hero",
      popover: {
        title: "Sistema de Envelopes ✉️",
        description: "Veja quanto você ainda tem disponível para gastar no mês.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "#add-envelope-btn",
      popover: {
        title: "Novo Limite ➕",
        description: "Crie um novo envelope para controlar uma categoria específica.",
        side: "left",
        align: "center",
      },
    },
    {
      element: "#budget-groups",
      popover: {
        title: "Categorização Inteligente 🧩",
        description: "Seus gastos são divididos em Necessidades, Desejos e Poupança (50/30/20).",
        side: "top",
        align: "start",
      },
    },
  ],
  investments: [
    {
      element: "#investments-summary",
      popover: {
        title: "Patrimônio Total 💰",
        description: "Soma de todos os seus ativos em renda fixa, variável e cripto.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "#asset-allocation-chart",
      popover: {
        title: "Distribuição de Ativos 📈",
        description: "Visualize se sua carteira está equilibrada conforme seu perfil.",
        side: "top",
        align: "center",
      },
    },
  ],
  ai: [
    {
      element: "#ai-chat-container",
      popover: {
        title: "Seu Consultor Financeiro 🤖",
        description: "Pergunte qualquer coisa sobre seus dados ou peça conselhos de economia.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "#ai-context-indicator",
      popover: {
        title: "IA Contextualizada ✅",
        description: "A IA lê seus dados reais para dar respostas precisas e personalizadas.",
        side: "top",
        align: "start",
      },
    },
  ],
};
