import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Crown, Sparkles, Star, Zap } from "lucide-react";
import { motion } from "framer-motion";

export const PremiumPlans = ({ onClose }: { onClose: () => void }) => {
  const CHECKOUT_URL = "https://pay.finaliza.shop/checkout/dados?pl=422c50ed69";

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
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto border-0 shadow-2xl bg-card/50">
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute right-4 top-4 z-10 hover:bg-white/10"
          >
            ✕
          </Button>
          
          <div className="grid md:grid-cols-2 gap-0 overflow-hidden rounded-3xl">
            {/* Left Side - Value Prop */}
            <div className="p-8 md:p-12 bg-gradient-to-br from-indigo-900 to-purple-900 text-white relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
              <div className="relative z-10 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-bold uppercase tracking-widest text-amber-300">
                  <Star size={12} fill="currentColor" />
                  Oferta Limitada
                </div>
                
                <h2 className="text-4xl md:text-5xl font-black leading-tight">
                  Desbloqueie o <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-300">Poder Total</span> das suas Finanças.
                </h2>
                
                <p className="text-lg text-indigo-100/90 leading-relaxed">
                  Junte-se a milhares de empreendedores que estão transformando sua gestão financeira com IA.
                </p>

                <div className="grid grid-cols-2 gap-4 mt-8">
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
                        <Crown className="text-amber-400 mb-2" size={24} />
                        <div className="font-bold text-2xl">Premium</div>
                        <div className="text-xs text-indigo-200">Acesso total</div>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
                        <Sparkles className="text-purple-400 mb-2" size={24} />
                        <div className="font-bold text-2xl">I.A.</div>
                        <div className="text-xs text-indigo-200">Consultor Pessoal</div>
                    </div>
                </div>
              </div>
            </div>

            {/* Right Side - Pricing & Features */}
            <div className="p-8 md:p-12 bg-card flex flex-col justify-center">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-foreground">Plano PRO</h3>
                <div className="mt-4 flex items-baseline justify-center gap-1">
                  <span className="text-sm text-muted-foreground line-through">R$ 59,90</span>
                  <span className="text-5xl font-black text-primary">R$ 29,90</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">Pagamento único • Acesso vitalício</p>
              </div>

              <div className="space-y-4 mb-8">
                {features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="p-1 rounded-full bg-green-500/10 text-green-500">
                      <Check size={14} strokeWidth={3} />
                    </div>
                    <span className="text-sm font-medium text-foreground/80">{feature.name}</span>
                  </div>
                ))}
              </div>

              <Button
                size="lg"
                onClick={() => window.open(CHECKOUT_URL, "_blank")}
                className="w-full h-14 text-lg font-black bg-gradient-to-r from-primary to-purple-600 hover:scale-[1.02] transition-transform shadow-lg shadow-primary/25 rounded-2xl group"
              >
                <Zap className="mr-2 fill-current" size={20} />
                QUERO SER PRO AGORA
              </Button>
              
              <p className="text-xs text-center text-muted-foreground mt-4">
                🔒 Pagamento seguro via AppMax. Satisfação garantida ou seu dinheiro de volta.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
