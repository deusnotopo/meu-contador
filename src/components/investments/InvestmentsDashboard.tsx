import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Investment } from "@/types";
import { formatCurrency } from "@/lib/formatters";
import { ArrowUpRight, Bitcoin, Briefcase, DollarSign, LineChart, PieChart, RefreshCcw, TrendingUp } from "lucide-react";
import { useState } from "react";
import { Cell, Pie, PieChart as RePieChart, ResponsiveContainer, Tooltip } from "recharts";

// Mock Data for Demo
const MOCK_ASSETS: Investment[] = [
  { id: 1, name: "Apple Inc.", ticker: "AAPL34", type: "stock", amount: 10, averagePrice: 45.00, currentPrice: 52.30, sector: "Tecnologia", lastUpdate: "2024-01-10" },
  { id: 2, name: "Fundo Imob. Kinea", ticker: "KNIP11", type: "fii", amount: 50, averagePrice: 92.50, currentPrice: 94.20, sector: "Papel", lastUpdate: "2024-01-12" },
  { id: 3, name: "Bitcoin", ticker: "BTC", type: "crypto", amount: 0.005, averagePrice: 200000, currentPrice: 350000, sector: "Cripto", lastUpdate: "2024-01-12" },
  { id: 4, name: "Tesouro Selic", ticker: "SELIC2029", type: "fixed_income", amount: 2, averagePrice: 12000, currentPrice: 12500, sector: "Público", lastUpdate: "2024-01-10" },
];

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

export const InvestmentsDashboard = () => {
    const [assets, setAssets] = useState<Investment[]>(MOCK_ASSETS);
    const [isLoading, setIsLoading] = useState(false);

    const totalInvested = assets.reduce((acc, curr) => acc + (curr.amount * curr.averagePrice), 0);
    const totalValue = assets.reduce((acc, curr) => acc + (curr.amount * curr.currentPrice), 0);
    const profit = totalValue - totalInvested;
    const profitPercentage = (profit / totalInvested) * 100;

    const allocationData = assets.map(asset => ({
        name: asset.ticker,
        value: asset.amount * asset.currentPrice
    }));

    const handleRefresh = () => {
        setIsLoading(true);
        // Simulate API call
        setTimeout(() => setIsLoading(false), 1500);
    };

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            {/* Header / Summary */}
             <div className="relative overflow-hidden p-8 rounded-[2.5rem] glass-premium group border border-white/10">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-transparent to-transparent opacity-50" />
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                         <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-black uppercase tracking-widest text-amber-400 mb-2">
                            <Briefcase size={12} />
                            Carteira de Ativos
                         </div>
                         <h2 className="text-4xl font-black text-white tracking-tighter">
                            Meus <span className="text-amber-400 text-glow-amber">Investimentos</span>
                         </h2>
                         <p className="text-slate-400 font-medium">Patrimônio acumulado em renda variável e fixa.</p>
                    </div>

                    <Button 
                        onClick={handleRefresh}
                        className="bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl h-12 px-6"
                        disabled={isLoading}
                    >
                        <RefreshCcw size={18} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Atualizar Cotações
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                    <div className="p-6 bg-black/20 rounded-2xl border border-white/5">
                        <p className="text-xs text-slate-500 font-black uppercase tracking-widest mb-1">Patrimônio Total</p>
                        <div className="text-3xl font-black text-white tracking-tight">
                            {formatCurrency(totalValue)}
                        </div>
                    </div>
                    <div className="p-6 bg-black/20 rounded-2xl border border-white/5">
                        <p className="text-xs text-slate-500 font-black uppercase tracking-widest mb-1">Lucro / Prejuízo</p>
                        <div className={`text-3xl font-black tracking-tight ${profit >= 0 ? 'text-emerald-400 text-glow-emerald' : 'text-rose-400'}`}>
                            {profit >= 0 ? '+' : ''}{formatCurrency(profit)}
                        </div>
                    </div>
                     <div className="p-6 bg-black/20 rounded-2xl border border-white/5">
                        <p className="text-xs text-slate-500 font-black uppercase tracking-widest mb-1">Rentabilidade</p>
                        <div className={`text-3xl font-black tracking-tight ${profitPercentage >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {profitPercentage.toFixed(2)}%
                        </div>
                    </div>
                </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Allocation Chart */}
                <Card className="glass border-white/5 rounded-[2.5rem] p-6 lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                            <PieChart className="text-indigo-400" size={20} />
                            Alocação
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <RePieChart>
                                <Pie
                                    data={allocationData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {allocationData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#02040a', borderColor: '#1f2937', borderRadius: '1rem' }}
                                    itemStyle={{ color: '#fff' }}
                                    formatter={(value: number) => formatCurrency(value)}
                                />
                            </RePieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Asset List */}
                <Card className="glass border-white/5 rounded-[2.5rem] p-6 lg:col-span-2">
                    <CardHeader>
                         <CardTitle className="flex items-center gap-2 text-white">
                            <LineChart className="text-emerald-400" size={20} />
                            Seus Ativos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {assets.map((asset) => {
                                const assetValue = asset.amount * asset.currentPrice;
                                const assetProfit = (asset.currentPrice - asset.averagePrice) / asset.averagePrice * 100;
                                
                                return (
                                    <div key={asset.id} className="group p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs">
                                                {asset.ticker}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-white">{asset.name}</h4>
                                                <p className="text-xs text-slate-400">{asset.amount} cotas • {asset.type.toUpperCase()}</p>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <div className="font-black text-white">{formatCurrency(assetValue)}</div>
                                            <div className={`text-xs font-bold ${assetProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {assetProfit >= 0 ? '+' : ''}{assetProfit.toFixed(2)}%
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
             </div>
        </div>
    );
};
