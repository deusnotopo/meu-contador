import { Shield } from "lucide-react";
import { MFASetup } from "@/components/security/MFASetup";

export const SecuritySettings = () => {
  return (
    <div className="premium-card animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="p-6 md:p-8 flex items-center gap-4 border-b border-white/5 mb-8">
        <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
          <Shield size={20} />
        </div>
        <h3 className="text-lg font-black uppercase tracking-widest text-white">
          Centro de <span className="text-indigo-400">Privacidade</span>
        </h3>
      </div>
      <div className="p-6 md:p-8 pt-0 space-y-6 px-10">
        <p className="text-sm text-slate-400 leading-relaxed font-medium">
          Seus dados financeiros permanecem sob seu controle. A sincronização em
          nuvem é opcional e utiliza criptografia de ponta a ponta.
        </p>
        <div className="py-6 border-y border-white/5">
          <div className="flex items-center justify-between mb-6">
            <span className="text-xs font-black uppercase tracking-widest text-white">
              Mascarar Valores Automático
            </span>
            <div className="h-6 w-12 rounded-full bg-slate-800 flex items-center px-1 opacity-50 cursor-not-available">
              <div className="w-4 h-4 bg-white/20 rounded-full" />
            </div>
          </div>

          <MFASetup />
        </div>

        <Button
          variant="outline"
          className="w-full h-12 rounded-xl border-white/10 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/5 transition-all"
        >
          Auditar Histórico de Acesso
        </Button>
      </div>
    </div>
  );
};
