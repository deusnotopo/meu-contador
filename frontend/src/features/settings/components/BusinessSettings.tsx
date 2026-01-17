import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserProfile } from "@/types";
import { Building2 } from "lucide-react";

interface Props {
  profile: Partial<UserProfile>;
  onChange: (profile: Partial<UserProfile>) => void;
}

export const BusinessSettings = ({ profile, onChange }: Props) => {
  return (
    <div className="premium-card">
      <div className="p-6 md:p-8 flex items-center gap-4 border-b border-white/5 mb-8">
        <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500">
          <Building2 size={20} />
        </div>
        <h3 className="text-lg font-black uppercase tracking-widest text-white">
          Dados da <span className="text-amber-500">Empresa</span>
        </h3>
      </div>
      <div className="p-6 md:p-8 pt-0 space-y-8">
        <div className="space-y-3">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
            Razão Social / Nome Fantasia
          </Label>
          <Input
            value={profile.businessName || ""}
            onChange={(e) =>
              onChange({
                ...profile,
                businessName: e.target.value,
              })
            }
            className="h-14 bg-white/5 border-white/10 rounded-2xl focus:ring-amber-500/20 focus:border-amber-500/30 text-white font-medium px-6"
            placeholder="Nome Fantasia da Empresa"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
              Setor de Atuação
            </Label>
            <Input
              value={profile.businessSector || ""}
              onChange={(e) =>
                onChange({
                  ...profile,
                  businessSector: e.target.value,
                })
              }
              className="h-14 bg-white/5 border-white/10 rounded-2xl focus:ring-amber-500/20 focus:border-amber-500/30 text-white font-medium px-6"
              placeholder="Ex: Consultoria, Varejo..."
            />
          </div>
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
              CNPJ
            </Label>
            <Input
              value={profile.businessCnpj || ""}
              onChange={(e) =>
                onChange({
                  ...profile,
                  businessCnpj: e.target.value,
                })
              }
              className="h-14 bg-white/5 border-white/10 rounded-2xl focus:ring-amber-500/20 focus:border-amber-500/30 text-white font-medium px-6"
              placeholder="00.000.000/0001-00"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
