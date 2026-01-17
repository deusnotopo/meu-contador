import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./button";
import { Sparkles, GraduationCap, Briefcase, Wallet, Check, ArrowRight } from "lucide-react";
import { showSuccess } from "@/lib/toast";

interface PresetData {
  budgets?: Array<{ category: string; amount: number }>;
  goals?: Array<{ name: string; targetAmount: number; icon: string }>;
  categories?: string[];
  assets?: Array<{ ticker: string; type: string; amount: number; averagePrice: number }>;
}

interface QuickSetupWizardProps {
  type: "personal" | "business" | "investments";
  onComplete: (data: PresetData) => void;
  onClose: () => void;
}

const PRESETS = {
  personal: [
    {
      id: "student",
      title: "Universitário",
      desc: "Focado em economia e lazer moderado.",
      icon: GraduationCap,
      color: "from-blue-500 to-indigo-600",
      data: {
        budgets: [
          { category: "Alimentação", amount: 600 },
          { category: "Transporte", amount: 200 },
          { category: "Lazer", amount: 150 },
          { category: "Educação", amount: 300 }
        ],
        goals: [{ name: "Fundo de Emergência", targetAmount: 2000, icon: "🛡️" }]
      }
    },
    {
      id: "standard",
      title: "Padrão",
      desc: "Equilíbrio entre contas fixas e lazer.",
      icon: Wallet,
      color: "from-emerald-500 to-teal-600",
      data: {
        budgets: [
          { category: "Alimentação", amount: 1200 },
          { category: "Moradia", amount: 1500 },
          { category: "Transporte", amount: 400 },
          { category: "Lazer", amount: 500 }
        ],
        goals: [{ name: "Viagem", targetAmount: 5000, icon: "✈️" }]
      }
    }
  ],
  business: [
    {
      id: "mei",
      title: "MEI / Autônomo",
      desc: "Configuração básica para prestadores de serviço.",
      icon: Briefcase,
      color: "from-amber-500 to-orange-600",
      data: {
        categories: ["Consultoria", "Assinaturas", "Impostos", "Marketing"],
        budgets: [{ category: "Marketing", amount: 200 }]
      }
    }
  ],
  investments: [
    {
      id: "conservative",
      title: "Conservador",
      desc: "Foco em Renda Fixa e Segurança.",
      icon: Check,
      color: "from-indigo-500 to-blue-600",
      data: {
        assets: [
          { ticker: "Tesouro Selic", type: "fixed_income", amount: 1, averagePrice: 1000 },
          { ticker: "CDB 100% CDI", type: "fixed_income", amount: 1, averagePrice: 500 }
        ]
      }
    },
    {
      id: "aggressive",
      title: "Agressivo",
      desc: "Mix de Ações, FIIs e Cripto.",
      icon: Sparkles,
      color: "from-purple-500 to-pink-600",
      data: {
        assets: [
          { ticker: "BOVA11", type: "etf", amount: 10, averagePrice: 110 },
          { ticker: "BTC", type: "crypto", amount: 0.001, averagePrice: 200000 },
          { ticker: "IVVB11", type: "etf", amount: 5, averagePrice: 200 }
        ]
      }
    }
  ]
};

export const QuickSetupWizard: React.FC<QuickSetupWizardProps> = ({ type, onComplete, onClose }) => {
  const presets = PRESETS[type] || [];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="w-full max-w-2xl bg-[#0a0a0c] border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl"
      >
        <div className="p-8 md:p-12 space-y-8">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20">
              <Sparkles size={12} className="text-indigo-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Quick Setup</span>
            </div>
            <h2 className="text-3xl font-black text-white tracking-tighter uppercase">
              Configuração <span className="premium-gradient-text">Instantânea</span>
            </h2>
            <p className="text-slate-400 text-sm font-medium">
              Escolha um perfil abaixo para configurar esta área automaticamente em segundos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {presets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => {
                  onComplete(preset.data);
                  showSuccess(`Perfil ${preset.title} aplicado!`);
                }}
                className="group relative p-6 text-left rounded-[2rem] bg-white/5 border border-white/5 hover:border-white/20 transition-all duration-500 overflow-hidden"
              >
                <div className={`absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br ${preset.color} opacity-10 blur-2xl group-hover:opacity-20 transition-opacity`} />
                
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${preset.color} flex items-center justify-center text-white shadow-lg mb-6 group-hover:scale-110 transition-transform`}>
                  <preset.icon size={24} />
                </div>

                <h4 className="text-xl font-black text-white mb-2 tracking-tight">{preset.title}</h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">{preset.desc}</p>
                
                <div className="mt-6 flex items-center gap-2 text-white/40 group-hover:text-white transition-colors">
                  <span className="text-[10px] font-black uppercase tracking-widest">Aplicar</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            ))}
          </div>

          <div className="pt-4 flex justify-between items-center border-t border-white/5">
            <button 
              onClick={onClose}
              className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
            >
              Agora não, quero fazer manual
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
