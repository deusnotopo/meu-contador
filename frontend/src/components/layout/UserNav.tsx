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
import type { AuthUser } from "@/context/AuthContext";

interface UserNavProps {
  onNavigate?: (tab: TabType) => void;
  collapsed?: boolean;
}

const menuItem = "cursor-pointer rounded-xl px-3 py-[9px] gap-2.5 text-[13px] text-[var(--t1)] flex items-center";

export function UserNav({ onNavigate, collapsed = false }: UserNavProps) {
  const { user, logout } = useAuth();
  const navUser = user as (AuthUser & { username?: string }) | null;

  const displayName: string = navUser?.name || navUser?.username || "Usuário";
  const displayEmail: string = navUser?.email || "";
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
          className="flex items-center gap-2 p-1 bg-transparent border-none cursor-pointer outline-none rounded-full"
          aria-label="Menu do usuário"
        >
          {/* Avatar */}
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-[13px] font-bold text-white tracking-[-0.3px] transition-shadow duration-200"
            style={{
              background: "linear-gradient(135deg, #4A8BFF, #9B7FFF)",
              boxShadow: "0 0 0 2px rgba(74,139,255,0.25), 0 4px 12px rgba(74,139,255,0.2)",
            }}
          >
            {initials}
          </div>
          {!collapsed && (
            <span className="text-[13px] font-medium text-[var(--t1)]">
              {displayName.split(" ")[0]}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-[220px] z-[100] rounded-[20px] p-1.5"
        style={{
          background: "rgba(11,18,32,0.97)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 24px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)",
        }}
        align="end"
        forceMount
      >
        {/* User info */}
        <div className="px-3 pt-2.5 pb-2">
          <div className="text-[14px] font-semibold text-[var(--t1)] mb-0.5">{displayName}</div>
          {displayEmail && (
            <div className="text-[11px] text-[var(--t3)] overflow-hidden text-ellipsis whitespace-nowrap">
              {displayEmail}
            </div>
          )}
        </div>

        <DropdownMenuSeparator className="bg-white/[0.08] my-1" />

        <DropdownMenuItem onClick={() => onNavigate?.("profile")} className={menuItem}>
          <User size={15} className="text-[var(--blue)] shrink-0" />
          Meu Perfil
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => onNavigate?.("settings")} className={menuItem}>
          <Settings size={15} className="text-[var(--blue)] shrink-0" />
          Configurações
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-white/[0.08] my-1" />

        <DropdownMenuItem onClick={handleLogout} className={`${menuItem} text-[var(--red)]`}>
          <LogOut size={15} className="shrink-0" />
          Sair da conta
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
