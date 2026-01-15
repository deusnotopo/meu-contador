import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useInvestments } from "@/hooks/useInvestments";
import { BarChart3, DollarSign, Plus, Trash2, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { PrivacyValue } from "../ui/PrivacyValue";

export const DividendList = () => {
  const { assets, dividends, addDividend, deleteDividend } = useInvestments();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    assetId: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    type: "dividend" as "dividend" | "jcp",
  });

  const totalDividends = useMemo(
    () => dividends.reduce((acc, curr) => acc + curr.amount, 0),
    [dividends]
  );

  const portfolioYield = useMemo(() => {
    const totalInvested = assets.reduce(
      (acc, curr) => acc + curr.amount * curr.averagePrice,
      0
    );
    if (totalInvested <= 0) return "0.00";
    return ((totalDividends / totalInvested) * 100).toFixed(2);
  }, [assets, totalDividends]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const assetId = parseInt(formData.assetId);
    const amount = parseFloat(formData.amount.replace(",", "."));

    const selectedAsset = assets.find((a) => a.id === assetId);

    if (!selectedAsset || isNaN(amount) || amount <= 0) return;

    addDividend({
      assetId,
      assetTicker: selectedAsset.ticker,
      amount,
      date: formData.date,
      type: formData.type,
    });

    setIsOpen(false);
    setFormData({
      assetId: "",
      amount: "",
      date: new Date().toISOString().split("T")[0],
      type: "dividend",
    });
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="glass border-white/5 bg-gradient-to-br from-emerald-500/10 to-transparent">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-400">
                <DollarSign size={24} />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                  Total Recebido
                </p>
                <div className="text-2xl font-black text-white">
                  <PrivacyValue value={totalDividends} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-white/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400">
                <TrendingUp size={24} />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                  Yield da Carteira
                </p>
                <div className="text-2xl font-black text-white">
                  {portfolioYield}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card className="glass border-white/5">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white">
            <BarChart3 className="text-emerald-400" size={20} />
            Calendário de Proventos
          </CardTitle>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-500 text-white border-0"
              >
                <Plus size={16} className="mr-2" />
                Novo Provento
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar Provento</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Ativo</Label>
                  <Select
                    value={formData.assetId}
                    onValueChange={(v) =>
                      setFormData({ ...formData, assetId: v })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o ativo" />
                    </SelectTrigger>
                    <SelectContent>
                      {assets.map((asset) => (
                        <SelectItem key={asset.id} value={asset.id.toString()}>
                          {asset.ticker} - {asset.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Valor (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData({ ...formData, amount: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Data</Label>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) =>
                        setFormData({ ...formData, date: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(v: "dividend" | "jcp") =>
                      setFormData({ ...formData, type: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dividend">Dividendo</SelectItem>
                      <SelectItem value="jcp">JCP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <DialogFooter className="pt-4">
                  <Button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-500"
                  >
                    Salvar
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {dividends.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              <DollarSign size={48} className="mx-auto mb-4 opacity-20" />
              <p>Nenhum provento registrado ainda.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(
                dividends.reduce((acc, curr) => {
                  const date = new Date(curr.date);
                  // Ensure date parsing works correctly with timezone or simple string split
                  // Assuming YYYY-MM-DD string, splitting is safer for local display without timezone shifts
                  const [year, month] = curr.date.split("-");
                  const key = `${year}-${month}`;
                  if (!acc[key]) acc[key] = [];
                  acc[key].push(curr);
                  return acc;
                }, {} as Record<string, typeof dividends>)
              )
                .sort((a, b) => b[0].localeCompare(a[0])) // Sort months desc
                .map(([monthKey, monthDividends]) => {
                  const [year, month] = monthKey.split("-");
                  const monthName = new Date(
                    parseInt(year),
                    parseInt(month) - 1
                  ).toLocaleString("pt-BR", { month: "long", year: "numeric" });

                  const monthTotal = monthDividends.reduce(
                    (sum, d) => sum + d.amount,
                    0
                  );

                  return (
                    <div key={monthKey} className="space-y-3">
                      <div className="flex items-center justify-between px-2">
                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                          {monthName}
                        </h4>
                        <span className="text-emerald-400 font-bold text-sm">
                          + <PrivacyValue value={monthTotal} />
                        </span>
                      </div>
                      <div className="space-y-3 pl-2 border-l-2 border-white/5 ml-3">
                        {monthDividends
                          .sort(
                            (a, b) =>
                              new Date(b.date).getTime() -
                              new Date(a.date).getTime()
                          )
                          .map((dividend) => (
                            <div
                              key={dividend.id}
                              className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl group hover:bg-white/10 transition-colors ml-4"
                            >
                              <div className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-[10px]">
                                  {dividend.assetTicker}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-white text-sm uppercase">
                                      {dividend.type === "jcp"
                                        ? "JCP"
                                        : "Dividendo"}
                                    </span>
                                    <span className="text-slate-500 text-[10px]">
                                      {new Date(
                                        dividend.date + "T12:00:00"
                                      ).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-4">
                                <span className="font-bold text-emerald-400 text-sm">
                                  <PrivacyValue value={dividend.amount} />
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400"
                                  onClick={() => deleteDividend(dividend.id)}
                                >
                                  <Trash2 size={14} />
                                </Button>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const indicators = {
  yield: 0, // Placeholder
};
