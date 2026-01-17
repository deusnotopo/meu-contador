import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { syncAllData } from "@/lib/storage";
import { showSuccess, showError } from "@/lib/toast";
import { createWorkspaceCloud, joinWorkspaceCloud } from "@/lib/workspace-service";
import { logAction } from "@/lib/audit-service";
import { AuditLogViewer } from "./AuditLogViewer";
import type { UserProfile } from "@/types";
import { AnimatePresence, motion } from "framer-motion";
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
  profile: Partial<UserProfile>;
  onUpdate: (profile: Partial<UserProfile>) => void;
  userId: string;
}

const containerVars = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVars = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0 },
};

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
    const name = window.prompt("Nome do novo Espaço Compartilhado:");
    if (!name) return;

    setIsLoading(true);
    try {
      const newWorkspaceId = crypto.randomUUID();
      const updatedWorkspaces = [...(profile.workspaces || []), newWorkspaceId];
      const updatedRoles = {
        ...(profile.workspaceRoles || {}),
        [newWorkspaceId]: "owner" as const,
      };

      const newProfile: Partial<UserProfile> = {
        ...profile,
        workspaces: updatedWorkspaces,
        workspaceRoles: updatedRoles,
        currentWorkspaceId: newWorkspaceId,
      };

      await onUpdate(newProfile);
      
      // Sync to central workspace document in Firestore
      await createWorkspaceCloud(newWorkspaceId, name, userId);
      
      // Log action
      await logAction(newWorkspaceId, "JOIN_WORKSPACE", `Espaço "${name}" criado por ${profile.name || 'usuário'}`);
      
      showSuccess("Espaço criado e ativado!");

      // Force reload to sync data from new context
      await syncAllData(userId);
      window.location.reload();
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
      const updatedRoles = {
        ...(profile.workspaceRoles || {}),
        [workspaceCode.trim()]: "viewer" as const, // Default to viewer when joining
      };

      const newProfile: Partial<UserProfile> = {
        ...profile,
        workspaces: uniqueWorkspaces,
        workspaceRoles: updatedRoles,
        currentWorkspaceId: workspaceCode.trim(),
      };

      await onUpdate(newProfile);
      
      // Sync to central workspace document in Firestore
      await joinWorkspaceCloud(workspaceCode.trim(), userId, "viewer");
      
      // Log action
      await logAction(workspaceCode.trim(), "JOIN_WORKSPACE", `Novo membro entrou como visualizador`);
      
      showSuccess("Você entrou no Espaço!");
      setWorkspaceCode("");

      // Force reload to sync data from new context
      await syncAllData(userId);
      window.location.reload();
    } catch (error: any) {
      showError(error.message || "Erro ao entrar no Espaço");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchWorkspace = async (id: string) => {
    setIsLoading(true);
    try {
      const newProfile: Partial<UserProfile> = {
        ...profile,
        currentWorkspaceId: id,
      };
      await onUpdate(newProfile);
      showSuccess("Espaço de trabalho alterado.");
      await syncAllData(userId);
      window.location.reload();
    } finally {
      setIsLoading(false);
    }
  };

  const handleReferenceCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    showSuccess("ID copiado!");
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="premium-card">
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
          <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 space-y-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:rotate-12 transition-transform duration-700">
              <Share2 size={120} />
            </div>

            <div className="relative z-10">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                Contexto Ativo
              </p>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-black text-white tracking-tighter">
                  {isPersonalParams
                    ? "Meu Espaço Pessoal"
                    : "Espaço Compartilhado"}
                </h2>
                {!isPersonalParams && (
                  <div className="flex gap-2">
                    <div className="px-2 py-0.5 rounded-full bg-pink-500 text-black text-[9px] font-black tracking-widest uppercase">
                      Shared
                    </div>
                    <div className="px-2 py-0.5 rounded-full bg-white/10 text-slate-300 text-[9px] font-black tracking-widest uppercase border border-white/5">
                      {profile.workspaceRoles?.[currentWorkspaceId] || "OWNER"}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 mt-4">
                <div className="flex-1 bg-black/40 px-4 py-2 rounded-xl border border-white/5 flex items-center justify-between group/id">
                  <code className="text-[10px] text-slate-400 font-mono truncate">
                    ID: {currentWorkspaceId}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-500 hover:text-white transition-colors"
                    onClick={() => handleReferenceCopy(currentWorkspaceId)}
                  >
                    <Copy size={12} />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Switcher */}
          <div className="space-y-6">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
              Seus Espaços Disponíveis
            </Label>
            <motion.div
              variants={containerVars}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {/* Personal Option */}
              <motion.button
                variants={itemVars}
                onClick={() => handleSwitchWorkspace(userId)}
                className={`p-5 rounded-[2rem] border flex items-center gap-4 transition-all hover:scale-[1.02] active:scale-[0.98] ${
                  isPersonalParams
                    ? "bg-indigo-500/10 border-indigo-500 shadow-xl shadow-indigo-500/10"
                    : "bg-white/5 border-white/5 hover:bg-white/10"
                }`}
              >
                <div
                  className={`p-3 rounded-2xl ${
                    isPersonalParams
                      ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                      : "bg-white/10 text-slate-400"
                  }`}
                >
                  <Users size={20} />
                </div>
                <div className="text-left">
                  <h4
                    className={`font-black text-sm uppercase tracking-tight ${
                      isPersonalParams ? "text-white" : "text-slate-400"
                    }`}
                  >
                    Pessoal
                  </h4>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                    Apenas você
                  </p>
                </div>
                {isPersonalParams && (
                  <CheckCircle2 className="ml-auto text-indigo-500" size={20} />
                )}
              </motion.button>

              {/* Shared Workspaces */}
              <AnimatePresence mode="popLayout">
                {profile.workspaces?.map((wsId) => (
                  <motion.button
                    layout
                    key={wsId}
                    variants={itemVars}
                    onClick={() => handleSwitchWorkspace(wsId)}
                    className={`p-5 rounded-[2rem] border flex items-center gap-4 transition-all hover:scale-[1.02] active:scale-[0.98] ${
                      currentWorkspaceId === wsId
                        ? "bg-pink-500/10 border-pink-500 shadow-xl shadow-pink-500/10"
                        : "bg-white/5 border-white/5 hover:bg-white/10"
                    }`}
                  >
                    <div
                      className={`p-3 rounded-2xl ${
                        currentWorkspaceId === wsId
                          ? "bg-pink-500 text-white shadow-lg shadow-pink-500/20"
                          : "bg-white/10 text-slate-400"
                      }`}
                    >
                      <Briefcase size={20} />
                    </div>
                    <div className="text-left overflow-hidden">
                      <h4
                        className={`font-black text-sm uppercase tracking-tight truncate w-32 ${
                          currentWorkspaceId === wsId
                            ? "text-white"
                            : "text-slate-400"
                        }`}
                      >
                        Compartilhado
                      </h4>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest truncate">
                        Role: {profile.workspaceRoles?.[wsId] || "OWNER"}
                      </p>
                    </div>
                    {currentWorkspaceId === wsId && (
                      <CheckCircle2
                        className="ml-auto text-pink-500"
                        size={20}
                      />
                    )}
                  </motion.button>
                ))}
              </AnimatePresence>

              {/* Create New */}
              <motion.button
                variants={itemVars}
                onClick={handleCreateWorkspace}
                disabled={isLoading}
                className="p-5 rounded-[2rem] border-2 border-dashed border-white/5 flex flex-col items-center justify-center gap-2 hover:bg-white/[0.02] transition-all text-slate-500 hover:text-emerald-400 hover:border-emerald-500/20 group"
              >
                <PlusCircle
                  size={24}
                  className="group-hover:rotate-90 transition-transform duration-500"
                />
                <span className="font-black text-[10px] uppercase tracking-widest">
                  Criar Novo Espaço
                </span>
              </motion.button>
            </motion.div>
          </div>

          {/* Join Actions */}
          <div className="space-y-6 pt-10 border-t border-white/5">
            <div className="flex flex-col gap-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                Conectar a um ID Existente
              </Label>
              <div className="flex gap-4">
                <Input
                  value={workspaceCode}
                  onChange={(e) => setWorkspaceCode(e.target.value)}
                  placeholder="Cole o ID compartilhado..."
                  className="h-14 bg-white/5 border-white/10 rounded-[1.25rem] font-mono text-xs px-6 focus:ring-pink-500/20"
                />
                <Button
                  onClick={handleJoinWorkspace}
                  className="h-14 px-10 bg-white text-black font-black uppercase tracking-widest rounded-[1.25rem] transition-all hover:bg-white/90 shadow-xl shadow-white/5"
                  disabled={isLoading || !workspaceCode}
                >
                  Entrar
                </Button>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5">
              <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                <span className="text-white font-bold mr-1">Atenção:</span>
                Ao entrar em um espaço, as modificações são registradas por usuário.
              </p>
            </div>
          </div>

          {!isPersonalParams && <AuditLogViewer workspaceId={currentWorkspaceId} />}
        </div>
      </div>
    </div>
  );
};
