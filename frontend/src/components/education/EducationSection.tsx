import {
  STORAGE_EVENT,
  STORAGE_KEYS,
  loadBudgets,
  loadEducationProgress,
  loadInvestments,
  loadTransactions,
  saveEducationProgress,
} from "@/lib/storage";
import type { EducationProgress, Lesson } from "@/types";
import {
  BarChart3,
  BookOpen,
  CheckCircle,
  Clock,
  CreditCard,
  DollarSign,
  Gift,
  Lightbulb,
  PiggyBank,
  Play,
  RotateCcw,
  Star,
  Target,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { useEffect, useState } from "react";
import { PrivacyValue } from "../ui/PrivacyValue";
import { LessonPlayer } from "./LessonPlayer";

const INITIAL_PROGRESS: EducationProgress = {
  completedLessons: [],
  unlockedAchievements: [],
  points: 0,
  streak: 0,
};

// Icon mapping helper
const getIcon = (name: string) => {
  const icons: Record<string, any> = {
    Target,
    BarChart3,
    TrendingUp,
    DollarSign,
    CheckCircle,
    PiggyBank,
    CreditCard,
    Star,
  };
  return icons[name] || Target;
};

export const EducationSection = () => {
  const [activeTab, setActiveTab] = useState<
    "lessons" | "achievements" | "tips"
  >("lessons");

  const [progress, setProgress] = useState<EducationProgress>(() => {
    const saved = loadEducationProgress();
    return saved || INITIAL_PROGRESS;
  });

  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [playerOpen, setPlayerOpen] = useState(false);

  useEffect(() => {
    const handleStorageChange = (e: any) => {
      if (e.detail?.key === STORAGE_KEYS.EDUCATION_PROGRESS) {
        setProgress(e.detail.data);
      }
    };
    window.addEventListener(STORAGE_EVENT as any, handleStorageChange);
    return () =>
      window.removeEventListener(STORAGE_EVENT as any, handleStorageChange);
  }, []);

  const handleLessonComplete = (id: string) => {
    const isAlreadyCompleted = progress.completedLessons.includes(id);

    if (!isAlreadyCompleted) {
      const newProgress = {
        ...progress,
        completedLessons: [...progress.completedLessons, id],
        points: progress.points + 50,
        streak: progress.streak + 1,
      };

      // Check for achievements
      if (
        newProgress.completedLessons.length >= 1 &&
        !newProgress.unlockedAchievements.includes("learner")
      ) {
        newProgress.unlockedAchievements.push("learner");
      }

      setProgress(newProgress);
      saveEducationProgress(newProgress);
    }
  };

  const openLesson = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setPlayerOpen(true);
  };

  const lessons: Lesson[] = [
    {
      id: "1",
      title: "Regra 50-30-20 Explicada",
      description: "A metodologia fundamental para controle financeiro.",
      content: `
# A Regra 50-30-20

A regra 50-30-20 é um método simplificado de orçamento que divide sua renda líquida mensal em três categorias principais:

*   **50% para Necessidades**: Gastos essenciais como aluguel, contas, mercado e transporte.
*   **30% para Desejos**: Coisas que você quer, mas não precisa para sobreviver (lazer, jantar fora, hobbies).
*   **20% para Investimentos/Dívidas**: Dinheiro para o seu eu do futuro (reserva de emergência, aposentadoria) ou para quitar dívidas.

## Por que funciona?
Ela remove a complexidade de categorizar cada centavo e foca no macro.

**Dica Prática**: Se seus gastos essenciais (50%) ultrapassarem o limite, tente reduzir nos desejos (30%) temporariamente.
      `,
      duration: "5 min",
      difficulty: "beginner",
      completed: progress.completedLessons.includes("1"),
      category: "Fundamentos",
      iconName: "Target",
      quiz: {
        id: "q1",
        question:
          "Qual porcentagem da renda deve ser destinada a Desejos (lazer, hobbies)?",
        options: ["50%", "20%", "30%", "10%"],
        correctOption: 2,
      },
    },
    {
      id: "2",
      title: "DRE Empresarial Básico",
      description: "Entenda o lucro real do seu negócio.",
      content: `
# Demonstrativo do Resultado do Exercício (DRE)

O DRE é como um raio-X da saúde financeira da sua empresa. Ele mostra se você teve lucro ou prejuízo em um período.

## Estrutura Básica

1.  **Receita Bruta**: Tudo que entrou.
2.  **(-) Impostos**: O que vai para o governo.
3.  **(=) Receita Líquida**: O que sobrou após impostos.
4.  **(-) Custos (CMV/CSV)**: Custo para produzir/entregar.
5.  **(=) Lucro Bruto**: A margem do produto.
6.  **(-) Despesas Operacionais**: Aluguel, salários, marketing.
7.  **(=) Lucro Líquido**: O que realmente sobra no bolso.

**Erro Comum**: Confundir faturamento (entrada) com lucro.
      `,
      duration: "8 min",
      difficulty: "intermediate",
      completed: progress.completedLessons.includes("2"),
      category: "Empresarial",
      iconName: "BarChart3",
      quiz: {
        id: "q2",
        question:
          "O que vem imediatamente após subtrair os impostos da Receita Bruta?",
        options: ["Lucro Líquido", "Receita Líquida", "Lucro Bruto", "Custos"],
        correctOption: 1,
      },
    },
    {
      id: "3",
      title: "Juros Compostos: A 8ª Maravilha",
      description: "Como o tempo multiplica seu dinheiro.",
      content: `
# Juros Compostos

Albert Einstein supostamente chamou os juros compostos de "a oitava maravilha do mundo". É o conceito de ganhar juros sobre juros.

## Exemplo Prático

Se você investir R$ 1.000,00 a 10% ao ano:
*   Ano 1: Ganha R$ 100. Total: R$ 1.100.
*   Ano 2: Ganha 10% de R$ 1.100 (R$ 110). Total: R$ 1.210.

A mágica acontece no longo prazo. Em 30 anos, a curva se torna exponencial.

**Lição**: Comece cedo, mesmo com pouco. O tempo é mais importante que a taxa.
      `,
      duration: "6 min",
      difficulty: "beginner",
      completed: progress.completedLessons.includes("3"),
      category: "Investimentos",
      iconName: "TrendingUp",
      quiz: {
        id: "q3",
        question: "No juro composto, os juros são calculados sobre:",
        options: [
          "Apenas o valor inicial",
          "O valor inicial + juros acumulados",
          "A inflação",
          "O salário mínimo",
        ],
        correctOption: 1,
      },
    },
    {
      id: "4",
      title: "Reserva de Emergência",
      description: "Sua blindagem contra imprevistos.",
      content: `
# Reserva de Emergência

É um montante guardado para cobrir despesas inesperadas (carro quebrou, desemprego, doença).

## Quanto guardar?
A recomendação geral é de **6 a 12 meses** do seu custo de vida mensal (não do salário!).

## Onde investir?
*   Liquidez Diária (pode sacar a qualquer hora).
*   Segurança (baixo risco).
*   Exemplos: Tesouro Selic, CDB com liquidez diária.

**Nunca** coloque sua reserva em ações ou criptomoedas.
      `,
      duration: "10 min",
      difficulty: "beginner",
      completed: progress.completedLessons.includes("4"),
      category: "Segurança",
      iconName: "PiggyBank",
      quiz: {
        id: "q4",
        question: "Onde NÃO se deve investir a reserva de emergência?",
        options: [
          "Tesouro Selic",
          "Poupança (embora renda pouco)",
          "Ações voláteis",
          "CDB Liquidez Diária",
        ],
        correctOption: 2,
      },
    },
    {
      id: "5",
      title: "Imposto de Renda (IRPF)",
      description: "O básico que todo brasileiro precisa saber.",
      content: `
# Imposto de Renda Descomplicado

O Leão não precisa ser seu inimigo.

## Quem precisa declarar?
Geralmente, quem recebeu rendimentos tributáveis acima de um certo limite (aprox. R$ 30k/ano) ou operou na Bolsa de Valores.

## Investimentos no IR
*   **Renda Fixa**: O imposto já é retido na fonte (você recebe líquido).
*   **Ações**: Isento se vender menos de R$ 20k/mês (exceto Day Trade).
*   **FIIs**: Dividendos são isentos, mas lucro na venda paga 20%.

**Dica**: Guarde todas as Notas de Corretagem.
      `,
      duration: "12 min",
      difficulty: "intermediate",
      completed: progress.completedLessons.includes("5"),
      category: "Tributação",
      iconName: "DollarSign",
      quiz: {
        id: "q5",
        question: "Qual destes pagamentos de proventos é ISENTO de IR?",
        options: [
          "Juros Sobre Capital Próprio (JCP)",
          "Dividendos de FIIs",
          "Aluguel de Imóveis",
          "Salário",
        ],
        correctOption: 1,
      },
    },
    {
      id: "6",
      title: "Tesouro Direto",
      description: "O investimento mais seguro do país.",
      content: `
# Tesouro Direto

Você empresta dinheiro para o governo e recebe com juros. É mais seguro que a poupança.

## Principais Títulos
1.  **Tesouro Selic**: Acompanha a taxa básica de juros. Ideal para Reserva de Emergência.
2.  **Tesouro IPCA+**: Paga a inflação + uma taxa fixa. Protege seu poder de compra.
3.  **Tesouro Prefixado**: Taxa fixa (ex: 12% a.a.). Bom quando os juros vão cair, mas tem risco se vender antes.

**Risco**: O risco é o país quebrar (calote soberano), o que é raríssimo.
      `,
      duration: "8 min",
      difficulty: "beginner",
      completed: progress.completedLessons.includes("6"),
      category: "Renda Fixa",
      iconName: "TrendingUp",
      quiz: {
        id: "q6",
        question: "Qual título é o mais indicado para a Reserva de Emergência?",
        options: [
          "Tesouro Prefixado",
          "Tesouro IPCA+ 2045",
          "Tesouro Selic",
          "Ações da Petrobras",
        ],
        correctOption: 2,
      },
    },
    {
      id: "7",
      title: "Hackeando seu Score",
      description: "Como aumentar sua pontuação de crédito.",
      content: `
# Credit Score Hacking

Seu score define se você consegue financiamentos e cartões Black.

## Estratégias Comprovadas
1.  **Cadastro Positivo**: Ative-o. Ele mostra que você paga em dia.
2.  **Pague antes do vencimento**: Pagar no dia é bom, pagar antes é ótimo para o algoritmo.
3.  **Use seu CPF**: Coloque CPF na nota de compras grandes.
4.  **Não peça crédito demais**: Solicitar 5 cartões na mesma semana derruba seu score.

**Mito**: Ter dívida antiga caducada (5 anos) limpa o nome, mas não aumenta o score imediatamente.
      `,
      duration: "7 min",
      difficulty: "advanced",
      completed: progress.completedLessons.includes("7"),
      category: "Segredos",
      iconName: "Star",
      quiz: {
        id: "q7",
        question: "O que pode PREJUDICAR seu score temporariamente?",
        options: [
          "Pagar a fatura adiantada",
          "Solicitar vários cartões de crédito em curto período",
          "Ativar o Cadastro Positivo",
          "Ter contas em débito automático",
        ],
        correctOption: 1,
      },
    },
  ];

  const calculateAchievements = () => {
    const transactions = loadTransactions();
    const budgets = loadBudgets();
    const investments = loadInvestments();

    // Calculate current savings from transactions + manual investments
    const investmentTotal = investments.reduce(
      (sum, inv) => sum + inv.amount * inv.averagePrice,
      0
    );
    const transactionSavings = transactions
      .filter(
        (t) =>
          t.category === "Investimentos" || t.classification === "investment"
      )
      .reduce(
        (sum, t) => sum + (t.type === "income" ? t.amount : -t.amount),
        0
      );

    const totalSavings = investmentTotal + transactionSavings;

    return [
      {
        id: "learner",
        title: "Estudante Dedicado",
        description: "Complete sua primeira lição interativa",
        iconName: "Star",
        unlocked: progress.unlockedAchievements.includes("learner"),
        progress: progress.completedLessons.length > 0 ? 1 : 0,
        maxProgress: 1,
      },
      {
        id: "budget-master",
        title: "Mestre do Orçamento",
        description: "Mantenha orçamento ativo",
        iconName: "Target",
        unlocked: progress.unlockedAchievements.includes("budget-master"),
        progress: budgets.length,
        maxProgress: 5,
      },
      {
        id: "saving-champion",
        title: "Campeão da Poupança",
        description: "Acumule R$ 1.000 em reserva",
        iconName: "PiggyBank",
        unlocked: progress.unlockedAchievements.includes("saving-champion"),
        progress: totalSavings,
        maxProgress: 1000,
      },
    ];
  };

  const achievements = calculateAchievements();

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-500/20 text-green-400";
      case "intermediate":
        return "bg-yellow-500/20 text-yellow-400";
      case "advanced":
        return "bg-red-500/20 text-red-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  return (
    <div className="space-y-10 animate-fade-in">
      <LessonPlayer
        isOpen={playerOpen}
        onClose={() => setPlayerOpen(false)}
        lesson={selectedLesson}
        onComplete={handleLessonComplete}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/10">
              <BookOpen className="text-indigo-400" size={24} />
            </div>
            <h2 className="text-3xl font-black tracking-tight text-white uppercase tracking-widest">
              Educação <span className="premium-gradient-text">Master</span>
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider ml-1">
            Domine o jogo do dinheiro com o método interativo.
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-1">
              XP Total
            </p>
            <div className="text-2xl font-black text-white tracking-tighter">
              {progress.points}{" "}
              <span className="text-xs text-indigo-400 uppercase tracking-widest ml-1">
                PTS
              </span>
            </div>
          </div>
          <div className="w-[1px] h-10 bg-white/5"></div>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-1">
              Progresso
            </p>
            <div className="text-2xl font-black text-white tracking-tighter">
              {progress.completedLessons.length}/{lessons.length}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex p-1.5 bg-white/5 rounded-2xl border border-white/5 gap-1.5">
        {[
          { id: "lessons", label: "Lições", icon: BookOpen },
          { id: "achievements", label: "Conquistas", icon: Trophy },
          { id: "tips", label: "Dicas PRO", icon: Lightbulb },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center gap-2 h-12 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === tab.id
                ? "bg-white text-black shadow-lg"
                : "text-slate-500 hover:text-white hover:bg-white/5"
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === "lessons" && (
        <div className="grid gap-6">
          {lessons.map((lesson) => {
            const Icon = getIcon(lesson.iconName);
            return (
              <div
                key={lesson.id}
                className="premium-card group cursor-pointer hover:border-indigo-500/30 transition-all duration-500"
                onClick={() => openLesson(lesson)}
              >
                <div className="p-6 md:p-8 flex items-start justify-between gap-6">
                  <div className="flex flex-col md:flex-row items-start gap-8 flex-1">
                    <div
                      className={`w-20 h-20 rounded-3xl flex items-center justify-center shrink-0 shadow-2xl transition-all duration-500 ${
                        lesson.completed
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:scale-110 group-hover:bg-indigo-500/20"
                      }`}
                    >
                      <Icon size={32} strokeWidth={2} />
                    </div>
                    <div className="space-y-4 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-xl font-black text-white tracking-tight group-hover:text-indigo-400 transition-colors">
                          {lesson.title}
                        </h3>
                        {lesson.completed ? (
                          <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[9px] font-black uppercase tracking-widest border border-emerald-500/20">
                            Concluída
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-[9px] font-black uppercase tracking-widest border border-indigo-500/20">
                            {lesson.category}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-2xl">
                        {lesson.description}
                      </p>
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                          <Clock size={12} className="text-indigo-500" />
                          {lesson.duration}
                        </div>
                        <div
                          className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${getDifficultyColor(
                            lesson.difficulty
                          )}`}
                        >
                          {lesson.difficulty === "beginner"
                            ? "Iniciante"
                            : lesson.difficulty === "intermediate"
                            ? "Intermediário"
                            : "Avançado"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    className={`shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                      lesson.completed
                        ? "bg-white/5 text-slate-500 hover:text-white"
                        : "bg-white text-black hover:bg-white/90 shadow-xl shadow-indigo-500/20"
                    }`}
                  >
                    {lesson.completed ? (
                      <RotateCcw size={24} strokeWidth={2.5} />
                    ) : (
                      <Play size={24} className="ml-1" fill="currentColor" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "achievements" && (
        <div className="grid md:grid-cols-2 gap-6">
          {achievements.map((achievement) => {
            const Icon = getIcon(achievement.iconName);
            return (
              <div
                key={achievement.id}
                className={`premium-card relative overflow-hidden transition-all duration-500 ${
                  achievement.unlocked
                    ? "border-amber-500/30 bg-amber-500/[0.02]"
                    : "border-white/5"
                }`}
              >
                {achievement.unlocked && (
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-[60px] rounded-full -mr-10 -mt-10"></div>
                )}
                <div className="p-8 flex items-start gap-6">
                  <div
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 border transition-all duration-500 ${
                      achievement.unlocked
                        ? "bg-amber-500/20 border-amber-500/30 text-amber-400"
                        : "bg-white/5 border-white/10 text-slate-600"
                    }`}
                  >
                    <Icon size={28} />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-black text-white tracking-tight">
                          {achievement.title}
                        </h3>
                        {achievement.unlocked && (
                          <div className="flex items-center gap-1.5 text-amber-500">
                            <Star size={12} fill="currentColor" />
                            <span className="text-[9px] font-black uppercase tracking-widest">
                              Ultimate
                            </span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 font-medium">
                        {achievement.description}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-600">
                        <span>Status de Desbloqueio</span>
                        <span className="text-white">
                          {achievement.progress} / {achievement.maxProgress}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                        <div
                          className={`h-full transition-all duration-1000 ${
                            achievement.unlocked
                              ? "bg-amber-500"
                              : "bg-indigo-500"
                          }`}
                          style={{
                            width: `${
                              (achievement.progress / achievement.maxProgress) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "tips" && (
        <div className="space-y-8">
          <div className="premium-card bg-gradient-to-br from-indigo-500/10 via-transparent to-emerald-500/10 border-white/10">
            <div className="p-10 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/20">
                  <Gift className="text-indigo-400" size={24} />
                </div>
                <h3 className="text-xl font-black text-white tracking-tight uppercase">
                  Dica <span className="text-indigo-400">Master</span> do Dia
                </h3>
              </div>
              <div className="p-8 rounded-3xl bg-black/40 border border-white/5 backdrop-blur-sm">
                <p className="text-lg text-slate-300 font-medium italic leading-relaxed">
                  "Regra dos 24 Horas: Para compras impulsivas acima de{" "}
                  <PrivacyValue value={100} />, espere 24 horas antes de
                  decidir. 70% das vezes você perceberá que não precisa
                  realmente do item."
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center py-20 bg-white/[0.02] rounded-[40px] border border-dashed border-white/10">
            <Lightbulb
              className="text-slate-700 mb-6"
              size={48}
              strokeWidth={1}
            />
            <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-xs">
              Mantenha o foco. Novas dicas em breve.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
