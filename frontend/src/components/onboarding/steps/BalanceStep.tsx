import { useOnboarding } from "../OnboardingContext";
import { Check, CreditCard, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";

export const BalanceStep = () => {
  const { profile, handleProfileChange: onChange, validationErrors } = useOnboarding();

  return (
  <div className="space-y-8 pt-6">
    <div className="space-y-2 text-center">
      <h2 className="text-3xl font-bold">Seu Ponto de Partida</h2>
      <p className="text-white/50">Quanto você tem disponível hoje (contas + investimentos)?</p>
    </div>

    <div className="space-y-6">
      <div className="relative group">
        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-bold text-white/30">R$</div>
        <Input type="number" value={profile.initialBalance || ""} onChange={(e) => onChange("initialBalance", parseFloat(e.target.value) || 0)} aria-invalid={!!validationErrors.initialBalance} className={`h-24 pl-16 bg-white/5 border-white/10 rounded-[2.5rem] text-4xl font-black focus:bg-white/10 transition-all border-dashed ${validationErrors.initialBalance ? "border-rose-500/60" : ""}`} placeholder="0,00" />
      </div>
      {validationErrors.initialBalance && <p className="text-rose-400 text-xs font-medium" role="alert">{validationErrors.initialBalance}</p>}
      <div className="grid grid-cols-2 gap-4">
        <div role="button" tabIndex={0} aria-pressed={profile.hasEmergencyFund} aria-label="Marcar se possui reserva de emergência" onKeyDown={(e) => e.key === "Enter" && onChange("hasEmergencyFund", !profile.hasEmergencyFund)} className={`p-6 rounded-3xl border transition-all cursor-pointer ${profile.hasEmergencyFund ? "bg-emerald-500/20 border-emerald-500/50" : "bg-white/5 border-white/10"}`} onClick={() => onChange("hasEmergencyFund", !profile.hasEmergencyFund)}>
          <Shield className={profile.hasEmergencyFund ? "text-emerald-400" : "text-white/20"} />
          <p className="mt-3 font-bold text-sm">Tenho Reserva de Emergência</p>
        </div>
        <div role="button" tabIndex={0} aria-pressed={profile.hasDebts} aria-label="Marcar se possui dívidas atuais" onKeyDown={(e) => e.key === "Enter" && onChange("hasDebts", !profile.hasDebts)} className={`p-6 rounded-3xl border transition-all cursor-pointer ${profile.hasDebts ? "bg-rose-500/20 border-rose-500/50" : "bg-white/5 border-white/10"}`} onClick={() => onChange("hasDebts", !profile.hasDebts)}>
          <CreditCard className={profile.hasDebts ? "text-rose-400" : "text-white/20"} />
          <p className="mt-3 font-bold text-sm">Possuo Dívidas Atuais</p>
        </div>
      </div>
    </div>

    <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0"><span className="text-xl">🏦</span></div>
        <div>
          <p className="font-bold text-sm">Conectar meu banco automaticamente</p>
          <p className="text-xs text-white/50">Pré-selecione seu banco para concluir a conexão depois, em ambiente seguro.</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {["Nubank", "Itaú", "Bradesco", "Bb", "Caixa", "Inter"].map((bank) => (
          <button key={bank} type="button" onClick={() => onChange("openFinanceBank", bank)} className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${profile.openFinanceBank === bank ? "bg-blue-600/20 border-blue-500 text-white" : "bg-white/5 border-white/10 text-white/60 hover:border-white/20"}`}>{bank}</button>
        ))}
      </div>
      {profile.openFinanceBank ? <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold"><Check size={14} /> Banco pré-selecionado — você poderá conectar após concluir o setup</div> : <p className="text-[10px] text-white/30 text-center">Opcional — você pode conectar depois ou lançar manualmente</p>}
    </div>
  </div>
);
};
