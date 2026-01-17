import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Bot, Check, Crown, Star, Zap } from "lucide-react";

export const PremiumPlans = ({
  onClose,
  userEmail,
}: {
  onClose: () => void;
  userEmail?: string | null;
}) => {
  const CHECKOUT_URL = `https://pay.finaliza.shop/checkout/dados?pl=422c50ed69&email=${
    userEmail || ""
  }`;

  const features = [
    { name: "Sincronização em Nuvem Ilimitada", included: true },
    { name: "Consultor IA Financeiro 24/7", included: true },
    { name: "Gestão Empresarial Completa (DRE)", included: true },
    { name: "Emissão de Notas Fiscais", included: true },
    { name: "Alertas Inteligentes de Gastos", included: true },
    { name: "Suporte Prioritário VIP", included: true },
    { name: "Sem Anúncios", included: true },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md"
    >
      <Card className="w-full max-w-5xl max-h-[95vh] overflow-hidden border-none shadow-premium bg-[#030712] rounded-[3rem]">
        <div className="relative h-full flex flex-col">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute right-6 top-6 z-50 text-white/40 hover:text-white hover:bg-white/10 rounded-full"
          >
            ✕
          </Button>

          <div className="grid md:grid-cols-5 h-full overflow-y-auto">
            {/* Left Side - Value Prop (60%) */}
            <div className="md:col-span-3 p-10 md:p-16 flex flex-col justify-center relative overflow-hidden bg-indigo-600/5">
              <div className="hero-glow !opacity-10"></div>
              <div className="relative z-10 space-y-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">
                  <Star size={14} fill="currentColor" />
                  Oportunidade Única
                </div>

                <h2 className="text-5xl md:text-7xl font-black leading-[1.1] tracking-tighter text-white">
                  Torne-se{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-pink-500">
                    PRO
                  </span>{" "}
                  hoje. <br />
                  Para sempre.
                </h2>

                <p className="text-xl text-indigo-200/60 leading-relaxed font-medium max-w-lg">
                  Esqueça mensalidades. Tenha o Consultor Financeiro IA mais
                  avançado do mundo ao seu lado por um preço insignificante.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
                  <div className="glass-card p-6 rounded-[2rem] border-white/5">
                    <Crown className="text-amber-400 mb-4" size={32} />
                    <div className="font-black text-2xl text-white tracking-tight">
                      VIP Master
                    </div>
                    <div className="text-sm text-indigo-300/60 font-bold mt-1">
                      Todas as funções liberadas
                    </div>
                  </div>
                  <div className="glass-card p-6 rounded-[2rem] border-white/5">
                    <Bot className="text-primary mb-4" size={32} />
                    <div className="font-black text-2xl text-white tracking-tight">
                      I.A. 24/7
                    </div>
                    <div className="text-sm text-indigo-300/60 font-bold mt-1">
                      Consultoria em tempo real
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Pricing & Strategy (40%) */}
            <div className="md:col-span-2 p-10 md:p-16 flex flex-col justify-center bg-indigo-600/10 border-l border-white/5">
              <div className="text-center mb-10">
                <div className="px-4 py-1 bg-white/5 border border-white/10 rounded-full inline-block mb-6">
                  <span className="text-indigo-300 text-xs font-black uppercase tracking-widest">
                    Acesso Vitalício PRO
                  </span>
                </div>
                <div className="flex items-center justify-center gap-3 mb-2">
                  <span className="text-xl text-slate-500 line-through font-bold">
                    R$ 29,90
                  </span>
                  <span className="text-6xl font-black text-white glow-text tracking-tighter">
                    R$ 14,99
                  </span>
                </div>
                <p className="text-sm text-indigo-300/60 font-bold uppercase tracking-widest">
                  Apenas Hoje • Pix ou Cartão
                </p>
              </div>

              <div className="space-y-5 mb-12">
                {features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-4 group">
                    <div className="p-1 rounded-full bg-indigo-500/20 text-indigo-400 group-hover:scale-110 transition-transform">
                      <Check size={16} strokeWidth={4} />
                    </div>
                    <span className="text-base font-bold text-indigo-100/80 tracking-tight">
                      {feature.name}
                    </span>
                  </div>
                ))}
              </div>

              <Button
                size="lg"
                onClick={() => window.open(CHECKOUT_URL, "_blank")}
                className="w-full h-20 text-xl font-black bg-white text-indigo-950 hover:bg-indigo-50 hover:scale-[1.03] transition-all shadow-premium rounded-[2rem] group"
              >
                QUERO MEU ACESSO AGORA
                <Zap className="ml-3 fill-indigo-950 animate-pulse" size={24} />
              </Button>

              <div className="mt-8 flex items-center justify-center gap-4 text-[10px] text-indigo-300/40 font-black uppercase tracking-widest">
                <span className="flex items-center gap-1">
                  <i data-lucide="shield-check"></i> Seguro
                </span>
                <span>•</span>
                <span>Garantia de 7 Dias</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
