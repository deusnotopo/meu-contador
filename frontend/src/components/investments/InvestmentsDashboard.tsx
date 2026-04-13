import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Skeleton } from "@/components/ui/skeleton";
import { QuickSetupWizard } from "@/components/ui/QuickSetupWizard";
import { useCurrency } from "@/context/CurrencyContext";
import { useInvestments } from "@/hooks/useInvestments";
import { formatCurrency } from "@/lib/formatters";
import { loadProfile } from "@/lib/storage";
import type { Investment, Currency } from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import {
  Briefcase,
  LineChart,
  Plus,
  RefreshCcw,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { DividendForecast } from "./DividendForecast";
import { DividendList } from "./DividendList";
import { PortfolioAnalysis } from "./PortfolioAnalysis";
import { PortfolioTable } from "./PortfolioTable";
import { RebalancingPanel } from "./RebalancingPanel";
import { AddAssetWizard } from "./AddAssetWizard";
import { useRole } from "@/context/AuthContext";
import { showError } from "@/lib/toast";
import { useLocation } from "react-router-dom";
import { fetchMarketData } from "@/lib/market-data";
import { BentoCockpit } from "./views/BentoCockpit";
import { DebtManagerView } from "./views/DebtManagerView";

export type ViewState = 'cockpit' | 'ledger' | 'debts' | 'fiscal' | 'lab';

interface InvestmentPresetAsset {
  ticker?: string;
  type?: Investment["type"];
  amount?: number;
  averagePrice?: number;
  currency?: Investment["currency"];
}

interface InvestmentPresetData {
  assets?: InvestmentPresetAsset[];
}

interface InvestmentWithDividends extends Investment {
  dividends?: unknown[];
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

export const InvestmentsDashboard = ({ onNavigate }: { onNavigate?: (tab: import('@/types/navigation').TabType) => void } = {}) => {
  const location = useLocation();
  const {
    assets,
    loading,
    error,
    addAsset,
    deleteAsset,
    updateAsset,
    addDividend,
    deleteDividend,
    addSale,
    getTaxIndicators,
    syncPrices,
  } = useInvestments();
  const currencyContext = useCurrency();
  const convert = currencyContext?.convert || ((val: number) => val);
  const { isViewer } = useRole();
  const [activeView, setActiveView] = useState<ViewState>('cockpit');
  const [isOpen, setIsOpen] = useState(false);
  const [sellAmount, setSellAmount] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [showWizard, setShowWizard] = useState(false);
  const [profile] = useState(loadProfile());

  useEffect(() => {
    fetchMarketData().catch(() => {});
  }, []);

  // Sincroniza preços via backend (sem precisar de token no frontend)
  const handleSync = () => {
    if (isViewer) return showError("Somente leitura");
    syncPrices();
  };


  const totalInvested = assets.reduce(
    (acc, curr) =>
      acc +
      convert(curr.amount * curr.averagePrice, (curr.currency || "BRL") as Currency, "BRL"),
    0
  );
  const totalValue = assets.reduce(
    (acc, curr) =>
      acc +
      convert(curr.amount * curr.currentPrice, curr.currency || "BRL", "BRL"),
    0
  );
  const profit = totalValue - totalInvested;
  const profitPercentage =
    totalInvested > 0 ? (profit / totalInvested) * 100 : 0;
  const taxIndicators = useMemo(() => getTaxIndicators(convert), [getTaxIndicators, convert, assets]);

  // State for Edit/Sell Dialogs
  const [sellDialogOpen, setSellDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Investment | null>(null);
  const [editingAsset, setEditingAsset] = useState<Investment | null>(null);
  
  const [editName, setEditName] = useState("");
  const [editTicker, setEditTicker] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editPrice, setEditPrice] = useState("");

  const handleOpenSell = (asset: Investment) => {
    setSelectedAsset(asset);
    setSellPrice(asset.currentPrice.toString());
    setSellDialogOpen(true);
  };
 
  const overrideAddAsset = (assetData: Omit<Investment, "id">) => {
      addAsset(assetData);
      setIsOpen(false); // Close wizard
  };

  const handleApplyPreset = (data: InvestmentPresetData) => {
    if (data && data.assets) {
      data.assets.forEach((asset) => {
        addAsset({
          name: asset.ticker || "",
          ticker: asset.ticker || "",
          type: (asset.type || "stock") as "stock" | "fii" | "crypto" | "fixed_income" | "etf",
          amount: asset.amount || 0,
          averagePrice: asset.averagePrice || 0,
          currency: asset.currency || "BRL",
          currentPrice: asset.averagePrice || 0,
          sector: "Geral",
        });
      });
    }
    setShowWizard(false);
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("add") === "true") {
      setIsOpen(true);
    }
  }, [location.search]);

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={container}
      className="space-y-12 pb-12"
    >
      <AnimatePresence>
        {assets.length === 0 && !showWizard && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="premium-card p-6 bg-amber-500/10 border-amber-500/20 flex flex-col md:flex-row items-center justify-between gap-6"
          >
            <div className="flex items-center gap-4 text-center md:text-left">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-lg">
                <Sparkles size={24} />
              </div>
              <div>
                <h4 className="font-black text-white uppercase tracking-tight">Comece sua Carteira</h4>
                <p className="text-xs text-[var(--t3)] font-medium">Use um modelo de carteira conservadora ou agressiva para começar rápido.</p>
              </div>
            </div>
            <Button 
              onClick={() => setShowWizard(true)}
              disabled={isViewer}
              className="bg-white text-black font-black uppercase tracking-widest text-[10px] h-12 px-8 rounded-xl disabled:opacity-50"
            >
              Abrir Wizard
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showWizard && (
          <QuickSetupWizard 
            type="investments" 
            onComplete={handleApplyPreset as any} 
            onClose={() => setShowWizard(false)} 
          />
        )}
      </AnimatePresence>
      {/* Header / Summary - Obsidian Style */}
      <motion.div variants={item} className="space-y-8">
        <div className="card-obsidian relative overflow-hidden p-8 md:p-10 group">
         <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-600/10 blur-[100px] rounded-full opacity-50 group-hover:opacity-70 transition-opacity" />
         
         <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
               <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <Sparkles size={12} className="text-emerald-400" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-300">Wealth Management</span>
               </div>
               <h1 className="text-4xl md:text-5xl font-heading font-bold text-white tracking-tight">
                  Meus <span className="text-emerald-400">Investimentos</span>
               </h1>
            </div>

            <div className="flex items-center gap-3">
               <Button
                  onClick={handleSync}
                  variant="outline"
                  className="rounded-full border-zinc-700 hover:bg-zinc-800 text-zinc-300 hover:text-white"
               >
                  <RefreshCcw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Sincronizar
               </Button>
               <Button
                  onClick={() => isViewer ? showError("Somente leitura") : setIsOpen(true)}
                  disabled={isViewer}
                  className="rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-500/20 disabled:opacity-50"
               >
                  <Plus size={18} className="mr-2" />
                  Novo Aporte
               </Button>
            </div>
         </div>
      </div>{/* Main Add Asset Wizard Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <AddAssetWizard 
                        onClose={() => setIsOpen(false)}
                        onComplete={overrideAddAsset}
                    />
                )}
            </AnimatePresence>

            {/* Sell Dialog (Lifted State) */}
            <Dialog open={sellDialogOpen} onOpenChange={setSellDialogOpen}>
              <DialogContent className="glass-premium border-white/10 text-white">
                <DialogHeader>
                  <DialogTitle className="text-xl font-black">
                    Vender {selectedAsset?.ticker}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                     <Label className="text-[var(--t3)] uppercase text-[10px] font-black tracking-widest">
                       Quantidade (Disponível: {selectedAsset?.amount})
                     </Label>
                     <Input
                       type="number"
                       className="bg-white/5 h-12 rounded-xl"
                       value={sellAmount}
                       onChange={(e) => setSellAmount(e.target.value)}
                       max={selectedAsset?.amount || 0}
                     />
                  </div>
                  <div className="space-y-2">
                     <Label className="text-[var(--t3)] uppercase text-[10px] font-black tracking-widest">
                       Preço de Venda
                     </Label>
                     <Input
                       type="number"
                       className="bg-white/5 h-12 rounded-xl"
                       value={sellPrice}
                       onChange={(e) => setSellPrice(e.target.value)}
                     />
                  </div>
                  <Button
                    className="w-full h-14 rounded-2xl bg-amber-600 hover:bg-amber-500 font-black disabled:opacity-50"
                    disabled={isViewer}
                    onClick={() => {
                       if (isViewer) return showError("Somente leitura");
                       if (selectedAsset && sellAmount) {
                          addSale(selectedAsset.id, {
                             amount: parseFloat(sellAmount),
                             price: parseFloat(sellPrice),
                             date: new Date().toISOString()
                          });
                          setSellDialogOpen(false);
                          setSellAmount("");
                       }
                    }}
                  >
                     Confirmar Venda
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
              <DialogContent className="glass-premium border-white/10 text-white">
                <DialogHeader>
                  <DialogTitle className="text-xl font-black">
                    Editar Ativo
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[var(--t3)] uppercase text-[10px] font-black tracking-widest">Ticker</Label>
                      <Input value={editTicker} onChange={e => setEditTicker(e.target.value)} className="bg-white/5" />
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[var(--t3)] uppercase text-[10px] font-black tracking-widest">Nome</Label>
                       <Input value={editName} onChange={e => setEditName(e.target.value)} className="bg-white/5" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <Label className="text-[var(--t3)] uppercase text-[10px] font-black tracking-widest">Quantidade</Label>
                       <Input type="number" value={editAmount} onChange={e => setEditAmount(e.target.value)} className="bg-white/5" />
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[var(--t3)] uppercase text-[10px] font-black tracking-widest">P. Médio</Label>
                       <Input type="number" value={editPrice} onChange={e => setEditPrice(e.target.value)} className="bg-white/5" />
                    </div>
                  </div>
                  <Button
                    className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-500 font-black"
                    onClick={() => {
                        if (editingAsset && editAmount && editPrice) {
                          updateAsset(editingAsset.id, {
                            name: editName,
                            ticker: editTicker,
                            amount: parseFloat(editAmount),
                            averagePrice: parseFloat(editPrice)
                          });
                          setEditDialogOpen(false);
                        }
                    }}
                  >
                    Salvar Alterações
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
      </motion.div>



      <motion.div variants={item}>
        {/* WEALTH OS DOCK (Segmented Control) */}
        <div className="flex bg-white/[0.03] p-1.5 rounded-full border border-white/10 w-full mb-8 relative justify-between overflow-x-auto gap-2">
          {[
            { id: 'cockpit', label: 'Panorama', icon: '🌐' },
            { id: 'ledger', label: 'Meus Ativos', icon: '💼' },
            { id: 'debts', label: 'Passivos', icon: '🚨' },
            { id: 'fiscal', label: 'Fiscal & Renda', icon: '⚖️' },
            { id: 'lab', label: 'Estratégia', icon: '🔬' }
          ].map(v => (
            <button
              key={v.id}
              onClick={() => setActiveView(v.id as ViewState)}
              className={`flex-1 py-3 px-4 rounded-full text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap min-w-[150px] ${
                activeView === v.id ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.4)]' : 'text-[var(--t3)] hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="mr-2 text-sm">{v.icon}</span>
              {v.label}
            </button>
          ))}
        </div>

        {/* VIEW RENDERER (Deep Dives & Bento) */}
        <AnimatePresence mode="wait">
          {activeView === 'cockpit' && (
             <motion.div key="cockpit" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                 <BentoCockpit
                   totalValue={totalValue}
                   totalInvested={totalInvested}
                   profitPercentage={profitPercentage}
                   onNavigateToLedger={() => setActiveView('ledger')}
                 />
             </motion.div>
          )}

          {activeView === 'ledger' && (
             <motion.div key="ledger" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
                 <div className="flex items-center gap-2 mb-4">
                   <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                     <LineChart className="text-indigo-400" size={20} />
                   </div>
                   <div>
                     <h3 className="text-sm font-black text-white uppercase tracking-widest">Ações & Papéis</h3>
                     <p className="text-[11px] text-[var(--t4)]">Acompanhamento e gestão individual do seu patrimônio listado.</p>
                   </div>
                 </div>
                 <div className="bg-[#030712] rounded-3xl overflow-hidden border border-white/5">
                   {loading ? (
                       <div className="space-y-4 p-4">
                            <Skeleton className="h-20 w-full rounded-2xl" />
                            <Skeleton className="h-20 w-full rounded-2xl" />
                       </div>
                   ) : error ? (
                       <div className="p-8 text-center text-rose-300 bg-rose-500/10 rounded-2xl border border-rose-500/20">
                         <AlertCircle className="mx-auto mb-2 text-rose-400" size={24} />
                         <h4 className="font-bold">Falha de Conexão</h4>
                         <p className="text-xs opacity-80">{error}</p>
                       </div>
                   ) : (
                       <PortfolioTable 
                           assets={assets} 
                           convert={convert}
                           onDelete={deleteAsset}
                           onEdit={(asset) => {
                             if (isViewer) return showError("Somente leitura");
                             setEditingAsset(asset);
                             setEditName(asset.name);
                             setEditTicker(asset.ticker);
                             setEditAmount(asset.amount.toString());
                             setEditPrice(asset.averagePrice.toString());
                             setEditDialogOpen(true);
                           }}
                           onSell={handleOpenSell}
                           isViewer={isViewer}
                       />
                   )}
                 </div>
             </motion.div>
          )}

          {activeView === 'debts' && (
             <motion.div key="debts" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
                 <DebtManagerView />
             </motion.div>
          )}

          {activeView === 'fiscal' && (
             <motion.div key="fiscal" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                <div className="card space-y-10" style={{ background: '#030712', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="text-2xl font-black text-white uppercase tracking-tight">
                        Inteligência <span className="text-indigo-400">Fiscal & Proventos</span> 🇧🇷
                      </h3>
                      <p className="text-xs text-[var(--t4)] font-medium tracking-widest uppercase">
                        Monitoramento de D.A.R.F e Recebimento Diário.
                      </p>
                    </div>
                  </div>

                  <DividendList
                    assets={assets}
                    dividends={assets.flatMap((a) =>
                      ((a as InvestmentWithDividends).dividends || []).map((d: any) => ({
                        ...d,
                        assetId: a.id,
                        assetTicker: a.ticker,
                      }))
                    )}
                    addDividend={addDividend}
                    deleteDividend={deleteDividend}
                  />

                  {taxIndicators.length === 0 ? (
                    <div className="text-center py-20 text-[var(--t4)] border-t border-white/5 mt-10">
                      <Briefcase size={48} className="mx-auto mb-4 opacity-10" />
                      <p className="tracking-widest uppercase text-xs">Nenhuma venda de ações registrada neste mês fiscal.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-white/5 pt-10">
                      {taxIndicators.map((indicator) => (
                        <div key={indicator.month} className="p-8 rounded-[30px] bg-white/[0.02] border border-white/5 space-y-6">
                           <div className="flex items-center justify-between">
                             <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-4 py-1.5 rounded-full">{indicator.month}</span>
                             {indicator.isOverLimit ? (
                               <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest bg-rose-500/10 px-4 py-1.5 rounded-full animate-pulse">⚠️ Limite DARF</span>
                             ) : (
                               <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-4 py-1.5 rounded-full">Isenção Receita</span>
                             )}
                           </div>
                           <div className="space-y-3">
                             <div className="flex justify-between items-end">
                               <p className="text-[10px] font-black text-[var(--t4)] uppercase tracking-widest">Vol. Vendas (Mês)</p>
                               <p className="text-xl font-black text-white font-mono">{formatCurrency(indicator.totalStockSales)}</p>
                             </div>
                             <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                               <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min((indicator.totalStockSales / 20000) * 100, 100)}%` }} className={`h-full opacity-50 ${indicator.isOverLimit ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                             </div>
                           </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
             </motion.div>
          )}

          {activeView === 'lab' && (
             <motion.div key="lab" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
               {/* Lab Header */}
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-xl">🔬</div>
                 <div>
                   <h3 className="text-sm font-black text-white uppercase tracking-widest">Laboratório Estratégico</h3>
                   <p className="text-[11px] text-[var(--t4)]">Simule cenários, rebalanceie e planeje sua independência financeira.</p>
                 </div>
               </div>

               {onNavigate && (
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   {[
                     { emoji: '📈', title: 'Juros Compostos', desc: 'Simule o crescimento do patrimônio com aportes mensais.', tab: 'invest_compostos' as import('@/types/navigation').TabType, color: 'rgba(74,139,255,0.12)', border: 'rgba(74,139,255,0.25)', badge: '#4A8BFF' },
                     { emoji: '💳', title: 'Dívidas vs Investir', desc: 'Compare o impacto de quitar dívidas x continuar investindo.', tab: 'invest_dividas' as import('@/types/navigation').TabType, color: 'rgba(255,79,110,0.10)', border: 'rgba(255,79,110,0.20)', badge: '#FF4F6E' },
                     { emoji: '🔥', title: 'Calculadora FIRE', desc: 'Descubra em quanto tempo você pode se aposentar.', tab: 'retire_fire' as import('@/types/navigation').TabType, color: 'rgba(255,173,59,0.10)', border: 'rgba(255,173,59,0.20)', badge: '#FFAD3B' },
                   ].map((tool) => (
                     <button key={tool.tab} onClick={() => onNavigate(tool.tab)}
                       className="text-left p-5 rounded-2xl transition-all hover:-translate-y-0.5"
                       style={{ background: tool.color, border: `1px solid ${tool.border}` }}
                     >
                       <div className="text-3xl mb-3">{tool.emoji}</div>
                       <div className="text-sm font-bold text-white mb-1">{tool.title}</div>
                       <div className="text-[11px] text-[var(--t3)] leading-relaxed">{tool.desc}</div>
                       <div className="mt-3 text-[10px] font-black uppercase tracking-widest" style={{ color: tool.badge }}>Abrir →</div>
                     </button>
                   ))}
                 </div>
               )}

               <div className="grid grid-cols-1 gap-6">
                 <div className="rounded-3xl border border-white/5 overflow-hidden">
                    <RebalancingPanel assets={assets} />
                 </div>
                 <div className="rounded-3xl border border-white/5 overflow-hidden">
                    <PortfolioAnalysis assets={assets} profile={profile || undefined} convert={convert} />
                 </div>
                 <div className="rounded-3xl border border-white/5 overflow-hidden">
                    <DividendForecast assets={assets} dividends={assets.flatMap(a => ((a as InvestmentWithDividends).dividends || []) as never[])} />
                 </div>
               </div>
             </motion.div>
          )}
        </AnimatePresence>
      </motion.div>


    </motion.div>
  );
};
