import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { formatCurrency } from "@/lib/formatters";
import { applyOnboardingConfig, saveOnboarding } from "@/lib/onboarding";
import { showSuccess, showError } from "@/lib/toast";
import { api } from "@/lib/api";
import type {
  OnboardingBudget,
  OnboardingData,
  OnboardingGoal,
  OnboardingReminder,
  UserProfile,
  OnboardingInvestment,
} from "@/types";
import {
  budgetTemplates,
  commonBillReminders,
  goalPresets,
} from "@/types/onboarding";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Brain,
  Briefcase,
  Building2,
  Check,
  Crown,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  Loader2,
  X,
  CreditCard,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface Props {
  onComplete: () => void;
  onSkip?: () => void;
}

// ----------------------------------------------------------------------------
// Types & Constants
// ----------------------------------------------------------------------------

const STEPS = [
  { id: "welcome", title: "Boas-vindas", act: 0 },
  { id: "identity", title: "Identidade", act: 1 },
  { id: "family", title: "Perfil e Prioridade", act: 1 },
  { id: "business", title: "O Seu Negócio", act: 1 },
  { id: "income", title: "Sua Renda", act: 1 },
  { id: "balance", title: "Patrimônio", act: 1 },
  { id: "strategy_503020", title: "A Regra de Ouro", act: 2 },
  { id: "projection", title: "Seu Futuro", act: 2 },
  { id: "goals", title: "Suas Metas", act: 2 },
  { id: "automation", title: "Piloto Automático", act: 3 },
  { id: "summary", title: "Diagnóstico Final", act: 3 },
];

// ----------------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------------

