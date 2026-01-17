import { Button } from "@/components/ui/button";
import { showSuccess } from "@/lib/toast";
import { Bell, Smartphone } from "lucide-react";

export const MobileSettings = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="premium-card bg-emerald-500/[0.02] border-emerald-500/10">
        <div className="p-8 space-y-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400">
              <Smartphone size={24} />
            </div>
            <h4 className="text-sm font-black uppercase tracking-widest text-white">
              App Mobile
            </h4>
          </div>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            Instale o Meu Contador na tela de início para acesso instantâneo e
            offline.
          </p>
          <Button
            onClick={() => alert("Menu -> Adicionar à Tela de Início")}
            className="w-full h-12 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-widest transition-all text-[10px]"
          >
            Instalar App
          </Button>
        </div>
      </div>

      <div className="premium-card bg-amber-500/[0.02] border-amber-500/10">
        <div className="p-8 space-y-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-500">
              <Bell size={24} />
            </div>
            <h4 className="text-sm font-black uppercase tracking-widest text-white">
              Alertas PRO
            </h4>
          </div>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            Receba avisos de vencimentos e insights de IA direto no seu
            navegador.
          </p>
          <Button
            onClick={async () => {
              if ("Notification" in window) {
                const permission = await Notification.requestPermission();
                if (permission === "granted") showSuccess("Notificações ON!");
              }
            }}
            className="w-full h-12 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-widest transition-all text-[10px]"
          >
            Ativar Alertas
          </Button>
        </div>
      </div>
    </div>
  );
};
