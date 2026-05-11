import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { showSuccess, showError } from "@/lib/toast";
import { logger } from "@/lib/logger";
import {
  Users,
  Plus,
  UserPlus,
  Trash2,
  Copy,
  CheckCircle,
  Edit,
  Crown,
  Loader2,
} from "lucide-react";

interface WorkspaceMember {
  id: string;
  name: string | null;
  email: string;
}

interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  members: WorkspaceMember[];
  createdAt: string;
}

export const WorkspaceManager = () => {
  const { user } = useAuth();

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>("");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"editor" | "viewer">("viewer");
  const [inviting, setInviting] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);

  // ── Load workspaces from backend ─────────────────────────────────────────
  const loadWorkspaces = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<Workspace[]>("/workspace");
      setWorkspaces(data);
      if (data.length > 0 && !selectedWorkspace) {
        setSelectedWorkspace(data[0]!.id);
      }
    } catch (err) {
      logger.warn("[WorkspaceManager] Failed to load workspaces", err);
      // Graceful fallback: show personal workspace stub
      setWorkspaces([]);
    } finally {
      setLoading(false);
    }
  }, [selectedWorkspace]);

  useEffect(() => { loadWorkspaces(); }, [loadWorkspaces]);

  // ── Create workspace ──────────────────────────────────────────────────────
  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) {
      showError("Digite um nome para o espaço");
      return;
    }
    setCreating(true);
    try {
      const ws = await api.post<Workspace>("/workspace", { name: newWorkspaceName.trim() });
      setWorkspaces(prev => [...prev, ws]);
      setSelectedWorkspace(ws.id);
      setNewWorkspaceName("");
      setShowCreateModal(false);
      showSuccess("Espaço criado com sucesso!");
    } catch {
      showError("Erro ao criar espaço. Tente novamente.");
    } finally {
      setCreating(false);
    }
  };

  // ── Invite member ─────────────────────────────────────────────────────────
  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) {
      showError("Digite um email válido");
      return;
    }
    setInviting(true);
    try {
      await api.post(`/workspace/${selectedWorkspace}/invite`, {
        email: inviteEmail.trim(),
        role: inviteRole,
      });
      setInviteEmail("");
      setShowInviteModal(false);
      showSuccess(`Convite enviado para ${inviteEmail}!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao enviar convite";
      showError(msg);
    } finally {
      setInviting(false);
    }
  };

  // ── Remove member ─────────────────────────────────────────────────────────
  const handleRemoveMember = async (memberId: string) => {
    if (memberId === user?.id) {
      showError("Você não pode remover a si mesmo");
      return;
    }
    try {
      await api.delete(`/workspace/${selectedWorkspace}/members/${memberId}`);
      setWorkspaces(prev => prev.map(w =>
        w.id === selectedWorkspace
          ? { ...w, members: w.members.filter(m => m.id !== memberId) }
          : w
      ));
      showSuccess("Membro removido");
    } catch {
      showError("Erro ao remover membro");
    }
  };

  const handleCopyInviteLink = () => {
    const link = `${window.location.origin}/join/${selectedWorkspace}`;
    navigator.clipboard.writeText(link);
    showSuccess("Link copiado!");
  };

  const currentWorkspace = workspaces.find(w => w.id === selectedWorkspace);
  const isOwner = currentWorkspace?.ownerId === user?.id;

  const getRoleIcon = (memberId: string) => {
    if (memberId === currentWorkspace?.ownerId)
      return <Crown size={14} className="text-amber-400" />;
    return <Edit size={14} className="text-blue-400" />;
  };

  const getRoleLabel = (memberId: string) =>
    memberId === currentWorkspace?.ownerId ? "Proprietário" : "Editor";

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-white/30" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Workspace Selector */}
      <div className="space-y-4">
        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1">
          Espaços Disponíveis
        </label>

        {workspaces.length === 0 ? (
          <div className="p-6 rounded-xl bg-white/5 text-center">
            <Users size={28} className="mx-auto text-white/20 mb-2" />
            <p className="text-sm text-neutral-500">Nenhum workspace ainda.</p>
            <p className="text-[11px] text-neutral-600 mt-1">Crie um espaço para colaborar.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {workspaces.map((ws) => (
              <button
                key={ws.id}
                onClick={() => setSelectedWorkspace(ws.id)}
                className={`p-4 rounded-xl text-left transition-all ${
                  selectedWorkspace === ws.id
                    ? "bg-blue-500/20 border-2 border-blue-500"
                    : "bg-white/5 border-2 border-transparent hover:bg-white/10"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white/10">
                      <Users size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">{ws.name}</div>
                      <div className="text-[10px] text-neutral-500">
                        {ws.members.length} membro{ws.members.length !== 1 ? "s" : ""}
                        {ws.ownerId === user?.id ? " • Proprietário" : ""}
                      </div>
                    </div>
                  </div>
                  {selectedWorkspace === ws.id && (
                    <CheckCircle size={18} className="text-blue-400" />
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        <Button
          onClick={() => setShowCreateModal(true)}
          variant="outline"
          className="w-full h-12 border-dashed border-white/20 text-neutral-500 hover:text-white hover:border-white/40"
        >
          <Plus size={18} className="mr-2" />
          Criar Novo Espaço
        </Button>
      </div>

      {/* Current Workspace Details */}
      {currentWorkspace && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1">
              Membros do Espaço
            </label>
            {isOwner && (
              <Button
                onClick={() => setShowInviteModal(true)}
                size="sm"
                className="h-8 px-3 text-[10px]"
              >
                <UserPlus size={14} className="mr-1" />
                Convidar
              </Button>
            )}
          </div>

          <div className="space-y-2">
            {currentWorkspace.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 rounded-xl bg-white/5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center text-[10px] font-bold text-white">
                    {(member.name || member.email).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{member.name || "—"}</div>
                    <div className="text-[10px] text-neutral-500">{member.email}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {getRoleIcon(member.id)}
                  <span className="text-[10px] text-neutral-500">{getRoleLabel(member.id)}</span>
                  {isOwner && member.id !== user?.id && (
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="p-1 rounded hover:bg-red-500/20 text-red-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Invite Link */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-white">Link de Convite</div>
                <div className="text-[10px] text-neutral-500">Compartilhe para adicionar membros</div>
              </div>
              <Button onClick={handleCopyInviteLink} variant="ghost" size="sm" className="h-8">
                <Copy size={14} className="mr-1" />
                Copiar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0f1a] rounded-2xl p-6 max-w-md w-full border border-white/10">
            <h3 className="text-lg font-bold text-white mb-4">Criar Novo Espaço</h3>
            <Input
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              placeholder="Nome do espaço..."
              className="mb-4"
              onKeyDown={(e) => e.key === "Enter" && handleCreateWorkspace()}
            />
            <div className="flex gap-3">
              <Button onClick={() => setShowCreateModal(false)} variant="outline" className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleCreateWorkspace} className="flex-1" disabled={creating}>
                {creating ? <Loader2 size={16} className="animate-spin" /> : "Criar"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0f1a] rounded-2xl p-6 max-w-md w-full border border-white/10">
            <h3 className="text-lg font-bold text-white mb-4">Convidar Membro</h3>
            <Input
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="email@exemplo.com"
              className="mb-4"
              type="email"
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as "editor" | "viewer")}
              className="w-full mb-4 p-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm"
            >
              <option value="viewer">Visualizador (apenas visualiza)</option>
              <option value="editor">Editor (pode editar)</option>
            </select>
            <div className="flex gap-3">
              <Button onClick={() => setShowInviteModal(false)} variant="outline" className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleInviteMember} className="flex-1" disabled={inviting}>
                {inviting ? <Loader2 size={16} className="animate-spin" /> : "Enviar Convite"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};