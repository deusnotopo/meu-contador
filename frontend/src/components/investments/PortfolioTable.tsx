import { Button } from "@/components/ui/button";
import type { Investment } from "@/types";
import { ArrowUpRight, Edit2, MoreHorizontal, Trash2 } from "lucide-react";
import { PrivacyValue } from "../ui/PrivacyValue";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Props {
  assets: Investment[];
  onDelete: (id: string) => void;
  onEdit: (asset: Investment) => void;
  onSell: (asset: Investment) => void;
  isViewer?: boolean;
}

export const PortfolioTable = ({ assets, onDelete, onEdit, onSell, isViewer }: Props) => {
  const totalPortfolioValue = assets.reduce(
    (acc, asset) => acc + asset.amount * asset.currentPrice,
    0
  );

  return (
    <div className="w-full overflow-hidden rounded-3xl border border-white/5 bg-white/[0.02]">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 bg-white/5 text-[10px] uppercase tracking-widest text-slate-400 font-bold">
              <th className="p-4 whitespace-nowrap">Instrumento</th>
              <th className="p-4 text-right whitespace-nowrap">Qtd.</th>
              <th className="p-4 text-right whitespace-nowrap">Preço Médio</th>
              <th className="p-4 text-right whitespace-nowrap">Preço Atual</th>
              <th className="p-4 text-right whitespace-nowrap">Saldo Total</th>
              <th className="p-4 text-center whitespace-nowrap">Rentabilidade</th>
              <th className="p-4 text-right whitespace-nowrap">% Cart.</th>
              {!isViewer && <th className="p-4 text-right whitespace-nowrap">Ações</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {assets.map((asset) => {
              const totalValue = asset.amount * asset.currentPrice;
              const profit =
                asset.averagePrice > 0
                  ? ((asset.currentPrice - asset.averagePrice) /
                      asset.averagePrice) *
                    100
                  : 0;
              const share =
                totalPortfolioValue > 0
                  ? (totalValue / totalPortfolioValue) * 100
                  : 0;

              return (
                <tr
                  key={asset.id}
                  className="group hover:bg-white/[0.04] transition-colors"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-[10px] font-black text-indigo-400 border border-indigo-500/20">
                        {asset.ticker}
                      </div>
                      <div>
                        <div className="font-bold text-white text-sm">
                          {asset.name}
                        </div>
                        <div className="text-[10px] text-slate-500 uppercase">
                          {asset.type}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-right font-medium text-slate-300">
                    {asset.amount}
                  </td>
                  <td className="p-4 text-right font-medium text-slate-300">
                    <PrivacyValue
                      value={asset.averagePrice}
                      currency={asset.currency}
                    />
                  </td>
                  <td className="p-4 text-right font-bold text-white">
                    <PrivacyValue
                      value={asset.currentPrice}
                      currency={asset.currency}
                    />
                  </td>
                  <td className="p-4 text-right font-black text-white">
                    <PrivacyValue
                      value={totalValue}
                      currency={asset.currency}
                    />
                  </td>
                  <td className="p-4 text-center">
                    <div
                      className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${
                        profit >= 0
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-rose-500/10 text-rose-400"
                      }`}
                    >
                      {profit >= 0 ? "+" : ""}
                      {profit.toFixed(2)}%
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <span className="text-xs font-bold text-slate-400">{share.toFixed(1)}%</span>
                       <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                           <div className="h-full bg-indigo-500" style={{ width: `${share}%` }} />
                       </div>
                    </div>
                  </td>
                  {!isViewer && (
                    <td className="p-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="w-8 h-8 text-slate-400 hover:text-white">
                              <MoreHorizontal size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#02040a] border border-white/10 text-white z-[100]">
                            <DropdownMenuItem onClick={() => onSell(asset)} className="focus:bg-white/10 cursor-pointer">
                                <ArrowUpRight size={14} className="mr-2" /> Vender / Baixar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEdit(asset)} className="focus:bg-white/10 cursor-pointer">
                                <Edit2 size={14} className="mr-2" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDelete(asset.id)} className="text-rose-400 focus:bg-rose-500/10 focus:text-rose-400 cursor-pointer">
                                <Trash2 size={14} className="mr-2" /> Excluir
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