export const OnboardingWizard = ({ onComplete, onSkip }: Props) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // -- State: Profile --
  const [profile, setProfile] = useState<UserProfile>({
    name: "",
    monthlyIncome: 5000,
    financialGoal: "save",
    riskProfile: "moderate",
    employmentType: "clt",
    hasEmergencyFund: false,
    hasDebts: false,
    initialBalance: 0,
    age: 30,
    dependents: 0,
    businessName: "",
    businessSector: "technology",
    businessCnpj: "",
  });

  // -- State: Finance Data --
  const [budgets] = useState<OnboardingBudget[]>(budgetTemplates.moderate || []);
  const [goals, setGoals] = useState<OnboardingGoal[]>(goalPresets);
  const [reminders, setReminders] = useState<OnboardingReminder[]>(commonBillReminders);
  const [investments] = useState<OnboardingInvestment[]>([]);
  const [preferences] = useState({
    showScore: true,
    showPredictions: true,
    weeklyReport: true,
    alerts: true,
  });

  const progress = ((currentStep + 1) / STEPS.length) * 100;
  const step = STEPS[currentStep];

  // -- Helpers --
  const handleProfileChange = (field: keyof UserProfile, value: unknown) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const paginate = (newDirection: number) => {
    if (currentStep === 0 && newDirection === -1) return;
    if (currentStep === STEPS.length - 1 && newDirection === 1) {
      finalize();
      return;
    }
    
    let nextStepIndex = currentStep + newDirection;
    // Pular a etapa de empresa se for CLT
    if (STEPS[nextStepIndex]?.id === "business" && profile.employmentType === "clt") {
      nextStepIndex += newDirection;
    }

    setDirection(newDirection);
    setCurrentStep(nextStepIndex);
  };

  const finalize = async () => {
    setIsSaving(true);
    const data: OnboardingData = {
      profile,
      budgets,
      goals,
      reminders,
      preferences,
      investments,
      completed: true,
      completedAt: new Date().toISOString(),
    };
    try {
      await api.put('/users/onboarding', data);
      saveOnboarding(data);
      applyOnboardingConfig(data);
      showSuccess(`Pronto, ${profile.name}! Sua jornada começou.`);
      onComplete();
    } catch (err) {
      showError("Erro ao sincronizar. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  return (
    <div className="fixed inset-0 z-[100] bg-[#030712] flex flex-col font-sans overflow-hidden text-white">
      {/* Glow Effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-indigo-600/30 rounded-full blur-[120px]" 
        />
        <motion.div 
          animate={{ scale: [1, 1.3, 1], opacity: [0.05, 0.15, 0.05] }}
          transition={{ duration: 10, repeat: Infinity, delay: 1 }}
          className="absolute -bottom-[10%] -right-[10%] w-[60%] h-[60%] bg-purple-600/20 rounded-full blur-[100px]" 
        />
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 py-4 flex items-center justify-between border-b border-white/5 bg-black/20 backdrop-blur-md">
          <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Crown size={16} className="fill-white" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em] leading-none mb-1">
              Ato {step?.act ?? 0} de 3
            </p>
            <h1 className="text-sm font-bold tracking-tight">{step?.title ?? ""}</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1 rounded-full transition-all duration-500 ${
              i === currentStep ? "w-6 bg-indigo-500" : i < currentStep ? "w-1.5 bg-emerald-500" : "w-1.5 bg-white/10"
            }`} />
          ))}
        </div>

        {onSkip && (
          <button onClick={onSkip} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <X size={18} className="text-white/40" />
          </button>
        )}
      </header>

      {/* Progress Bar */}
      <div className="relative z-10 h-[2px] bg-white/5 overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" 
        />
      </div>

      {/* Content */}
      <main className="relative z-10 flex-1 overflow-y-auto px-6 py-8 flex flex-col items-center hide-scrollbar">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            initial={{ opacity: 0, x: direction > 0 ? 50 : -50, filter: "blur(10px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, x: direction > 0 ? -50 : 50, filter: "blur(10px)" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-full max-w-lg mx-auto"
          >
            {renderStep(currentStep, profile, handleProfileChange, goals, setGoals, reminders, setReminders)}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer Navigation */}
      <footer className="relative z-10 p-6 pt-2 bg-black/40 backdrop-blur-xl border-t border-white/5 flex gap-4 items-center" 
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.5rem)' }}>
        <Button 
          variant="ghost" 
          onClick={() => paginate(-1)}
          disabled={currentStep === 0}
          className="h-14 flex-1 bg-white/5 hover:bg-white/10 border-white/5 text-white/60 rounded-2xl transition-all"
        >
          <ArrowLeft size={18} className="mr-2" />
          Voltar
        </Button>
        <Button 
          onClick={() => paginate(1)}
          disabled={isSaving}
          className="h-14 flex-[2] bg-white hover:bg-indigo-50 text-indigo-950 font-bold text-lg rounded-2xl shadow-xl shadow-white/5 transition-all active:scale-95"
        >
          {isSaving ? (
            <Loader2 className="animate-spin" />
          ) : currentStep === STEPS.length - 1 ? (
            "Começar Agora"
          ) : (
            <>
              Confirmar
              <ArrowRight size={20} className="ml-2" />
            </>
          )}
        </Button>
      </footer>
    </div>
  );
};

// ----------------------------------------------------------------------------
// Step Renderer
// ----------------------------------------------------------------------------

function renderStep(
  index: number,
  profile: UserProfile,
  onChange: (f: keyof UserProfile, v: any) => void,
  goals: OnboardingGoal[],
  setGoals: any,
  reminders: OnboardingReminder[],
  setReminders: any
) {
  const step = STEPS[index];
  const stepId = step?.id;

  switch (stepId) {
    case "welcome":
      return (
        <div className="text-center space-y-8 pt-10">
          <motion.div 
            initial={{ scale: 0.8, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            className="w-24 h-24 mx-auto bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center p-5 shadow-2xl shadow-indigo-500/40"
          >
            <Sparkles size={48} className="text-white fill-white/20" />
          </motion.div>
          <div className="space-y-4">
            <h2 className="text-4xl font-black tracking-tight leading-tight">
              Olá! Vamos blindar sua <span className="text-indigo-400">Vida Financeira.</span>
            </h2>
            <p className="text-lg text-white/50 font-medium">
              Em 2 minutos, transformaremos seus dados em uma estratégia de elite.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-4">
            <FeatureCard icon={Brain} label="Inteligência BR" />
            <FeatureCard icon={Shield} label="Privacidade Total" />
          </div>
        </div>
      );

    case "identity":
      return (
        <div className="space-y-8 pt-6">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold">Quem é você?</h2>
            <p className="text-white/50">Precisamos saber como te chamar no dashboard.</p>
          </div>
          <div className="space-y-4">
            <Label className="text-indigo-400 font-bold uppercase tracking-widest text-[10px]">Seu Nome ou Apelido</Label>
            <Input 
              value={profile.name} 
              onChange={e => onChange("name", e.target.value)}
              placeholder="Ex: João Silva" 
              className="h-16 bg-white/5 border-white/10 rounded-2xl text-xl font-bold focus:ring-2 ring-indigo-500/50 transition-all"
            />
          </div>
          <div className="space-y-4">
            <Label className="text-indigo-400 font-bold uppercase tracking-widest text-[10px]">Modelo de Trabalho</Label>
            <div className="grid grid-cols-2 gap-4">
              <SelectCard 
                active={profile.employmentType === 'clt'} 
                onClick={() => onChange("employmentType", "clt")}
                icon={Briefcase} 
                label="CLT / Funcional" 
                sub="Foco em estabilidade e FGTS"
              />
              <SelectCard 
                active={profile.employmentType === 'pj'} 
                onClick={() => onChange("employmentType", "pj")}
                icon={Building2} 
                label="PJ / Empresário" 
                sub="Foco em lucro e blindagem"
              />
            </div>
          </div>
        </div>
      );

    case "family":
      return (
        <div className="space-y-8 pt-6">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold">Seu Perfil Pessoal</h2>
            <p className="text-white/50">Esses dados ajustam a inteligência da sua Reserva de Emergência.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <Label className="text-indigo-400 font-bold uppercase tracking-widest text-[10px]">Sua Idade</Label>
              <Input 
                type="number"
                value={profile.age || ""} 
                onChange={e => onChange("age", parseInt(e.target.value) || 0)}
                className="h-16 bg-white/5 border-white/10 rounded-2xl text-2xl font-black text-center"
              />
            </div>
            <div className="space-y-4">
              <Label className="text-indigo-400 font-bold uppercase tracking-widest text-[10px]">Filhos/Dependentes</Label>
              <Input 
                type="number"
                value={profile.dependents?.toString() || ""} 
                onChange={e => onChange("dependents", parseInt(e.target.value) || 0)}
                className="h-16 bg-white/5 border-white/10 rounded-2xl text-2xl font-black text-center"
              />
            </div>
          </div>
          
          <div className="space-y-4 pt-4">
            <Label className="text-indigo-400 font-bold uppercase tracking-widest text-[10px]">Sua Maior Prioridade</Label>
            <div className="grid grid-cols-1 gap-2">
              {[
                { id: "save", label: "Construir Reserva Intocável", icon: Shield, color: "text-emerald-400" },
                { id: "invest", label: "Multiplicar Dinheiro (Investir)", icon: TrendingUp, color: "text-indigo-400" },
                { id: "debt-free", label: "Quitar Dívidas e Limpar Nome", icon: Target, color: "text-rose-400" }
              ].map(goal => (
                <div 
                  key={goal.id}
                  onClick={() => onChange("financialGoal", goal.id)}
                  className={`p-4 rounded-xl border flex items-center gap-4 transition-all cursor-pointer ${
                    profile.financialGoal === goal.id ? "bg-white/10 border-white/30" : "bg-white/5 border-white/5"
                  }`}
                >
                  <goal.icon size={20} className={profile.financialGoal === goal.id ? goal.color : "text-white/30"} />
                  <span className="font-bold text-sm tracking-tight">{goal.label}</span>
                  {profile.financialGoal === goal.id && <Check size={16} className={`ml-auto ${goal.color}`} />}
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    case "business":
      return (
        <div className="space-y-8 pt-6">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold">Seu Negócio</h2>
            <p className="text-white/50">Por você ser PJ, personalizaremos a separação de contas.</p>
          </div>
          
          <div className="space-y-4">
            <Label className="text-indigo-400 font-bold uppercase tracking-widest text-[10px]">Nome da Empresa / Fantasia</Label>
            <Input 
              value={profile.businessName || ""} 
              onChange={e => onChange("businessName", e.target.value)}
              placeholder="Ex: Minha Agência Ltda" 
              className="h-16 bg-white/5 border-white/10 rounded-2xl text-xl font-bold"
            />
          </div>
          
          <div className="space-y-4">
            <Label className="text-indigo-400 font-bold uppercase tracking-widest text-[10px]">CNPJ (Opcional - Apenas números)</Label>
            <Input 
              value={profile.businessCnpj || ""} 
              onChange={e => onChange("businessCnpj", e.target.value.replace(/\D/g, ''))}
              placeholder="00.000.000/0001-00" 
              className="h-16 bg-white/5 border-white/10 rounded-2xl text-xl font-bold tracking-widest font-mono"
            />
          </div>
        </div>
      );

    case "income":
      return (
        <div className="space-y-8 pt-6 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold">Qual sua renda mensal?</h2>
            <p className="text-white/50">Isso define sua capacidade de aporte e reserva.</p>
          </div>
          <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 space-y-6">
            <div className="text-5xl font-black tabular-nums text-indigo-400 tracking-tighter">
              {formatCurrency(profile.monthlyIncome)}
            </div>
            <Slider 
              value={[profile.monthlyIncome]} 
              onValueChange={([v]) => onChange("monthlyIncome", v)}
              min={1000} max={50000} step={500} 
              className="py-4"
            />
            <div className="flex justify-between text-[10px] font-black text-white/20 uppercase tracking-widest">
              <span>R$ 1k</span>
              <span>R$ 50k+</span>
            </div>
          </div>
          <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-xs text-indigo-300 flex gap-3 text-left">
            <Zap size={18} className="shrink-0" />
            <p>Usaremos este valor para calcular sua **estratégia 50/30/20** de forma automática no próximo passo.</p>
          </div>
        </div>
      );

    case "balance":
      return (
        <div className="space-y-8 pt-6">
          <div className="space-y-2 text-center">
            <h2 className="text-3xl font-bold">Seu Ponto de Partida</h2>
            <p className="text-white/50">Quanto você tem disponível hoje (contas + investimentos)?</p>
          </div>
          <div className="space-y-6">
            <div className="relative group">
              <div className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-bold text-white/30">R$</div>
              <Input 
                type="number"
                value={profile.initialBalance || ""}
                onChange={e => onChange("initialBalance", parseFloat(e.target.value) || 0)}
                className="h-24 pl-16 bg-white/5 border-white/10 rounded-[2.5rem] text-4xl font-black focus:bg-white/10 transition-all border-dashed"
                placeholder="0,00"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className={`p-6 rounded-3xl border transition-all cursor-pointer ${profile.hasEmergencyFund ? "bg-emerald-500/20 border-emerald-500/50" : "bg-white/5 border-white/10"}`}
                   onClick={() => onChange("hasEmergencyFund", !profile.hasEmergencyFund)}>
                <Shield className={profile.hasEmergencyFund ? "text-emerald-400" : "text-white/20"} />
                <p className="mt-3 font-bold text-sm">Tenho Reserva de Emergência</p>
              </div>
              <div className={`p-6 rounded-3xl border transition-all cursor-pointer ${profile.hasDebts ? "bg-rose-500/20 border-rose-500/50" : "bg-white/5 border-white/10"}`}
                   onClick={() => onChange("hasDebts", !profile.hasDebts)}>
                <CreditCard className={profile.hasDebts ? "text-rose-400" : "text-white/20"} />
                <p className="mt-3 font-bold text-sm">Possuo Dívidas Atuais</p>
              </div>
            </div>
          </div>
        </div>
      );

    case "strategy_503020": {
      // Dinâmica de Regra customizada baseada na renda, perfil e metas!
      let pE = 0.5, pL = 0.3, pF = 0.2; // Moderado Clássico
      let ruleName = "50/30/20";
      
      if (profile.monthlyIncome < 3000 || profile.financialGoal === "debt-free") {
        pE = 0.6; pL = 0.3; pF = 0.1;
        ruleName = "60/30/10";
      } else if (profile.riskProfile === "aggressive") {
        pE = 0.4; pL = 0.2; pF = 0.4;
        ruleName = "40/20/40";
      } else if (profile.riskProfile === "conservative") {
        pE = 0.5; pL = 0.2; pF = 0.3;
        ruleName = "50/20/30";
      }

      const data = [
        { name: 'Essencial', value: pE * 100, color: '#6366f1' },
        { name: 'Estilo de Vida', value: pL * 100, color: '#a855f7' },
        { name: 'Futuro', value: pF * 100, color: '#10b981' },
      ];
      
      return (
        <div className="space-y-6 pt-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold">A Regra de Ouro</h2>
            <p className="text-white/50">Calculamos sua alocação ideal com base no seu diagnóstico:</p>
          </div>
          
          <div className="flex gap-2 p-1 bg-white/5 rounded-2xl mx-auto w-fit mb-4 border border-white/5">
            {["conservative", "moderate", "aggressive"].map(mode => (
              <button 
                key={mode}
                onClick={() => onChange("riskProfile", mode as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  profile.riskProfile === mode ? "bg-indigo-500 text-white shadow-lg" : "text-white/40 hover:text-white"
                }`}
              >
                {mode === "conservative" ? "Economizar" : mode === "moderate" ? "Equilibrar" : "Acelerar"}
              </button>
            ))}
          </div>

          <div className="h-[240px] w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%" cy="50%"
                  innerRadius={65} outerRadius={95}
                  paddingAngle={8}
                  dataKey="value"
                  animationDuration={1500}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: number) => [`${value.toFixed(0)}%`, 'Alocação']}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] uppercase font-bold text-white/40 tracking-widest">Alocação</span>
              <span className="text-3xl font-black">{ruleName}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 text-left">
            <StrategyRow color="bg-indigo-500" label={`Necessidades (${pE*100}%)`} sub="Moradia, alimentação, saúde" val={formatCurrency(profile.monthlyIncome * pE)} />
            <StrategyRow color="bg-purple-500" label={`Lifestyle (${pL*100}%)`} sub="Lazer, compras, assinaturas" val={formatCurrency(profile.monthlyIncome * pL)} />
            <StrategyRow color="bg-emerald-500" label={`Futuro (${pF*100}%)`} sub="Investimento, dívidas, reserva" val={formatCurrency(profile.monthlyIncome * pF)} />
          </div>
        </div>
      );
    }

    case "projection": {
      const monthlyInvest = profile.monthlyIncome * 0.2;
      const rate = 0.0087; // aprox 10.5% a.a. (realista CDI BR)
      const projection10y = monthlyInvest * ((Math.pow(1 + rate, 120) - 1) / rate);
      const projection20y = monthlyInvest * ((Math.pow(1 + rate, 240) - 1) / rate);

      return (
        <div className="space-y-8 pt-6">
          <div className="space-y-2 text-center">
            <h2 className="text-3xl font-bold">O Efeito Juros Compostos</h2>
            <p className="text-white/50">Investindo seus 20% mensais ({formatCurrency(monthlyInvest)}), veja o que o tempo faz:</p>
          </div>
          
          <div className="space-y-4">
            <ProjectionCard 
              years={10} 
              total={projection10y} 
              description="Em 10 anos, você terá patrimônio para grandes decisões."
              color="border-indigo-500/30 bg-indigo-500/5"
            />
            <ProjectionCard 
              years={20} 
              total={projection20y} 
              description="Em 20 anos, seus juros ganham mais que o seu trabalho."
              color="border-emerald-500/30 bg-emerald-500/5 text-emerald-400"
              highlight
            />
          </div>

          <p className="text-[10px] text-center text-white/30 italic">
            *Cálculo baseado na Selic atual projetada e aporte constante. Resultados podem variar.
          </p>
        </div>
      );
    }

    case "goals":
      return (
        <div className="space-y-8 pt-6">
          <div className="space-y-2 text-center">
            <h2 className="text-3xl font-bold">O que vamos conquistar?</h2>
            <p className="text-white/50">Defina suas prioridades de vida.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {goals.map((g, i) => (
              <div 
                key={i}
                onClick={() => {
                  const newGoals = [...goals];
                  if (newGoals[i]) {
                    newGoals[i].enabled = !newGoals[i].enabled;
                    setGoals(newGoals);
                  }
                }}
                className={`p-5 rounded-3xl border transition-all cursor-pointer relative overflow-hidden ${
                  g.enabled ? "bg-indigo-600/20 border-indigo-500" : "bg-white/5 border-white/10"
                }`}
              >
                <span className="text-2xl block mb-2">{g.icon}</span>
                <p className="font-bold text-sm leading-tight">{g.name}</p>
                {g.enabled && <Check size={14} className="absolute top-4 right-4 text-indigo-400" />}
              </div>
            ))}
          </div>
        </div>
      );

    case "automation":
      return (
        <div className="space-y-8 pt-6">
          <div className="space-y-2 text-center">
            <h2 className="text-3xl font-bold">Piloto Automático</h2>
            <p className="text-white/50">Quais contas sua IA deve te lembrar de pagar?</p>
          </div>
          <div className="space-y-3 max-h-[350px] overflow-y-auto px-1 pr-2 hide-scrollbar">
            {reminders.map((r, i) => (
              <div 
                key={i}
                onClick={() => {
                  const newR = [...reminders];
                  if (newR[i]) {
                    newR[i].enabled = !newR[i].enabled;
                    setReminders(newR);
                  }
                }}
                className={`p-4 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
                  r.enabled ? "bg-white/10 border-white/20" : "bg-white/5 border-white/5"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${r.enabled ? "bg-indigo-500" : "bg-white/5"}`}>
                    <Bell size={14} className={r.enabled ? "text-white" : "text-white/20"} />
                  </div>
                  <div>
                    <p className="font-bold text-sm">{r.name}</p>
                    <p className="text-[10px] text-white/30 uppercase font-black tracking-widest">Dia {r.dueDay}</p>
                  </div>
                </div>
                <Switch checked={r.enabled} onCheckedChange={() => {}} />
              </div>
            ))}
          </div>
        </div>
      );

    case "summary":
      return (
        <div className="space-y-8 pt-6">
          <div className="text-center space-y-4">
            <motion.div 
              animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="w-20 h-20 mx-auto border-2 border-indigo-500/30 border-t-indigo-500 rounded-full flex items-center justify-center"
            >
              <Target size={32} className="text-indigo-400" />
            </motion.div>
            <h2 className="text-3xl font-black">Diagnóstico Pronto!</h2>
            <p className="text-white/50 text-sm px-6">
              Analisamos seus dados de **{profile.employmentType?.toUpperCase()}** e criamos uma estratégia completa de alocação e metas.
            </p>
          </div>
          
          <div className="bg-white/5 rounded-3xl p-6 border border-white/10 space-y-4">
            <SummaryItem label="Regra" value="50/30/20" />
            <SummaryItem label="Renda Mensal" value={formatCurrency(profile.monthlyIncome)} />
            <SummaryItem label="Capacidade Mensal" value={formatCurrency(profile.monthlyIncome * 0.2)} highlight />
            <SummaryItem label="Fundo de Emergência" value={profile.employmentType === 'pj' ? "12 Meses (PJ)" : "6 Meses (CLT)"} />
          </div>
        </div>
      );

    default:
      return null;
  }
}

// ----------------------------------------------------------------------------
// Sub-components
// ----------------------------------------------------------------------------

const FeatureCard = ({ icon: Icon, label }: { icon: any, label: string }) => (
  <div className="flex items-center gap-2 p-3 bg-white/5 border border-white/5 rounded-2xl">
    <Icon size={14} className="text-indigo-400" />
    <span className="text-[10px] font-bold uppercase tracking-wider text-white/60">{label}</span>
  </div>
);

const SelectCard = ({ active, onClick, icon: Icon, label, sub }: any) => (
  <button 
    onClick={onClick}
    className={`p-6 rounded-3xl border text-left transition-all relative ${
      active ? "bg-indigo-600/20 border-indigo-500" : "bg-white/5 border-white/5 hover:bg-white/10"
    }`}
  >
    <Icon className={`mb-3 ${active ? "text-indigo-400" : "text-white/30"}`} size={24} />
    <p className="font-bold text-sm block mb-1">{label}</p>
    <p className="text-[10px] text-white/40 leading-tight">{sub}</p>
    {active && <Check size={14} className="absolute top-4 right-4 text-indigo-400" />}
  </button>
);

const StrategyRow = ({ color, label, sub, val }: any) => (
  <div className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/5">
    <div className="flex items-center gap-3">
      <div className={`w-2 h-8 rounded-full ${color}`} />
      <div>
        <p className="text-xs font-bold leading-none mb-1">{label}</p>
        <p className="text-[9px] text-white/30 font-medium">{sub}</p>
      </div>
    </div>
    <div className="text-sm font-black tabular-nums">{val}</div>
  </div>
);

const ProjectionCard = ({ years, total, description, color, highlight }: any) => (
  <div className={`p-6 rounded-[2rem] border ${color} space-y-3`}>
    <div className="flex justify-between items-end">
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Em {years} anos</p>
        <p className={`text-3xl font-black tabular-nums ${highlight ? "text-white" : "text-white/80"}`}>{formatCurrency(total)}</p>
      </div>
      <div className={`p-2 rounded-lg ${highlight ? "bg-emerald-500 text-black" : "bg-white/5"}`}>
        <ArrowRight size={16} />
      </div>
    </div>
    <p className="text-xs text-white/60 font-medium leading-snug">{description}</p>
  </div>
);

const SummaryItem = ({ label, value, highlight }: any) => (
  <div className="flex justify-between items-center py-2 border-b border-white/5 last:border-0 border-dashed">
    <span className="text-xs font-medium text-white/40 uppercase tracking-wider">{label}</span>
    <span className={`text-sm font-black ${highlight ? "text-emerald-400" : "text-white"}`}>{value}</span>
  </div>
);
