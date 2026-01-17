import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Investment } from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Bitcoin,
  Building2,
  Check,
  Coins,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";

interface Props {
  onComplete: (asset: Omit<Investment, "id">) => void;
  onClose: () => void;
}

const STEPS = [
  { id: "type", title: "Tipo de Ativo" },
  { id: "details", title: "Identificação" },
  { id: "financials", title: "Valores" },
  { id: "allocation", title: "Alocação" },
];

const ASSET_TYPES = [
  {
    id: "stock",
    label: "Ações / Stocks",
    icon: TrendingUp,
    color: "bg-indigo-500",
  },
  { id: "fii", label: "FIIs", icon: Building2, color: "bg-emerald-500" },
  { id: "crypto", label: "Cripto", icon: Bitcoin, color: "bg-orange-500" },
  {
    id: "fixed_income",
    label: "Renda Fixa",
    icon: Coins,
    color: "bg-blue-500",
  },
];

export const AddAssetWizard = ({ onComplete, onClose }: Props) => {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Partial<Investment>>({
    currency: "BRL",
    type: "stock",
  });

  const handleNext = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else {
      // Finalize
      onComplete({
        name: data.name!,
        ticker: data.ticker!.toUpperCase(),
        type: data.type!,
        amount: Number(data.amount),
        averagePrice: Number(data.averagePrice),
        currentPrice: Number(data.averagePrice), // Start with same price
        currency: data.currency!,
        sector: data.sector || "Geral",
        targetAllocation: Number(data.targetAllocation) || 0,
      });
    }
  };

  const isValidStep = () => {
    switch (step) {
      case 0:
        return !!data.type;
      case 1:
        return !!data.ticker && !!data.name;
      case 2:
        return !!data.amount && !!data.averagePrice;
      case 3:
        return true; // Optional
      default:
        return false;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-[#0a0a0f] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/5 bg-white/[0.02]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-black text-white">Novo Investimento</h2>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Passo {step + 1} de {STEPS.length}
            </div>
          </div>
          {/* Progress Bar */}
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-indigo-500"
              initial={{ width: 0 }}
              animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 h-[400px] overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="step0"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="grid grid-cols-2 gap-4"
              >
                {ASSET_TYPES.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => {
                      setData({ ...data, type: type.id as any });
                      handleNext();
                    }}
                    className={`
                      flex flex-col items-center justify-center p-6 rounded-2xl border transition-all gap-4 group
                      ${
                        data.type === type.id
                          ? "bg-white/10 border-indigo-500 ring-1 ring-indigo-500"
                          : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10"
                      }
                    `}
                  >
                    <div
                      className={`w-12 h-12 rounded-xl ${type.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}
                    >
                      <type.icon size={24} />
                    </div>
                    <span className="font-bold text-white text-sm">
                      {type.label}
                    </span>
                  </button>
                ))}
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <Label className="uppercase text-[10px] font-black tracking-widest text-slate-400">
                    Ticker / Código
                  </Label>
                  <Input
                    autoFocus
                    value={data.ticker}
                    onChange={(e) =>
                      setData({ ...data, ticker: e.target.value.toUpperCase() })
                    }
                    placeholder="Ex: PETR4, BTC, CDB..."
                    className="h-14 bg-white/5 border-white/10 rounded-xl text-lg font-bold tracking-wider placeholder:font-normal"
                  />
                  <p className="text-[10px] text-slate-500">
                    O código usado na bolsa ou banco.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="uppercase text-[10px] font-black tracking-widest text-slate-400">
                    Nome do Ativo
                  </Label>
                  <Input
                    value={data.name}
                    onChange={(e) => setData({ ...data, name: e.target.value })}
                    placeholder="Ex: Petrobras PN"
                    className="h-14 bg-white/5 border-white/10 rounded-xl"
                  />
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="uppercase text-[10px] font-black tracking-widest text-slate-400">
                      Quantidade
                    </Label>
                    <Input
                      type="number"
                      step="any"
                      autoFocus
                      value={data.amount}
                      onChange={(e) =>
                        setData({ ...data, amount: e.target.value })
                      }
                      className="h-14 bg-white/5 border-white/10 rounded-xl text-lg font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="uppercase text-[10px] font-black tracking-widest text-slate-400">
                      Moeda
                    </Label>
                    <Select
                      value={data.currency}
                      onValueChange={(v) =>
                        setData({ ...data, currency: v as any })
                      }
                    >
                      <SelectTrigger className="h-14 bg-white/5 border-white/10 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-white/10 text-white">
                        <SelectItem value="BRL">BRL (R$)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="uppercase text-[10px] font-black tracking-widest text-slate-400">
                    Preço Médio (Custo)
                  </Label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                      <DollarSign size={16} />
                    </div>
                    <Input
                      type="number"
                      step="0.01"
                      value={data.averagePrice}
                      onChange={(e) =>
                        setData({ ...data, averagePrice: e.target.value })
                      }
                      className="h-14 bg-white/5 border-white/10 rounded-xl pl-10 text-lg font-bold"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="space-y-6 text-center"
              >
                <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                  <Check className="text-emerald-500" size={32} />
                </div>
                <h3 className="text-2xl font-black text-white">Quase lá!</h3>
                <p className="text-slate-400">
                  Defina uma meta de alocação para este ativo (opcional).
                </p>

                <div className="max-w-[200px] mx-auto space-y-2">
                  <Label className="uppercase text-[10px] font-black tracking-widest text-slate-400">
                    Meta Ideal (%)
                  </Label>
                  <Input
                    type="number"
                    placeholder="0%"
                    value={data.targetAllocation}
                    onChange={(e) =>
                      setData({ ...data, targetAllocation: e.target.value })
                    }
                    className="h-14 bg-white/5 border-white/10 rounded-xl text-center text-xl font-black"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 bg-white/[0.02] flex justify-between">
          <Button
            variant="ghost"
            onClick={step === 0 ? onClose : () => setStep(step - 1)}
            className="text-slate-400 hover:text-white"
          >
            {step === 0 ? "Cancelar" : <ArrowLeft size={18} />}
          </Button>

          {step > 0 && (
            <Button
              onClick={handleNext}
              disabled={!isValidStep()}
              className="bg-white text-black hover:bg-white/90 font-bold px-8 rounded-xl"
            >
              {step === STEPS.length - 1 ? "Concluir" : "Próximo"}
              {step < STEPS.length - 1 && <ArrowRight size={18} className="ml-2" />}
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
