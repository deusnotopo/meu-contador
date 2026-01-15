import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { syncAllData } from "@/lib/storage";
import { showSuccess } from "@/lib/toast";
import type { UserProfile } from "@/types";
import {
  Briefcase,
  CheckCircle2,
  Copy,
  PlusCircle,
  Share2,
  Users,
} from "lucide-react";
import { useState } from "react";

interface CollaborationPanelProps {
  profile: UserProfile;
  onUpdate: (profile: UserProfile) => void;
  userId: string;
}

export const CollaborationPanel = ({
  profile,
  onUpdate,
  userId,
}: CollaborationPanelProps) => {
  const [workspaceCode, setWorkspaceCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Default to user ID if no workspace is set (Personal Mode)
  const currentWorkspaceId = profile.currentWorkspaceId || userId;
  const isPersonalParams = currentWorkspaceId === userId;

  const handleCreateWorkspace = async () => {
    if (!window.confirm("Deseja criar um novo Espaço Compartilhado?")) return;

    setIsLoading(true);
    try {
      const newWorkspaceId = crypto.randomUUID();
      const updatedWorkspaces = [...(profile.workspaces || []), newWorkspaceId];

      const newProfile: UserProfile = {
        ...profile,
        workspaces: updatedWorkspaces,
        currentWorkspaceId: newWorkspaceId,
      };

      await onUpdate(newProfile);
      showSuccess("Espaço criado e ativado!");

      // Force reload to sync data from new context
      await syncAllData(userId);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinWorkspace = async () => {
    if (!workspaceCode.trim()) return;

    setIsLoading(true);
    try {
      const updatedWorkspaces = [
        ...(profile.workspaces || []),
        workspaceCode.trim(),
      ];

      // Remove duplicates
      const uniqueWorkspaces = [...new Set(updatedWorkspaces)];

      const newProfile: UserProfile = {
        ...profile,
        workspaces: uniqueWorkspaces,
        currentWorkspaceId: workspaceCode.trim(),
      };

      await onUpdate(newProfile);
      showSuccess("Você entrou no Espaço!");
      setWorkspaceCode("");

      // Force reload to sync data from new context
      await syncAllData(userId);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchWorkspace = async (id: string) => {
    setIsLoading(true);
    try {
      const newProfile: UserProfile = {
        ...profile,
        currentWorkspaceId: id,
      };
      await onUpdate(newProfile);
      showSuccess("Espaço de trabalho alterado.");
      await syncAllData(userId);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReferenceCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    showSuccess("Copiado para a área de transferência!");
  };

  return (
    <div className="premium-card animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="p-6 md:p-8 flex items-center gap-4 border-b border-white/5 mb-8">
        <div className="p-2 bg-pink-500/10 rounded-xl text-pink-400">
          <Users size={20} />
        </div>
        <h3 className="text-lg font-black uppercase tracking-widest text-white">
          Espaços <span className="text-pink-400">Colaborativos</span>
        </h3>
      </div>

      <div className="p-6 md:p-8 pt-0 space-y-10">
        {/* Current Workspace Status */}
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Share2 size={120} />
          </div>

          <div className="relative z-10">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
              Você está operando em:
            </p>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black text-white">
                {isPersonalParams
                  ? "Meu Espaço Pessoal"
                  : "Espaço Compartilhado"}
              </h2>
              {!isPersonalParams && (
                <div className="px-2 py-1 rounded bg-pink-500/20 text-pink-400 text-[10px] font-bold border border-pink-500/20">
                  SHARED
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <code className="bg-black/40 px-3 py-1.5 rounded-lg text-xs text-slate-400 font-mono">
                ID: {currentWorkspaceId}
              </code>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-400 hover:text-white"
                onClick={() => handleReferenceCopy(currentWorkspaceId)}
              >
                <Copy size={14} />
              </Button>
            </div>
          </div>
        </div>

        {/* Switcher */}
        <div className="space-y-4">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
            Seus Espaços
          </Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Personal Option */}
            <button
              onClick={() => handleSwitchWorkspace(userId)}
              className={`p-4 rounded-2xl border flex items-center gap-4 transition-all ${
                isPersonalParams
                  ? "bg-indigo-500/10 border-indigo-500 shadow-lg shadow-indigo-500/10"
                  : "bg-white/5 border-white/5 hover:bg-white/10"
              }`}
            >
              <div
                className={`p-3 rounded-xl ${
                  isPersonalParams
                    ? "bg-indigo-500 text-white"
                    : "bg-white/10 text-slate-400"
                }`}
              >
                <Users size={20} />
              </div>
              <div className="text-left">
                <h4
                  className={`font-bold ${
                    isPersonalParams ? "text-white" : "text-slate-400"
                  }`}
                >
                  Pessoal
                </h4>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                  Apenas você
                </p>
              </div>
              {isPersonalParams && (
                <CheckCircle2 className="ml-auto text-indigo-500" size={20} />
              )}
            </button>

            {/* Shared Workspaces */}
            {profile.workspaces?.map((wsId) => (
              <button
                key={wsId}
                onClick={() => handleSwitchWorkspace(wsId)}
                className={`p-4 rounded-2xl border flex items-center gap-4 transition-all ${
                  currentWorkspaceId === wsId
                    ? "bg-pink-500/10 border-pink-500 shadow-lg shadow-pink-500/10"
                    : "bg-white/5 border-white/5 hover:bg-white/10"
                }`}
              >
                <div
                  className={`p-3 rounded-xl ${
                    currentWorkspaceId === wsId
                      ? "bg-pink-500 text-white"
                      : "bg-white/10 text-slate-400"
                  }`}
                >
                  <Briefcase size={20} />
                </div>
                <div className="text-left overflow-hidden">
                  <h4
                    className={`font-bold truncate w-32 ${
                      currentWorkspaceId === wsId
                        ? "text-white"
                        : "text-slate-400"
                    }`}
                  >
                    Compartilhado
                  </h4>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest truncate">
                    {wsId.slice(0, 8)}...
                  </p>
                </div>
                {currentWorkspaceId === wsId && (
                  <CheckCircle2 className="ml-auto text-pink-500" size={20} />
                )}
              </button>
            ))}

            {/* Create New */}
            <button
              onClick={handleCreateWorkspace}
              disabled={isLoading}
              className="p-4 rounded-2xl border border-dashed border-white/20 flex items-center justify-center gap-2 hover:bg-white/5 transition-all text-slate-400 hover:text-white"
            >
              <PlusCircle size={20} />
              <span className="font-bold text-xs uppercase tracking-widest">
                Criar Novo
              </span>
            </button>
          </div>
        </div>

        {/* Join Actions */}
        <div className="space-y-4 pt-4 border-t border-white/5">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
            Entrar em um Espaço Existente
          </Label>
          <div className="flex gap-4">
            <Input
              value={workspaceCode}
              onChange={(e) => setWorkspaceCode(e.target.value)}
              placeholder="Cole o ID do espaço aqui..."
              className="h-12 bg-white/5 border-white/10 rounded-xl font-mono text-xs"
            />
            <Button
              onClick={handleJoinWorkspace}
              className="h-12 px-8 bg-pink-500 hover:bg-pink-400 text-white font-black uppercase tracking-widest rounded-xl transition-all"
              disabled={isLoading || !workspaceCode}
            >
              Entrar
            </Button>
          </div>
          <p className="text-[10px] text-slate-500 leading-relaxed">
            Ao entrar em um espaço, você terá acesso total para visualizar e
            editar as finanças compartilhadas. Certifique-se de compartilhar o
            ID apenas com pessoas de confiança.
          </p>
        </div>
      </div>
    </div>
  );
};
