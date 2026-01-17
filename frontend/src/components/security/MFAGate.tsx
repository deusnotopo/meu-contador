import { ReactNode } from "react";
import { MFAService } from "@/lib/mfa-service";
import { ShieldAlert, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MFAGateProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * A component that protects its children with MFA check.
 * If MFA is not enabled, shows a security warning/upgrade path.
 */
export const MFAGate = ({ children, fallback }: MFAGateProps) => {
  const isEnabled = MFAService.isEnabled();

  if (!isEnabled) {
    return fallback || (
      <div className="relative overflow-hidden p-8 rounded-[2.5rem] bg-slate-950 border border-white/5 text-center space-y-6">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />
        
        <div className="relative z-10 space-y-4">
          <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 mx-auto border border-indigo-500/20">
            <Lock size={32} />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-black text-white uppercase tracking-tight">
              Acesso <span className="text-indigo-400">Restrito</span>
            </h3>
            <p className="text-sm text-slate-400 font-medium max-w-xs mx-auto">
              Esta funcionalidade requer **Autenticação de Dois Fatores (MFA)** ativada para sua segurança.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              className="bg-white text-black font-black uppercase tracking-widest rounded-xl hover:bg-white/90"
              onClick={() => (window.location.hash = "#profile")}
            >
              Ativar MFA no Perfil
            </Button>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              Proteção Bancária Ativada
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
