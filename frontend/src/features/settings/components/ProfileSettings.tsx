import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { UserProfile } from "@/types";
import { User as LucideUser } from "lucide-react";

interface Props {
  profile: Partial<UserProfile>;
  onChange: (profile: Partial<UserProfile>) => void;
}

export const ProfileSettings = ({ profile, onChange }: Props) => {
  return (
    <div className="premium-card">
      <div className="p-6 md:p-8 flex items-center gap-4 border-b border-white/5 mb-8">
        <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
          <LucideUser size={20} />
        </div>
        <h3 className="text-lg font-black uppercase tracking-widest text-white">
          Perfil <span className="text-indigo-400">Pessoal</span>
        </h3>
      </div>
      <div className="p-6 md:p-8 pt-0 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
              Nome Completo
            </Label>
            <Input
              value={profile.name || ""}
              onChange={(e) => onChange({ ...profile, name: e.target.value })}
              className="h-14 bg-white/5 border-white/10 rounded-2xl focus:ring-indigo-500/20 focus:border-indigo-500/30 text-white font-medium px-6"
              placeholder="Como devemos te chamar?"
            />
          </div>
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
              Renda Mensal (Base)
            </Label>
            <Input
              type="number"
              value={profile.monthlyIncome || ""}
              onChange={(e) =>
                onChange({
                  ...profile,
                  monthlyIncome: Number(e.target.value),
                })
              }
              className="h-14 bg-white/5 border-white/10 rounded-2xl focus:ring-indigo-500/20 focus:border-indigo-500/30 text-white font-medium px-6"
              placeholder="R$ 0,00"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
