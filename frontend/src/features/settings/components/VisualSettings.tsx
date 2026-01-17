import { Moon, Palette, Sun } from "lucide-react";

interface Props {
  theme: "light" | "dark" | "system";
  setTheme: (theme: "light" | "dark" | "system") => void;
  privacyMode: boolean;
  togglePrivacy: () => void;
}

export const VisualSettings = ({
  theme,
  setTheme,
  privacyMode,
  togglePrivacy,
}: Props) => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="premium-card">
        <div className="p-6 md:p-8 flex items-center gap-4 border-b border-white/5 mb-8">
          <div className="p-2 bg-purple-500/10 rounded-xl text-purple-400">
            <Palette size={20} />
          </div>
          <h3 className="text-lg font-black uppercase tracking-widest text-white">
            Temas & <span className="text-purple-400">Visual</span>
          </h3>
        </div>
        <div className="p-6 md:p-8 pt-0 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={() => setTheme("dark")}
              className={`group p-6 rounded-[2.5rem] border transition-all text-left space-y-4 ${
                theme === "dark"
                  ? "bg-indigo-500/10 border-indigo-500"
                  : "bg-white/5 border-white/5 hover:border-white/20"
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center text-white shadow-xl">
                <Moon size={24} />
              </div>
              <div>
                <h4 className="font-black text-white text-lg">Sky Dark</h4>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Padrão Ultra-Premium
                </p>
              </div>
            </button>

            <button
              onClick={() => setTheme("light")}
              className={`group p-6 rounded-[2.5rem] border transition-all text-left space-y-4 ${
                theme === "light"
                  ? "bg-amber-500/10 border-amber-500"
                  : "bg-white/5 border-white/5 hover:border-white/20"
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-900 shadow-xl">
                <Sun size={24} />
              </div>
              <div>
                <h4 className="font-black text-slate-900 text-lg">
                  Crystal Light
                </h4>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Puro & Minimalista
                </p>
              </div>
            </button>
          </div>

          <div className="p-6 rounded-3xl bg-white/5 border border-white/5 flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="text-sm font-black text-white uppercase tracking-widest">
                Modo Privacidade
              </h4>
              <p className="text-[10px] text-slate-500 font-medium">
                Oculta valores financeiros sensíveis automaticamente
              </p>
            </div>
            <div
              onClick={() => togglePrivacy()}
              className={`h-6 w-12 rounded-full flex items-center px-1 cursor-pointer transition-colors ${
                privacyMode ? "bg-emerald-500" : "bg-slate-800"
              }`}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                  privacyMode ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
