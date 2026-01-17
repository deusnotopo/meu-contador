export type Language = "pt-BR" | "en-US";
export type TranslationKey = keyof (typeof translations)["pt-BR"];

export const translations = {
  "pt-BR": {
    // Navigation
    "nav.overview": "Resumo",
    "nav.personal": "Pessoal",
    "nav.business": "Negócio",
    "nav.investments": "Investir",
    "nav.education": "Aprender",
    "nav.settings": "Ajustes",

    // Dashboard
    "dash.greeting": "Olá", // Intentionally simple to be combined with name
    "dash.balance": "Saldo Total",
    "dash.month_expenses": "Gastos do Mês",
    "dash.month_income": "Receitas do Mês",
    "dash.actions": "Ações Rápidas",
    "dash.new_transaction": "Nova Transação",
    "dash.export_report": "Exportar Relatório",

    // Transactions
    "transactions.title": "Transações",
    "transactions.date": "Data",
    "transactions.description": "Descrição",
    "transactions.category": "Categoria",
    "transactions.amount": "Valor",
    "transactions.type": "Tipo",
    "transactions.income": "Receita",
    "transactions.expense": "Despesa",
    "transactions.add_new": "Adicionar Nova Transação",
    "transactions.filter_by_type": "Filtrar por Tipo",
    "transactions.filter_by_category": "Filtrar por Categoria",
    "transactions.no_transactions": "Nenhuma transação encontrada.",

    // Categories
    "categories.title": "Categorias",
    "categories.add_new": "Adicionar Nova Categoria",
    "categories.name": "Nome da Categoria",
    "categories.type": "Tipo de Categoria",
    "categories.color": "Cor",
    "categories.icon": "Ícone",
    "categories.no_categories": "Nenhuma categoria encontrada.",

    // Reports
    "reports.title": "Relatórios",
    "reports.monthly_summary": "Resumo Mensal",
    "reports.expense_breakdown": "Detalhes de Despesas",
    "reports.income_vs_expense": "Receita vs Despesa",
    "reports.generate": "Gerar Relatório",
    "reports.start_date": "Data de Início",
    "reports.end_date": "Data de Término",

    // Settings
    "settings.title": "Configurações",
    "settings.subtitle": "Gerencie sua conta e preferências do app",
    "settings.logout": "Sair",
    "settings.save": "Salvar Todas as Mudanças",
    "settings.language": "Idioma / Language",
    "settings.language.desc": "Escolha o idioma do aplicativo",
    "settings.privacy": "Privacidade",
    "settings.notifications": "Notificações",
    "settings.theme": "Tema",
    "settings.currency": "Moeda",
    "settings.about": "Sobre",
  },
  "en-US": {
    // Navigation
    "nav.overview": "Overview",
    "nav.personal": "Personal",
    "nav.business": "Business",
    "nav.investments": "Invest",
    "nav.education": "Learn",
    "nav.settings": "Settings",

    // Dashboard
    "dash.greeting": "Hello",
    "dash.balance": "Total Balance",
    "dash.month_expenses": "Monthly Expenses",
    "dash.month_income": "Monthly Income",
    "dash.actions": "Quick Actions",
    "dash.new_transaction": "New Transaction",
    "dash.export_report": "Export Report",

    // Transactions
    "transactions.title": "Transactions",
    "transactions.date": "Date",
    "transactions.description": "Description",
    "transactions.category": "Category",
    "transactions.amount": "Amount",
    "transactions.type": "Type",
    "transactions.income": "Income",
    "transactions.expense": "Expense",
    "transactions.add_new": "Add New Transaction",
    "transactions.filter_by_type": "Filter by Type",
    "transactions.filter_by_category": "Filter by Category",
    "transactions.no_transactions": "No transactions found.",

    // Categories
    "categories.title": "Categories",
    "categories.add_new": "Add New Category",
    "categories.name": "Category Name",
    "categories.type": "Category Type",
    "categories.color": "Color",
    "categories.icon": "Icon",
    "categories.no_categories": "No categories found.",

    // Reports
    "reports.title": "Reports",
    "reports.monthly_summary": "Monthly Summary",
    "reports.expense_breakdown": "Expense Breakdown",
    "reports.income_vs_expense": "Income vs Expense",
    "reports.generate": "Generate Report",
    "reports.start_date": "Start Date",
    "reports.end_date": "End Date",

    // Settings
    "settings.title": "Settings",
    "settings.subtitle": "Manage your account and app preferences",
    "settings.logout": "Logout",
    "settings.save": "Save All Changes",
    "settings.language": "Language",
    "settings.language.desc": "Choose your application language",
    "settings.privacy": "Privacy",
    "settings.notifications": "Notifications",
    "settings.theme": "Theme",
    "settings.currency": "Currency",
    "settings.about": "About",
  },
};

export type TranslationKey = keyof (typeof translations)["pt-BR"];
