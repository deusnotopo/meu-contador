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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "lucide-react";
import { useState } from "react";
import { AssetAllocationChart } from "./AssetAllocationChart";
import { DividendForecast } from "./DividendForecast";
import { DividendList } from "./DividendList";
import { PortfolioAnalysis } from "./PortfolioAnalysis";
import { PortfolioTable } from "./PortfolioTable";
import { RebalancingPanel } from "./RebalancingPanel";
import { AddAssetWizard } from "./AddAssetWizard";
import { PrivacyValue } from "@/components/ui/PrivacyValue";
import { useRole } from "@/context/AuthContext";
import { showError } from "@/lib/toast";


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

export const InvestmentsDashboard = () => {
  const {
    assets,
    loading,
    addAsset,
    deleteAsset,
    addSale,
    getTaxIndicators,
    syncPrices,
  } = useInvestments();
  const { convert } = useCurrency();
  const { isViewer } = useRole();
  const [isOpen, setIsOpen] = useState(false);
  const [sellAmount, setSellAmount] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const showRealGain = false; // default to false if not toggleable for now
  const [showWizard, setShowWizard] = useState(false);
  const [profile] = useState(loadProfile()); // Load profile safely
  const IPCA_ANUAL = 0.045; // 4.5% sample IPCA for Brazil context

  // ... (keeping existing logic functions)

  const handleSync = () => {
    if (isViewer) return showError("Somente leitura");
    let token = localStorage.getItem("brapi_token");
    if (!token) {
      token = window.prompt(
        "Para cotações em tempo real, insira sua API Key da Brapi.dev:"
      );
      if (token) {
        localStorage.setItem("brapi_token", token);
      }
    }
    syncPrices(token || undefined);
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

  // State for Sell Dialog
  const [sellDialogOpen, setSellDialogOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Investment | null>(null);

  const handleOpenSell = (asset: Investment) => {
    setSelectedAsset(asset);
    setSellPrice(asset.currentPrice.toString());
    setSellDialogOpen(true);
  };
 
  const overrideAddAsset = (assetData: Omit<Investment, "id">) => {
      addAsset(assetData);
      setIsOpen(false); // Close wizard
  };

  const handleApplyPreset = (data: any) => {
    if (data && data.assets) {
      data.assets.forEach((asset: any) => {
        addAsset({
          name: asset.ticker || "",
          ticker: asset.ticker || "",
          type: asset.type || "stock",
          amount: asset.amount || 0,
          averagePrice: asset.averagePrice || 0,
          currency: asset.currency || "BRL",
          currentPrice: asset.averagePrice || 0,
          sector: "Geral",
        } as Omit<Investment, "id">);
      });
    }
    setShowWizard(false);
  };

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
                <p className="text-xs text-slate-400 font-medium">Use um modelo de carteira conservadora ou agressiva para começar rápido.</p>
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
            onComplete={handleApplyPreset} 
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
                     <Label className="text-slate-400 uppercase text-[10px] font-black tracking-widest">
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
                     <Label className="text-slate-400 uppercase text-[10px] font-black tracking-widest">
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
      </motion.div>

        <motion.div
          variants={container}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 pt-12 border-t border-white/5"
        >
          {[
            { label: "Patrimônio", value: totalValue, type: "currency" },
            {
              label: showRealGain ? "Lucro Real (Líquido)" : "Lucro Bruto",
              value: showRealGain
                ? profit - totalInvested * IPCA_ANUAL
                : profit,
              type: "profit",
            },
            {
              label: showRealGain ? "Rendimento Real" : "Performance",
              value: showRealGain
                ? profitPercentage - IPCA_ANUAL * 100
                : profitPercentage,
              type: "percent",
            },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              variants={item}
              className="p-6 bg-white/[0.03] rounded-3xl border border-white/5 transition-all hover:bg-white/[0.06] hover:border-white/10 group"
            >
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2 group-hover:text-slate-400 transition-colors">
                {stat.label}
              </p>
              <div
                className={`text-3xl font-black tracking-tight ${
                  stat.type === "profit" || stat.type === "percent"
                    ? stat.value >= 0
                      ? "text-emerald-400"
                      : "text-rose-400"
                    : "text-white"
                }`}
              >
                {stat.type === "currency" ? (
                  <PrivacyValue value={stat.value as number} />
                ) : (
                  <>
                    {(stat.value as number) >= 0 ? "+" : ""}
                    {stat.type === "percent" ? (
                      `${(stat.value as number).toFixed(2)}%`
                    ) : (
                      <PrivacyValue value={stat.value as number} />
                    )}
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>

      <motion.div variants={item}>
        <Tabs defaultValue="portfolio" className="w-full">
          <TabsList className="flex bg-white/[0.03] p-1.5 rounded-2xl border border-white/10 w-fit mb-10">
            <TabsTrigger
              value="portfolio"
              className="px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-lg active:scale-95"
            >
              Carteira
            </TabsTrigger>
            <TabsTrigger
              value="dividends"
              className="px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-lg active:scale-95"
            >
              Proventos
            </TabsTrigger>
            <TabsTrigger
              value="rebalance"
              className="px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-lg active:scale-95"
            >
              Rebalancear
            </TabsTrigger>
            <TabsTrigger
              value="forecast"
              className="px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-lg active:scale-95"
            >
              Projeção
            </TabsTrigger>
            <TabsTrigger
              value="analysis"
              className="px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-lg active:scale-95"
            >
              Análise
            </TabsTrigger>
            <TabsTrigger
              value="fiscal"
              className="px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-lg active:scale-95"
            >
              Fiscal
            </TabsTrigger>
          </TabsList>

          <TabsContent value="portfolio" className="mt-0 outline-none">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              {/* Allocation Chart */}
              <AssetAllocationChart 
                assets={assets} 
                loading={loading} 
                convert={convert} 
              />

              {/* Asset List (Replaced by Table) */}
              <div className="premium-card p-0 lg:col-span-2 overflow-hidden bg-transparent border-0">
                <div className="flex items-center gap-2 mb-4 px-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <LineChart className="text-emerald-400" size={16} />
                  </div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-widest">
                    Seus Ativos
                  </h3>
                </div>
                
                {loading ? (
                    <div className="space-y-4">
                         <Skeleton className="h-20 w-full rounded-2xl" />
                         <Skeleton className="h-20 w-full rounded-2xl" />
                         <Skeleton className="h-20 w-full rounded-2xl" />
                    </div>
                ) : (
                    <PortfolioTable 
                        assets={assets} 
                        onDelete={deleteAsset}
                        onEdit={(asset) => isViewer ? showError("Somente leitura") : console.log('Edit asset not implemented yet', asset)}
                        onSell={handleOpenSell}
                        isViewer={isViewer}
                    />
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="dividends" className="mt-0 outline-none">
            <DividendList />
          </TabsContent>

          <TabsContent value="rebalance" className="mt-0 outline-none">
            <RebalancingPanel assets={assets} />
          </TabsContent>

          <TabsContent value="forecast" className="mt-0 outline-none">
            <DividendForecast assets={assets} dividends={assets.flatMap(a => (a as any).dividends || [])} />
          </TabsContent>

          <TabsContent value="analysis" className="mt-0 outline-none">
            <PortfolioAnalysis assets={assets} profile={profile || undefined} />
          </TabsContent>

          <TabsContent value="fiscal" className="mt-0 outline-none">
            <div className="premium-card p-8 md:p-10 space-y-10">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight">
                    Inteligência <span className="text-indigo-400">Fiscal</span>{" "}
                    🇧🇷
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Monitoramento de impostos e limites de isenção.
                  </p>
                </div>
              </div>

              {getTaxIndicators(convert).length === 0 ? (
                <div className="text-center py-20 text-slate-500">
                  <Briefcase size={48} className="mx-auto mb-4 opacity-10" />
                  <p>Nenhuma venda de ações registrada este mês.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {getTaxIndicators(convert).map((indicator) => (
                    <div
                      key={indicator.month}
                      className="p-8 rounded-[40px] bg-white/[0.03] border border-white/5 space-y-6"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-4 py-1.5 rounded-full">
                          {indicator.month}
                        </span>
                        {indicator.isOverLimit ? (
                          <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest bg-rose-500/10 px-4 py-1.5 rounded-full animate-pulse">
                            ⚠️ Limite Excedido
                          </span>
                        ) : (
                          <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-4 py-1.5 rounded-full">
                            Isento
                          </span>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-end">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            Vendas de Ações (Mês)
                          </p>
                          <p className="text-xl font-black text-white">
                            {formatCurrency(indicator.totalStockSales)}{" "}
                            <span className="text-slate-600">/ R$ 20k</span>
                          </p>
                        </div>
                        <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{
                              width: `${Math.min(
                                (indicator.totalStockSales / 20000) * 100,
                                100
                              )}%`,
                            }}
                            className={`h-full transition-all ${
                              indicator.isOverLimit
                                ? "bg-rose-500"
                                : indicator.totalStockSales > 15000
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                            }`}
                          />
                        </div>
                      </div>

                      <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            Imposto Estimado (Swing)
                          </p>
                          <p
                            className={`text-xl font-black ${
                              indicator.isOverLimit
                                ? "text-rose-400"
                                : "text-slate-500"
                            }`}
                          >
                            {formatCurrency(indicator.estimatedTax)}
                          </p>
                        </div>
                        <div className="text-right max-w-[150px]">
                          <p className="text-[8px] font-medium text-slate-500 leading-tight">
                            {indicator.isOverLimit
                              ? "Você deve emitir um DARF (código 6015) até o último dia útil do mês seguinte."
                              : "Vendas abaixo de R$ 20k/mês em ações são isentas de IR no Brasil."}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    title: "FIIs",
                    desc: "Isentos no dividendo, mas pagam 20% sobre lucro na venda (qualquer valor).",
                    color: "text-amber-400",
                  },
                  {
                    title: "Day Trade",
                    desc: "Alíquota fixa de 20% sobre o lucro líquido. Não há isenção de R$ 20k.",
                    color: "text-rose-400",
                  },
                  {
                    title: "Cripto",
                    desc: "Isenção de até R$ 35k em vendas mensais (exceto para lucro no exterior).",
                    color: "text-indigo-400",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 flex items-start gap-4"
                  >
                    <div className="mt-1 w-2 h-2 rounded-full bg-white/20 shrink-0" />
                    <div>
                      <h4
                        className={`text-xs font-black uppercase tracking-widest mb-1 ${item.color}`}
                      >
                        {item.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
};
