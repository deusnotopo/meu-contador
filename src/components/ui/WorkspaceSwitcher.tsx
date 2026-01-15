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
      window.location.reload(); // Force reload to refresh all hooks with new context
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
          className="h-10 px-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex items-center gap-2"
          disabled={isLoading}
        >
          <div
            className={`w-2 h-2 rounded-full ${
              isPersonal ? "bg-indigo-400" : "bg-pink-400"
            } animate-pulse`}
          />
          <span className="text-[10px] font-black uppercase tracking-widest text-white">
            {isPersonal ? "Pessoal" : "Compartilhado"}
          </span>
          <ChevronDown size={14} className="text-slate-500" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 glass-premium border-white/10 text-white p-2">
        <DropdownMenuLabel className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 px-2 py-2">
          Seus Espaços
        </DropdownMenuLabel>

        <DropdownMenuItem
          onClick={() => handleSwitch(user.uid)}
          className={`rounded-lg mb-1 flex items-center gap-3 cursor-pointer ${
            isPersonal ? "bg-white/10" : ""
          }`}
        >
          <div className="p-1.5 bg-indigo-500/20 rounded-md text-indigo-400">
            <Users size={14} />
          </div>
          <span className="text-xs font-bold">Meu Espaço Pessoal</span>
        </DropdownMenuItem>

        {profile.workspaces?.map((wsId) => (
          <DropdownMenuItem
            key={wsId}
            onClick={() => handleSwitch(wsId)}
            className={`rounded-lg mb-1 flex items-center gap-3 cursor-pointer ${
              currentWorkspaceId === wsId ? "bg-white/10" : ""
            }`}
          >
            <div className="p-1.5 bg-pink-500/20 rounded-md text-pink-400">
              <Briefcase size={14} />
            </div>
            <span className="text-xs font-bold truncate">
              Espaço {wsId.slice(0, 5)}
            </span>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator className="bg-white/5 my-2" />

        <DropdownMenuItem
          onClick={handleCreate}
          className="rounded-lg flex items-center gap-3 cursor-pointer hover:bg-emerald-500/10 text-emerald-400 transition-colors"
        >
          <div className="p-1.5 bg-emerald-500/20 rounded-md">
            <Plus size={14} />
          </div>
          <span className="text-xs font-black uppercase tracking-widest">
            Criar Novo
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
