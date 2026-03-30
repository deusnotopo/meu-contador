import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showSuccess, showError } from "@/lib/toast";
import { 
  Users, 
  Plus, 
  UserPlus, 
  Trash2, 
  Copy, 
  CheckCircle,
  Eye,
  Edit,
  Crown
} from "lucide-react";

interface WorkspaceMember {
  id: string;
  name: string;
  email: string;
  role: "owner" | "editor" | "viewer";
  addedAt: string;
}

interface Workspace {
  id: string;
  name: string;
  members: WorkspaceMember[];
  createdAt: string;
}

export const WorkspaceManager = () => {
  const { user } = useAuth();

  const [workspaces, setWorkspaces] = useState<Workspace[]>([
    {
      id: user?.id || "personal",
      name: "Meu Espaço Pessoal",
      members: [
        {
          id: user?.id || "owner",
          name: user?.name || "Você",
          email: user?.email || "",
          role: "owner",
          addedAt: new Date().toISOString()
        }
      ],
      createdAt: new Date().toISOString()
    }
  ]);

  const [selectedWorkspace, setSelectedWorkspace] = useState<string>(workspaces[0]?.id || "");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"editor" | "viewer">("viewer");
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleCreateWorkspace = () => {
    if (!newWorkspaceName.trim()) {
      showError("Digite um nome para o espaço");
      return;
    }

    const newWorkspace: Workspace = {
      id: crypto.randomUUID(),
      name: newWorkspaceName,
      members: [
        {
          id: user?.id || "owner",
          name: user?.name || "Você",
          email: user?.email || "",
          role: "owner",
          addedAt: new Date().toISOString()
        }
      ],
      createdAt: new Date().toISOString()
    };

    setWorkspaces(prev => [...prev, newWorkspace]);
    setSelectedWorkspace(newWorkspace.id);
    setNewWorkspaceName("");
    setShowCreateModal(false);
    showSuccess("Espaço criado com sucesso!");
  };

  const handleInviteMember = () => {
    if (!inviteEmail.trim()) {
      showError("Digite um email válido");
      return;
    }

    const currentWorkspace = workspaces.find(w => w.id === selectedWorkspace);
    if (!currentWorkspace) return;

    const newMember: WorkspaceMember = {
      id: crypto.randomUUID(),
      name: inviteEmail.split("@")[0] || "",
      email: inviteEmail,
      role: inviteRole,
      addedAt: new Date().toISOString()
    };

    setWorkspaces(prev => prev.map(w => 
      w.id === selectedWorkspace 
        ? { ...w, members: [...w.members, newMember] }
        : w
    ));

    setInviteEmail("");
    setShowInviteModal(false);
    showSuccess(`Convite enviado para ${inviteEmail}`);
  };

  const handleRemoveMember = (memberId: string) => {
    if (memberId === user?.id) {
      showError("Você não pode remover a si mesmo");
      return;
    }

    setWorkspaces(prev => prev.map(w => 
      w.id === selectedWorkspace 
        ? { ...w, members: w.members.filter(m => m.id !== memberId) }
        : w
    ));
    showSuccess("Membro removido");
  };

  const handleChangeRole = (memberId: string, newRole: "editor" | "viewer") => {
    setWorkspaces(prev => prev.map(w => 
      w.id === selectedWorkspace 
        ? { 
            ...w, 
            members: w.members.map(m => 
              m.id === memberId ? { ...m, role: newRole } : m
            )
          }
        : w
    ));
    showSuccess("Permissão atualizada");
  };

  const handleCopyInviteLink = () => {
    const link = `${window.location.origin}/join/${selectedWorkspace}`;
    navigator.clipboard.writeText(link);
    showSuccess("Link copiado!");
  };

  const currentWorkspace = workspaces.find(w => w.id === selectedWorkspace);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner": return <Crown size={14} className="text-amber-400" />;
      case "editor": return <Edit size={14} className="text-blue-400" />;
      case "viewer": return <Eye size={14} className="text-slate-400" />;
      default: return null;
    }
  };



  return (
    <div className="space-y-6">
      {/* Workspace Selector */}
      <div className="space-y-4">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
          Espaços Disponíveis
        </label>
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
                    <div className="text-[10px] text-slate-400">
                      {ws.members.length} membro{ws.members.length !== 1 ? 's' : ''}
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

        <Button
          onClick={() => setShowCreateModal(true)}
          variant="outline"
          className="w-full h-12 border-dashed border-white/20 text-slate-400 hover:text-white hover:border-white/40"
        >
          <Plus size={18} className="mr-2" />
          Criar Novo Espaço
        </Button>
      </div>

      {/* Current Workspace Details */}
      {currentWorkspace && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
              Membros do Espaço
            </label>
            <Button
              onClick={() => setShowInviteModal(true)}
              size="sm"
              className="h-8 px-3 text-[10px]"
            >
              <UserPlus size={14} className="mr-1" />
              Convidar
            </Button>
          </div>

          <div className="space-y-2">
            {currentWorkspace.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 rounded-xl bg-white/5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center text-[10px] font-bold text-white">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{member.name}</div>
                    <div className="text-[10px] text-slate-400">{member.email}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {getRoleIcon(member.role)}
                  <select
                    value={member.role}
                    onChange={(e) => handleChangeRole(member.id, e.target.value as "editor" | "viewer")}
                    disabled={member.role === "owner"}
                    className="text-[10px] bg-white/10 border border-white/10 rounded-lg px-2 py-1 text-white disabled:opacity-50"
                  >
                    <option value="viewer">Visualizador</option>
                    <option value="editor">Editor</option>
                    {member.role === "owner" && <option value="owner">Proprietário</option>}
                  </select>

                  {member.role !== "owner" && (
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
                <div className="text-[10px] text-slate-400">Compartilhe para adicionar membros</div>
              </div>
              <Button
                onClick={handleCopyInviteLink}
                variant="ghost"
                size="sm"
                className="h-8"
              >
                <Copy size={14} className="mr-1" />
                Copiar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create Workspace Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0f1a] rounded-2xl p-6 max-w-md w-full border border-white/10">
            <h3 className="text-lg font-bold text-white mb-4">Criar Novo Espaço</h3>
            <Input
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              placeholder="Nome do espaço..."
              className="mb-4"
            />
            <div className="flex gap-3">
              <Button
                onClick={() => setShowCreateModal(false)}
                variant="outline"
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateWorkspace}
                className="flex-1"
              >
                Criar
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
              <Button
                onClick={() => setShowInviteModal(false)}
                variant="outline"
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleInviteMember}
                className="flex-1"
              >
                Enviar Convite
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};