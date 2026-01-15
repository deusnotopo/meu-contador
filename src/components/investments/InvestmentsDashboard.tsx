import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useInvestments } from "@/hooks/useInvestments";
import { formatCurrency } from "@/lib/formatters";
import {
    Briefcase,
    LineChart,
    PieChart,
    Plus,
    RefreshCcw,
    Trash2,
} from "lucide-react";
import { useState } from "react";
import {
    Cell,
    Pie,
    PieChart as RePieChart,
    ResponsiveContainer,
    Tooltip,
} from "recharts";
import { PrivacyValue } from "../ui/PrivacyValue";
import { DividendList } from "./DividendList";

import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { AnimatePresence, motion } from "framer-motion";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"];

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
  const { user } = useAuth();
  const { assets, loading, addAsset, deleteAsset, addSale, getTaxIndicators, syncPrices } =
    useInvestments();
  const [isOpen, setIsOpen] = useState(false);
  const [sellAssetId, setSellAssetId] = useState<number | null>(null);
  const [sellAmount, setSellAmount] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [showRealGain, setShowRealGain] = useState(false);
  const IPCA_ANUAL = 0.045; // 4.5% sample IPCA for Brazil context

  // ... (keeping existing logic functions)

  const handleSync = () => {
    let token = localStorage.getItem("brapi_token");
    if (!token) {
      token = window.prompt(
        "Para cotações em tempo real, insira sua API Key da Brapi.dev:"
      );
      if (token) {
        localStorage.setItem("brapi_token", token);
      }
    }
    syncPrices(user?.uid || "", token || undefined);
  };
  const [formData, setFormData] = useState({
    name: "",
    ticker: "",
    type: "stock" as Investment["type"],
    amount: "",
    averagePrice: "",
    currentPrice: "",
    targetAllocation: "",
  });

  const totalInvested = assets.reduce(
    (acc, curr) => acc + curr.amount * curr.averagePrice,
    0
  );
  const totalValue = assets.reduce(
    (acc, curr) => acc + curr.amount * curr.currentPrice,
    0
  );
  const profit = totalValue - totalInvested;
  const profitPercentage =
    totalInvested > 0 ? (profit / totalInvested) * 100 : 0;

  const allocationData = assets.map((asset) => ({
    name: asset.ticker,
    value: asset.amount * asset.currentPrice,
  }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addAsset({
      name: formData.name,
      ticker: formData.ticker.toUpperCase(),
      type: formData.type,
      amount: parseFloat(formData.amount),
      averagePrice: parseFloat(formData.averagePrice),
      currentPrice: parseFloat(formData.currentPrice || formData.averagePrice),
      sector: formData.sector,
      targetAllocation: parseFloat(formData.targetAllocation) || 0,
    });
    setIsOpen(false);
    setFormData({
      name: "",
      ticker: "",
      type: "stock",
      amount: "",
      averagePrice: "",
      currentPrice: "",
      sector: "",
      targetAllocation: "",
    });
  };

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={container}
      className="space-y-12 pb-12"
    >
      {/* Header / Summary */}
      <motion.div variants={item} className="premium-card p-6 md:p-10">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-amber-500/10 blur-[120px] rounded-full" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-orange-500/5 blur-[120px] rounded-full" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-white/5 text-[10px] font-black uppercase tracking-widest text-amber-400">
              <Briefcase size={12} />
              Carteira de Ativos
            </div>
            <h2 className="text-4xl md:text-5xl font-black leading-tight tracking-tighter">
              Meus <br />
              <span className="premium-gradient-text">Investimentos</span>
            </h2>
            <p className="text-slate-400 font-medium max-w-md">
              Patrimônio acumulado em renda variável e fixa.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowRealGain(!showRealGain)}
                className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${
                  showRealGain
                    ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-400"
                    : "bg-white/5 border-white/10 text-slate-500"
                }`}
              >
                {showRealGain ? "🛡️ Ganho Real (s/ IPCA)" : "📉 Ganho Nominal"}
              </button>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              onClick={handleSync}
              variant="ghost"
              className="bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-2xl h-14 px-8"
              disabled={loading}
            >
              <RefreshCcw
                size={18}
                className={`mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Sincronizar
            </Button>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button className="bg-white text-black font-black rounded-2xl h-14 px-8 hover:bg-white/90 shadow-xl shadow-white/5">
                  <Plus size={18} className="mr-2" />
                  Novo Ativo
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] glass-premium border-white/10 text-white">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black">
                    Adicionar Ativo
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-400 uppercase text-[10px] font-black tracking-widest">
                        Ticker
                      </Label>
                      <Input
                        className="bg-white/5 border-white/10 h-12 rounded-xl focus:ring-indigo-500"
                        placeholder="AAPL34, BTC..."
                        value={formData.ticker}
                        onChange={(e) =>
                          setFormData({ ...formData, ticker: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-400 uppercase text-[10px] font-black tracking-widest">
                        Tipo
                      </Label>
                      <Select
                        value={formData.type}
                        onValueChange={(v) =>
                          setFormData({
                            ...formData,
                            type: v as Investment["type"],
                          })
                        }
                      >
                        <SelectTrigger className="bg-white/5 border-white/10 h-12 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-white/10 text-white">
                          <SelectItem value="stock">Ações / BDRs</SelectItem>
                          <SelectItem value="fii">FIIs</SelectItem>
                          <SelectItem value="crypto">Criptomoedas</SelectItem>
                          <SelectItem value="fixed_income">
                            Renda Fixa
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-400 uppercase text-[10px] font-black tracking-widest">
                      Nome do Ativo
                    </Label>
                    <Input
                      className="bg-white/5 border-white/10 h-12 rounded-xl"
                      placeholder="Ex: Apple Inc."
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-slate-400 uppercase text-[10px] font-black tracking-widest">
                          Qtd
                        </Label>
                        <Input
                          className="bg-white/5 border-white/10 h-12 rounded-xl"
                          type="number"
                          step="any"
                          value={formData.amount}
                          onChange={(e) =>
                            setFormData({ ...formData, amount: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-400 uppercase text-[10px] font-black tracking-widest">
                          Preço Médio
                        </Label>
                        <Input
                          className="bg-white/5 border-white/10 h-12 rounded-xl"
                          type="number"
                          step="0.01"
                          value={formData.averagePrice}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              averagePrice: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-400 uppercase text-[10px] font-black tracking-widest">
                        Alocação Alvo (%)
                      </Label>
                      <Input
                        className="bg-white/5 border-white/10 h-12 rounded-xl"
                        type="number"
                        placeholder="Ex: 10"
                        value={formData.targetAllocation}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            targetAllocation: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <DialogFooter className="pt-6">
                    <Button
                      type="submit"
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black h-14 rounded-2xl"
                    >
                      Salvar Ativo
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <motion.div
          variants={container}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 pt-12 border-t border-white/5"
        >
          {[
            { label: "Patrimônio", value: totalValue, type: "currency" },
            { 
              label: showRealGain ? "Lucro Real (Líquido)" : "Lucro Bruto", 
              value: showRealGain ? profit - (totalInvested * IPCA_ANUAL) : profit, 
              type: "profit" 
            },
            { 
              label: showRealGain ? "Rendimento Real" : "Performance", 
              value: showRealGain ? profitPercentage - (IPCA_ANUAL * 100) : profitPercentage, 
              type: "percent" 
            },
          ].map((stat, i) => (
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
              value="fiscal"
              className="px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-lg active:scale-95"
            >
              Fiscal
            </TabsTrigger>
          </TabsList>

          <TabsContent value="portfolio" className="mt-0 outline-none">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              {/* Allocation Chart */}
              <div className="premium-card p-8 lg:col-span-1 min-h-[450px]">
                <div className="flex items-center gap-2 mb-8">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                    <PieChart className="text-amber-400" size={16} />
                  </div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-widest">
                    Alocação
                  </h3>
                </div>
                <div className="h-[300px] relative">
                  {loading ? (
                    <div className="flex items-center justify-center h-full">
                      <Skeleton
                        variant="circular"
                        width={160}
                        height={160}
                        className="opacity-20"
                      />
                    </div>
                  ) : assets.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <RePieChart>
                        <Pie
                          data={allocationData}
                          cx="50%"
                          cy="50%"
                          innerRadius={75}
                          outerRadius={100}
                          paddingAngle={6}
                          dataKey="value"
                          stroke="none"
                        >
                          {allocationData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                              className="hover:opacity-80 transition-opacity cursor-pointer outline-none"
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "rgba(2, 4, 10, 0.8)",
                            backdropFilter: "blur(12px)",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            borderRadius: "1.25rem",
                            boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
                          }}
                          itemStyle={{ color: "#fff", fontWeight: "bold" }}
                          formatter={(value: number) => {
                            if (
                              localStorage.getItem(
                                "meu_contador_privacy_mode"
                              ) === "true"
                            )
                              return "****";
                            return formatCurrency(value);
                          }}
                        />
                      </RePieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 italic">
                      <Plus size={32} className="opacity-10 mb-4" />
                      <p className="text-xs font-medium">
                        Nenhum ativo cadastrado
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Asset List */}
              <div className="premium-card p-8 lg:col-span-2">
                <div className="flex items-center gap-2 mb-8">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <LineChart className="text-emerald-400" size={16} />
                  </div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-widest">
                    Seus Ativos
                  </h3>
                </div>
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {loading ? (
                    [...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-5">
                          <Skeleton
                            variant="rectangular"
                            width={56}
                            height={56}
                            className="rounded-2xl"
                          />
                          <div className="space-y-2">
                            <Skeleton width={120} height={20} />
                            <Skeleton width={80} height={12} />
                          </div>
                        </div>
                        <div className="space-y-2 text-right">
                          <Skeleton width={100} height={24} />
                          <Skeleton
                            width={60}
                            height={16}
                            className="ml-auto"
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <AnimatePresence>
                      {assets.map((asset) => {
                        const assetValue = asset.amount * asset.currentPrice;
                        const assetProfit =
                          asset.averagePrice > 0
                            ? ((asset.currentPrice - asset.averagePrice) /
                                asset.averagePrice) *
                              100
                            : 0;

                        return (
                          <motion.div
                            layout
                            key={asset.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="group p-5 rounded-3xl bg-white/[0.03] hover:bg-white/[0.06] transition-all border border-white/5 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-5">
                              <div className="w-14 h-14 rounded-2xl bg-white/[0.05] flex items-center justify-center text-white font-black text-xs border border-white/10 group-hover:border-indigo-500/40 group-hover:bg-indigo-500/5 transition-all">
                                {asset.ticker}
                              </div>
                              <div>
                                <h4 className="font-bold text-white group-hover:text-indigo-400 transition-colors">
                                  {asset.name}
                                </h4>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                                  {asset.amount} cotas •{" "}
                                  {asset.type.toUpperCase()}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-8">
                              <div className="text-right">
                                <div className="font-black text-white text-lg tracking-tight">
                                  <PrivacyValue value={assetValue} />
                                </div>
                                <div
                                  className={`text-xs font-bold ${
                                    assetProfit >= 0
                                      ? "text-emerald-400"
                                      : "text-rose-400"
                                  }`}
                                >
                                  {assetProfit >= 0 ? "+" : ""}
                                  {assetProfit.toFixed(2)}%
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="opacity-0 group-hover:opacity-100 rounded-xl bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 px-4 h-10 font-bold text-[10px] uppercase tracking-widest"
                                      onClick={() => {
                                        setSellAssetId(asset.id);
                                        setSellPrice(asset.currentPrice.toString());
                                      }}
                                    >
                                      Vender
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="glass-premium border-white/10 text-white">
                                    <DialogHeader>
                                      <DialogTitle className="text-xl font-black">
                                        Vender {asset.ticker}
                                      </DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 pt-4">
                                      <div className="space-y-2">
                                        <Label className="text-slate-400 uppercase text-[10px] font-black tracking-widest">
                                          Quantidade (Disponível: {asset.amount})
                                        </Label>
                                        <Input
                                          type="number"
                                          className="bg-white/5 h-12 rounded-xl"
                                          value={sellAmount}
                                          onChange={(e) => setSellAmount(e.target.value)}
                                          max={asset.amount}
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
                                        className="w-full h-14 rounded-2xl bg-amber-600 hover:bg-amber-500 font-black"
                                        onClick={() => {
                                          addSale({
                                            assetId: asset.id,
                                            assetTicker: asset.ticker,
                                            type: asset.type as any,
                                            amount: parseFloat(sellAmount),
                                            price: parseFloat(sellPrice),
                                            date: new Date().toISOString(),
                                          });
                                          setSellAmount("");
                                          setSellAssetId(null);
                                        }}
                                      >
                                        Confirmar Venda
                                      </Button>
                                    </div>
                                  </DialogContent>
                                </Dialog>

                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="opacity-0 group-hover:opacity-100 w-10 h-10 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 active:scale-90 transition-all"
                                  onClick={() => deleteAsset(asset.id)}
                                >
                                  <Trash2 size={16} />
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="dividends" className="mt-0 outline-none">
            <DividendList />
          </TabsContent>

          <TabsContent value="rebalance" className="mt-0 outline-none">
            {/* ... (keeping existing rebalance content) */}
          </TabsContent>

          <TabsContent value="fiscal" className="mt-0 outline-none">
            <div className="premium-card p-8 md:p-10 space-y-10">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight">
                    Inteligência <span className="text-indigo-400">Fiscal</span> 🇧🇷
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Monitoramento de impostos e limites de isenção.
                  </p>
                </div>
              </div>

              {getTaxIndicators().length === 0 ? (
                <div className="text-center py-20 text-slate-500">
                  <Briefcase size={48} className="mx-auto mb-4 opacity-10" />
                  <p>Nenhuma venda de ações registrada este mês.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {getTaxIndicators().map((indicator) => (
                    <div key={indicator.month} className="p-8 rounded-[40px] bg-white/[0.03] border border-white/5 space-y-6">
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
                            {formatCurrency(indicator.totalStockSales)} <span className="text-slate-600">/ R$ 20k</span>
                          </p>
                        </div>
                        <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((indicator.totalStockSales / 20000) * 100, 100)}%` }}
                            className={`h-full transition-all ${indicator.isOverLimit ? 'bg-rose-500' : indicator.totalStockSales > 15000 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          />
                        </div>
                      </div>

                      <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Imposto Estimado (Swing)</p>
                          <p className={`text-xl font-black ${indicator.isOverLimit ? 'text-rose-400' : 'text-slate-500'}`}>
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
                  { title: "FIIs", desc: "Isentos no dividendo, mas pagam 20% sobre lucro na venda (qualquer valor).", color: "text-amber-400" },
                  { title: "Day Trade", desc: "Alíquota fixa de 20% sobre o lucro líquido. Não há isenção de R$ 20k.", color: "text-rose-400" },
                  { title: "Cripto", desc: "Isenção de até R$ 35k em vendas mensais (exceto para lucro no exterior).", color: "text-indigo-400" }
                ].map((item) => (
                  <div key={item.title} className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 flex items-start gap-4">
                    <div className="mt-1 w-2 h-2 rounded-full bg-white/20 shrink-0" />
                    <div>
                      <h4 className={`text-xs font-black uppercase tracking-widest mb-1 ${item.color}`}>{item.title}</h4>
                      <p className="text-[10px] text-slate-400 leading-relaxed font-medium">{item.desc}</p>
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
