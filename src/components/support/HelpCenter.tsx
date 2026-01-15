import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Mail,
  MessageCircle,
  Search,
} from "lucide-react";
import { useState } from "react";

const FAQS = [
  {
    question: "Como funciona o 'Modo Privacidade'?",
    answer:
      "O Modo Privacidade oculta todos os valores monetários da tela. É ideal para quando você está em locais públicos ou compartilhando sua tela. Basta clicar no ícone de olho no topo do app.",
  },
  {
    question: "Meus dados estão seguros?",
    answer:
      "Sim! Utilizamos criptografia de ponta a ponta e seus dados são armazenados de forma segura utilizando a infraestrutura do Google Firebase. Ninguém além de você tem acesso aos seus dados financeiros.",
  },
  {
    question: "Como conectar minha conta bancária?",
    answer:
      "Atualmente, a conexão automática (Open Finance) está em fase beta. Por enquanto, você pode importar extratos OFX/CSV ou adicionar transações manualmente. A importação inteligente via IA facilita esse processo.",
  },
  {
    question: "O app funciona sem internet?",
    answer:
      "Sim! O Meu Contador é um PWA (Progressive Web App). Você pode acessar seus dados e registrar transações offline. Elas serão sincronizadas assim que você recuperar a conexão.",
  },
  {
    question: "Como definir um orçamento?",
    answer:
      "Vá até a seção de 'Orçamentos' no menu principal. Lá você pode definir limites para categorias específicas (como Alimentação ou Lazer). O app avisará quando você estiver perto do limite.",
  },
  {
    question: "Posso exportar meus relatórios?",
    answer:
      "Com certeza. No Dashboard Global, clique no botão 'Exportar PDF'. Você receberá um relatório detalhado com gráficos e análises do período selecionado.",
  },
];

export const HelpCenter = ({ onClose }: { onClose: () => void }) => {
  const [search, setSearch] = useState("");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const filteredFaqs = FAQS.filter(
    (faq) =>
      faq.question.toLowerCase().includes(search.toLowerCase()) ||
      faq.answer.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-[#02040a] text-white">
      {/* Header */}
      <div className="p-6 border-b border-white/10 bg-gradient-to-r from-indigo-500/10 to-transparent">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-xl">
              <HelpCircle className="text-indigo-400" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">
                Central de Ajuda
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Suporte Oficial & Tutoriais
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="rounded-xl hover:bg-white/5"
          >
            Fechar
          </Button>
        </div>

        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            size={16}
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Como posso ajudar você hoje?"
            className="pl-10 bg-black/40 border-white/10 rounded-xl h-12 text-sm focus:ring-indigo-500/50"
          />
        </div>
      </div>

      <ScrollArea className="flex-1 p-6">
        <div className="space-y-6">
          {/* Support Channels */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors cursor-pointer group">
              <CardContent className="p-4 flex flex-col items-center text-center gap-3">
                <div className="p-3 bg-emerald-500/20 rounded-full group-hover:scale-110 transition-transform">
                  <MessageCircle className="text-emerald-400" size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Chat com IA</h4>
                  <p className="text-xs text-slate-400">
                    Tire dúvidas instantâneas
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors cursor-pointer group">
              <CardContent className="p-4 flex flex-col items-center text-center gap-3">
                <div className="p-3 bg-blue-500/20 rounded-full group-hover:scale-110 transition-transform">
                  <Mail className="text-blue-400" size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Suporte Humano</h4>
                  <p className="text-xs text-slate-400">Resposta em 24h</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Sparkles className="text-yellow-400" size={16} />
              Perguntas Frequentes
            </h3>
            <div className="space-y-3">
              {filteredFaqs.map((faq, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden transition-all duration-300"
                >
                  <button
                    onClick={() =>
                      setOpenIndex(openIndex === index ? null : index)
                    }
                    className="w-full flex items-center justify-between p-4 text-left font-medium text-sm hover:bg-white/5 transition-colors"
                  >
                    {faq.question}
                    {openIndex === index ? (
                      <ChevronUp size={16} className="text-indigo-400" />
                    ) : (
                      <ChevronDown size={16} className="text-slate-500" />
                    )}
                  </button>
                  <AnimatePresence>
                    {openIndex === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 pt-0 text-sm text-slate-400 leading-relaxed border-t border-white/5">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
              {filteredFaqs.length === 0 && (
                <div className="text-center py-8 text-slate-500 text-sm">
                  Nenhum resultado encontrado para "{search}"
                </div>
              )}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};
