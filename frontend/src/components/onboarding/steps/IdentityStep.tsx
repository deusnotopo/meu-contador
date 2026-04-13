import { useOnboarding } from "../OnboardingContext";
import { Briefcase, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectCard } from "../StepCards";

export const IdentityStep = () => {
  const { profile, handleProfileChange: onChange, validationErrors } = useOnboarding();

  return (
  <div className="space-y-8 pt-6">
    <div className="space-y-2">
      <h2 className="text-3xl font-bold">Quem é você?</h2>
      <p className="text-white/50">Esses dados personalizam sua estratégia financeira.</p>
    </div>

    <div className="space-y-4">
      <Label className="text-indigo-400 font-bold uppercase tracking-widest text-[10px]">Seu Nome ou Apelido</Label>
      <Input value={profile.name} onChange={(e) => onChange("name", e.target.value)} placeholder="Ex: João Silva" aria-invalid={!!validationErrors.name} className={`h-16 bg-white/5 border-white/10 rounded-2xl text-xl font-bold focus:ring-2 ring-indigo-500/50 transition-all ${validationErrors.name ? "border-rose-500/60 ring-rose-500/30" : ""}`} />
      {validationErrors.name && <p className="text-rose-400 text-xs font-medium" role="alert">{validationErrors.name}</p>}
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-4">
        <Label className="text-indigo-400 font-bold uppercase tracking-widest text-[10px]">Sua Idade</Label>
        <Input type="number" value={profile.age || ""} onChange={(e) => onChange("age", parseInt(e.target.value) || 0)} aria-invalid={!!validationErrors.age} className={`h-16 bg-white/5 border-white/10 rounded-2xl text-2xl font-black text-center ${validationErrors.age ? "border-rose-500/60" : ""}`} />
        {validationErrors.age && <p className="text-rose-400 text-xs font-medium" role="alert">{validationErrors.age}</p>}
      </div>
      <div className="space-y-4">
        <Label className="text-indigo-400 font-bold uppercase tracking-widest text-[10px]">Dependentes</Label>
        <Input type="number" value={profile.dependents?.toString() || ""} onChange={(e) => onChange("dependents", parseInt(e.target.value) || 0)} aria-invalid={!!validationErrors.dependents} className={`h-16 bg-white/5 border-white/10 rounded-2xl text-2xl font-black text-center ${validationErrors.dependents ? "border-rose-500/60" : ""}`} />
        {validationErrors.dependents && <p className="text-rose-400 text-xs font-medium" role="alert">{validationErrors.dependents}</p>}
      </div>
    </div>

    <div className="space-y-4">
      <Label className="text-indigo-400 font-bold uppercase tracking-widest text-[10px]">Sua Situação</Label>
      <div className="grid grid-cols-2 gap-4">
        <SelectCard active={profile.employmentType === "clt"} onClick={() => onChange("employmentType", "clt")} icon={Briefcase} label="CLT / Funcional" sub="Estabilidade e FGTS" />
        <SelectCard active={profile.employmentType === "pj"} onClick={() => onChange("employmentType", "pj")} icon={Building2} label="PJ / Empresário" sub="Lucro e blindagem" />
      </div>
    </div>
  </div>
);
};
