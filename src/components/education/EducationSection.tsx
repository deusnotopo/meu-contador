import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Award,
  BarChart3,
  BookOpen,
  Brain,
  CheckCircle,
  Clock,
  CreditCard,
  DollarSign,
  Gift,
  Lightbulb,
  PiggyBank,
  Play,
  Star,
  Target,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { useState } from "react";

import type { LucideIcon } from "lucide-react";

interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  completed: boolean;
  category: string;
  icon: LucideIcon;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
}

export const EducationSection = () => {
  const [activeTab, setActiveTab] = useState<
    "lessons" | "achievements" | "tips"
  >("lessons");

  const lessons: Lesson[] = [
    {
      id: "1",
      title: "Regra 50-30-20 Explicada",
      description:
        "Aprenda a metodologia fundamental para controle financeiro pessoal",
      duration: "8 min",
      difficulty: "beginner",
      completed: true,
      category: "Fundamentos",
      icon: Target,
    },
    {
      id: "2",
      title: "DRE Empresarial Completo",
      description:
        "Demonstração prática de relatório financeiro para seu negócio",
      duration: "12 min",
      difficulty: "intermediate",
      completed: false,
      category: "Empresarial",
      icon: BarChart3,
    },
    {
      id: "3",
      title: "Investimentos para Iniciantes",
      description: "Como começar a investir com pouco dinheiro",
      duration: "15 min",
      difficulty: "beginner",
      completed: false,
      category: "Investimentos",
      icon: TrendingUp,
    },
    {
      id: "4",
      title: "Análise de Gastos Ocultos",
      description: "Identifique e elimine vazamentos financeiros",
      duration: "10 min",
      difficulty: "intermediate",
      completed: false,
      category: "Análise",
      icon: DollarSign,
    },
  ];

  const achievements: Achievement[] = [
    {
      id: "first-transaction",
      title: "Primeira Transação",
      description: "Adicione sua primeira transação",
      icon: CheckCircle,
      unlocked: true,
      progress: 1,
      maxProgress: 1,
    },
    {
      id: "budget-master",
      title: "Mestre do Orçamento",
      description: "Mantenha orçamento por 30 dias consecutivos",
      icon: Target,
      unlocked: false,
      progress: 12,
      maxProgress: 30,
    },
    {
      id: "saving-champion",
      title: "Campeão da Poupança",
      description: "Acumule R$ 1.000 em reserva de emergência",
      icon: PiggyBank,
      unlocked: false,
      progress: 650,
      maxProgress: 1000,
    },
    {
      id: "debt-free",
      title: "Livre de Dívidas",
      description: "Quite todas as dívidas rotativas",
      icon: CreditCard,
      unlocked: false,
      progress: 0,
      maxProgress: 1,
    },
  ];

  const dailyTips = [
    {
      title: "Dica do Dia: Controle de Impulsos",
      content:
        "Antes de comprar algo não planejado, pergunte-se: 'Preciso disso hoje ou posso esperar 30 dias?'",
      category: "Hábitos",
      icon: Brain,
    },
    {
      title: "Estratégia: Método do Envelope",
      content:
        "Separe dinheiro em envelopes físicos para cada categoria de gastos. Quando acabar, pare de gastar.",
      category: "Métodos",
      icon: DollarSign,
    },
    {
      title: "Investimento: Comece Pequeno",
      content:
        "R$ 50 por mês em CDB rende cerca de R$ 600 em 1 ano. Pequenos hábitos geram grandes resultados.",
      category: "Investimentos",
      icon: TrendingUp,
    },
  ];

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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black flex items-center gap-3">
            <BookOpen className="text-indigo-400" size={32} />
            Educação Financeira
          </h2>
          <p className="text-slate-400 mt-2">
            Aprenda com especialistas e conquiste suas metas financeiras
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-2xl font-black text-indigo-400">12</div>
            <div className="text-xs text-slate-500 uppercase tracking-widest">
              Lições Completadas
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black text-yellow-400">8</div>
            <div className="text-xs text-slate-500 uppercase tracking-widest">
              Conquistas
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 bg-slate-800/50 p-1 rounded-2xl border border-slate-700/50">
        <Button
          variant={activeTab === "lessons" ? "default" : "ghost"}
          onClick={() => setActiveTab("lessons")}
          className="flex-1"
        >
          <BookOpen size={18} className="mr-2" />
          Lições
        </Button>
        <Button
          variant={activeTab === "achievements" ? "default" : "ghost"}
          onClick={() => setActiveTab("achievements")}
          className="flex-1"
        >
          <Trophy size={18} className="mr-2" />
          Conquistas
        </Button>
        <Button
          variant={activeTab === "tips" ? "default" : "ghost"}
          onClick={() => setActiveTab("tips")}
          className="flex-1"
        >
          <Lightbulb size={18} className="mr-2" />
          Dicas
        </Button>
      </div>

      {/* Content */}
      {activeTab === "lessons" && (
        <div className="grid gap-6">
          {lessons.map((lesson) => (
            <Card
              key={lesson.id}
              className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/70 transition-all"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-indigo-500/20 rounded-xl">
                      <lesson.icon className="text-indigo-400" size={24} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold">{lesson.title}</h3>
                        {lesson.completed && (
                          <Badge className="bg-green-500/20 text-green-400">
                            <CheckCircle size={12} className="mr-1" />
                            Concluída
                          </Badge>
                        )}
                      </div>
                      <p className="text-slate-400 mb-3">
                        {lesson.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {lesson.duration}
                        </span>
                        <Badge
                          className={getDifficultyColor(lesson.difficulty)}
                        >
                          {lesson.difficulty === "beginner"
                            ? "Iniciante"
                            : lesson.difficulty === "intermediate"
                            ? "Intermediário"
                            : "Avançado"}
                        </Badge>
                        <span>{lesson.category}</span>
                      </div>
                    </div>
                  </div>
                  <Button className="bg-indigo-600 hover:bg-indigo-500">
                    <Play size={16} className="mr-2" />
                    {lesson.completed ? "Revisar" : "Assistir"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeTab === "achievements" && (
        <div className="grid md:grid-cols-2 gap-6">
          {achievements.map((achievement) => (
            <Card
              key={achievement.id}
              className={`bg-slate-800/50 border-slate-700/50 ${
                achievement.unlocked ? "ring-2 ring-yellow-500/50" : ""
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div
                    className={`p-3 rounded-xl ${
                      achievement.unlocked
                        ? "bg-yellow-500/20"
                        : "bg-slate-700/50"
                    }`}
                  >
                    <achievement.icon
                      className={
                        achievement.unlocked
                          ? "text-yellow-400"
                          : "text-slate-500"
                      }
                      size={24}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold">{achievement.title}</h3>
                      {achievement.unlocked && (
                        <Badge className="bg-yellow-500/20 text-yellow-400">
                          <Star size={12} className="mr-1" />
                          Desbloqueada
                        </Badge>
                      )}
                    </div>
                    <p className="text-slate-400 mb-3">
                      {achievement.description}
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Progresso</span>
                        <span className="text-slate-400">
                          {achievement.progress}/{achievement.maxProgress}
                        </span>
                      </div>
                      <Progress
                        value={
                          (achievement.progress / achievement.maxProgress) * 100
                        }
                        className="h-2"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeTab === "tips" && (
        <div className="space-y-6">
          <Card className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-indigo-500/30">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-indigo-500/20 rounded-lg">
                  <Gift className="text-indigo-400" size={20} />
                </div>
                <h3 className="text-lg font-bold">Dica Premium do Dia</h3>
              </div>
              <p className="text-slate-300">
                🎯 <strong>Regra dos 24 Horas:</strong> Para compras impulsivas
                acima de R$ 100, espere 24 horas antes de decidir. 70% das vezes
                você perceberá que não precisa realmente do item.
              </p>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            {dailyTips.map((tip, index) => (
              <Card key={index} className="bg-slate-800/50 border-slate-700/50">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-slate-700/50 rounded-lg">
                      <tip.icon className="text-slate-400" size={20} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold mb-2">{tip.title}</h4>
                      <p className="text-slate-400 mb-2">{tip.content}</p>
                      <Badge className="bg-slate-700/50 text-slate-400">
                        {tip.category}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Progress Summary */}
      <Card className="bg-gradient-to-r from-slate-800/50 to-slate-900/50 border-slate-700/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Seu Progresso de Aprendizado</h3>
            <Badge className="bg-indigo-500/20 text-indigo-400">
              <Award size={14} className="mr-1" />
              Nível 3
            </Badge>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-black text-green-400 mb-1">12</div>
              <div className="text-xs text-slate-500 uppercase tracking-widest">
                Lições Completadas
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-yellow-400 mb-1">8</div>
              <div className="text-xs text-slate-500 uppercase tracking-widest">
                Conquistas
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-blue-400 mb-1">156</div>
              <div className="text-xs text-slate-500 uppercase tracking-widest">
                Pontos
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-purple-400 mb-1">23</div>
              <div className="text-xs text-slate-500 uppercase tracking-widest">
                Dias Seguidos
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-400">Próximo nível</span>
              <span className="text-slate-400">156/200 pontos</span>
            </div>
            <Progress value={78} className="h-3" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
