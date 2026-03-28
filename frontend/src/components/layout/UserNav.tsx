import { User, Settings, LogOut } from "lucide-react";
import { type TabType } from "@/types/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";

interface UserNavProps {
  onNavigate?: (tab: TabType) => void;
  collapsed?: boolean;
}

export function UserNav({ onNavigate, collapsed = false }: UserNavProps) {
  const { user, logout } = useAuth() as any;

  // Derive display name and initials from auth context (always up-to-date)
  const displayName: string = (user as any)?.name || (user as any)?.username || "Usuário";
  const displayEmail: string = (user as any)?.email || "";
  const initials = displayName.substring(0, 2).toUpperCase();

  const handleLogout = async () => {
    try {
      if (logout) await logout();
    } catch {
      // Fallback: clear session manually
    }
    localStorage.removeItem("auth_session");
    window.location.reload();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "4px",
            background: "none",
            border: "none",
            cursor: "pointer",
            outline: "none",
            borderRadius: "50%",
          }}
          aria-label="Menu do usuário"
        >
          <div style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #4A8BFF, #9B7FFF)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: "0 0 0 2px rgba(74,139,255,0.25), 0 4px 12px rgba(74,139,255,0.2)",
            transition: "box-shadow 0.2s",
            fontSize: 13,
            fontWeight: 700,
            color: "#fff",
            letterSpacing: "-0.3px",
            fontFamily: "var(--font)",
          }}>
            {initials}
          </div>
          {!collapsed && (
            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--t1)", fontFamily: "var(--font)" }}>
              {displayName.split(" ")[0]}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        style={{
          width: 220,
          zIndex: 100,
          background: "rgba(11,18,32,0.97)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 20,
          padding: "6px",
          boxShadow: "0 24px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)",
        }}
        align="end"
        forceMount
      >
        {/* User info header */}
        <div style={{ padding: "10px 12px 8px" }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--t1)", marginBottom: 2 }}>
            {displayName}
          </div>
          {displayEmail && (
            <div style={{ fontSize: 11, color: "var(--t3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {displayEmail}
            </div>
          )}
        </div>

        <DropdownMenuSeparator style={{ background: "rgba(255,255,255,0.08)", margin: "4px 0" }} />

        <DropdownMenuItem
          onClick={() => onNavigate?.("profile")}
          style={{ cursor: "pointer", borderRadius: 12, padding: "9px 12px", gap: 10, fontSize: 13, color: "var(--t1)", display: "flex", alignItems: "center" }}
        >
          <User size={15} style={{ color: "var(--blue)", flexShrink: 0 }} />
          Meu Perfil
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => onNavigate?.("settings")}
          style={{ cursor: "pointer", borderRadius: 12, padding: "9px 12px", gap: 10, fontSize: 13, color: "var(--t1)", display: "flex", alignItems: "center" }}
        >
          <Settings size={15} style={{ color: "var(--blue)", flexShrink: 0 }} />
          Configurações
        </DropdownMenuItem>

        <DropdownMenuSeparator style={{ background: "rgba(255,255,255,0.08)", margin: "4px 0" }} />

        <DropdownMenuItem
          onClick={handleLogout}
          style={{ cursor: "pointer", borderRadius: 12, padding: "9px 12px", gap: 10, fontSize: 13, color: "var(--red)", display: "flex", alignItems: "center" }}
        >
          <LogOut size={15} style={{ flexShrink: 0 }} />
          Sair da conta
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
