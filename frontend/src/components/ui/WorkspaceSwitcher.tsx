import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";
import { loadProfile, saveProfile, syncAllData } from "@/lib/storage";
import { showSuccess } from "@/lib/toast";
import type { UserProfile } from "@/types";
import { Briefcase, ChevronDown, Plus, Users } from "lucide-react";
import { useState } from "react";

export const WorkspaceSwitcher = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(loadProfile());
  const [isLoading, setIsLoading] = useState(false);

  if (!user || !profile) return null;

  const currentWorkspaceId = profile.currentWorkspaceId || user.uid;
  const isPersonal = currentWorkspaceId === user.uid;

  const handleSwitch = async (id: string) => {
    setIsLoading(true);
    try {
      const updatedProfile: UserProfile = {
        ...profile,
        currentWorkspaceId: id,
      };
      setProfile(updatedProfile);
      saveProfile(updatedProfile);
      showSuccess(
        id === user.uid
          ? "Mudou para Espaço Pessoal"
          : "Espaço Compartilhado Ativo"
      );
      await syncAllData(user.uid);
      window.location.reload();
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    const name = window.prompt("Nome do novo Espaço:");
    if (!name) return;

    setIsLoading(true);
    try {
      const newWsId = crypto.randomUUID();
      const updatedProfile: UserProfile = {
        ...profile,
        workspaces: [...(profile.workspaces || []), newWsId],
        currentWorkspaceId: newWsId,
      };
      setProfile(updatedProfile);
      saveProfile(updatedProfile);
      showSuccess(`Espaço "${name}" criado!`);
      await syncAllData(user.uid);
      window.location.reload();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-12 px-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex items-center gap-3 active:scale-95"
          disabled={isLoading}
        >
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              isPersonal ? "bg-indigo-400" : "bg-pink-400"
            } shadow-[0_0_8px_rgba(129,140,248,0.5)]`}
          />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">
            {isPersonal ? "Pessoal" : "Shared"}
          </span>
          <ChevronDown size={14} className="text-slate-500" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 glass-premium border-white/10 text-white p-2 rounded-[1.5rem] shadow-2xl">
        <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 px-4 py-3">
          Ambiente de Dados
        </DropdownMenuLabel>

        <DropdownMenuItem
          onClick={() => handleSwitch(user.uid)}
          className={`rounded-xl mb-1 flex items-center gap-3 cursor-pointer p-3 transition-colors ${
            isPersonal
              ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
              : "hover:bg-white/5"
          }`}
        >
          <div
            className={`p-2 rounded-lg ${
              isPersonal
                ? "bg-indigo-500 text-white"
                : "bg-white/5 text-slate-400"
            }`}
          >
            <Users size={16} />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-black uppercase tracking-tight">
              Privado
            </span>
            <span className="text-[9px] font-medium text-slate-500">
              Apenas você
            </span>
          </div>
        </DropdownMenuItem>

        {profile.workspaces?.map((wsId) => (
          <DropdownMenuItem
            key={wsId}
            onClick={() => handleSwitch(wsId)}
            className={`rounded-xl mb-1 flex items-center gap-3 cursor-pointer p-3 transition-colors ${
              currentWorkspaceId === wsId
                ? "bg-pink-500/10 text-pink-400 border border-pink-500/20"
                : "hover:bg-white/5"
            }`}
          >
            <div
              className={`p-2 rounded-lg ${
                currentWorkspaceId === wsId
                  ? "bg-pink-500 text-white"
                  : "bg-white/5 text-slate-400"
              }`}
            >
              <Briefcase size={16} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-black uppercase tracking-tight">
                Shared
              </span>
              <span className="text-[9px] font-medium text-slate-500">
                ID: {wsId.slice(0, 8)}
              </span>
            </div>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator className="bg-white/5 my-2 mx-2" />

        <DropdownMenuItem
          onClick={handleCreate}
          className="rounded-xl flex items-center gap-3 cursor-pointer p-3 hover:bg-emerald-500/10 text-emerald-400 transition-colors group"
        >
          <div className="p-2 bg-emerald-500/10 rounded-lg group-hover:bg-emerald-500 group-hover:text-black transition-colors">
            <Plus size={16} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">
            Novo Espaço
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
