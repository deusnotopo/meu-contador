import { Button } from "@/components/ui/button";
import { resetOnboarding } from "@/lib/onboarding";
import { exportFullBackup, importFullBackup } from "@/lib/storage";
import { showError, showSuccess } from "@/lib/toast";
import { Database, Download, Upload } from "lucide-react";

export const DataSettings = () => {
  const handleReset = () => {
    if (
      confirm(
        "Isso apagará todos os seus dados e voltará para o Onboarding. Tem certeza?"
      )
    ) {
      resetOnboarding();
      window.location.reload();
    }
  };

  return (
    <div className="premium-card animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="p-6 md:p-8 flex items-center gap-4 border-b border-white/5 mb-8">
        <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400">
          <Database size={20} />
        </div>
        <h3 className="text-lg font-black uppercase tracking-widest text-white">
          Centro de <span className="text-blue-400">Dados</span>
        </h3>
      </div>
      <div className="p-6 md:p-8 pt-0 space-y-8">
        <div className="p-6 rounded-2xl bg-blue-500/5 border border-blue-500/10 space-y-4">
          <p className="text-xs text-blue-200/60 font-medium">
            Backup de segurança em arquivo JSON. Seus dados são criptografados
            localmente.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={exportFullBackup}
              className="flex-1 h-12 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 text-[10px] font-black uppercase tracking-widest transition-all"
            >
              <Download size={14} className="mr-2" /> Exportar Tudo
            </Button>
            <div className="flex-1 relative">
              <Button className="w-full h-12 rounded-xl bg-blue-500 hover:bg-blue-400 text-black text-[10px] font-black uppercase tracking-widest transition-all">
                <Upload size={14} className="mr-2" /> Restaurar Backup
              </Button>
              <input
                type="file"
                accept=".json"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    try {
                      await importFullBackup(file);
                      showSuccess("Restauração Concluída!");
                      window.location.reload();
                    } catch {
                      showError("Erro no arquivo de backup.");
                    }
                  }
                }}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-rose-500/5 border border-rose-500/10 flex items-center justify-between gap-6">
          <div>
            <h4 className="text-sm font-black text-rose-400 uppercase tracking-widest mb-1">
              Limpeza Completa
            </h4>
            <p className="text-[10px] text-slate-500 font-medium">
              Apaga permanentemente todos os registros locais.
            </p>
          </div>
          <Button
            variant="ghost"
            onClick={handleReset}
            className="h-10 px-4 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-[9px] font-black uppercase tracking-widest transition-all"
          >
            Resetar App
          </Button>
        </div>
      </div>
    </div>
  );
};
