import { useOnboarding } from "../OnboardingContext";
import { Building2, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const BusinessStep = () => {
  const { profile, handleProfileChange: onChange, validationErrors } = useOnboarding();

  return (
  <div className="space-y-8 pt-6">
    <div className="space-y-2">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
          <Building2 size={20} className="text-indigo-400" />
        </div>
        <div>
          <h2 className="text-3xl font-bold">Sua Empresa</h2>
          <p className="text-white/50 text-sm">Dados do seu CNPJ para separar finanças PJ/PF</p>
        </div>
      </div>
    </div>

    <div className="space-y-5">
      <div className="space-y-3">
        <Label className="text-indigo-400 font-bold uppercase tracking-widest text-[10px]">Nome da Empresa</Label>
        <Input value={profile.businessName || ""} onChange={(e) => onChange("businessName", e.target.value)} placeholder="Ex: João Silva MEI" aria-invalid={!!validationErrors.businessName} className={`h-14 bg-white/5 border-white/10 rounded-2xl text-base font-semibold ${validationErrors.businessName ? "border-rose-500/60" : ""}`} />
        {validationErrors.businessName && <p className="text-rose-400 text-xs font-medium" role="alert">{validationErrors.businessName}</p>}
      </div>
      <div className="space-y-3">
        <Label className="text-indigo-400 font-bold uppercase tracking-widest text-[10px]">CNPJ</Label>
        <Input value={profile.businessCnpj || ""} onChange={(e) => {
          const raw = e.target.value.replace(/\D/g, "").slice(0, 14);
          const masked = raw.replace(/^(\d{2})(\d)/, "$1.$2").replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3").replace(/\.(\d{3})(\d)/, ".$1/$2").replace(/(\d{4})(\d)/, "$1-$2");
          onChange("businessCnpj", masked);
        }} placeholder="00.000.000/0000-00" aria-invalid={!!validationErrors.businessCnpj} className={`h-14 bg-white/5 border-white/10 rounded-2xl text-base font-mono font-semibold tracking-wider ${validationErrors.businessCnpj ? "border-rose-500/60" : ""}`} />
        {validationErrors.businessCnpj && <p className="text-rose-400 text-xs font-medium" role="alert">{validationErrors.businessCnpj}</p>}
      </div>
    </div>

    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs text-emerald-300 flex gap-3">
      <Shield size={18} className="shrink-0 mt-0.5" />
      <p>Seus dados de CNPJ são usados <strong>apenas internamente</strong> para separar as transações PJ das pessoais no seu painel.</p>
    </div>
  </div>
);
};
