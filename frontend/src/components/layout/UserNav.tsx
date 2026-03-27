import { User, Settings, LogOut } from "lucide-react";
import { type TabType } from "@/types/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { loadProfile } from "@/lib/storage";
import { cn } from "@/lib/utils";

interface UserNavProps {
  onNavigate?: (tab: TabType) => void;
  collapsed?: boolean;
}

export function UserNav({ onNavigate, collapsed = false }: UserNavProps) {
  const profile = loadProfile();
  
  const handleLogout = () => {
    localStorage.removeItem("auth_session");
    window.location.reload();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-3 px-2 py-1.5 rounded-xl transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-foreground group outline-none border border-transparent hover:border-sidebar-border/50",
            collapsed ? "justify-center w-full" : "justify-start"
          )}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shrink-0 shadow-sm group-hover:shadow-glow transition-all">
            <span className="text-white text-xs font-bold leading-none tracking-tight">
              {(profile?.name || "US").substring(0, 2).toUpperCase()}
            </span>
          </div>
          {!collapsed && (
            <div className="flex flex-col items-start overflow-hidden whitespace-nowrap">
              <span className="font-medium text-sm leading-none text-foreground">{profile?.name?.split(' ')[0] || "Usuário"}</span>
            </div>
          )}
        </button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-56 z-[100] bg-[#020617]/95 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-indigo-500/10 rounded-2xl p-1" align="end" forceMount>
        <div className="flex items-center justify-start gap-2 p-3">
          <div className="flex flex-col space-y-1">
            <p className="font-medium text-sm text-foreground">{profile?.name || "Usuário"}</p>
            <p className="text-xs text-muted-foreground truncate">{(profile as any)?.email || "Sem e-mail cadastrado"}</p>
          </div>
        </div>
        <DropdownMenuSeparator className="bg-border/50" />
        <DropdownMenuItem 
          onClick={() => onNavigate?.('personal')}
          className="cursor-pointer gap-2 py-2 focus:bg-primary/10 transition-colors"
        >
          <User className="h-4 w-4 text-primary" />
          <span>Meu Perfil</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => onNavigate?.('settings')}
          className="cursor-pointer gap-2 py-2 focus:bg-primary/10 transition-colors"
        >
          <Settings className="h-4 w-4 text-primary" />
          <span>Configurações</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator className="bg-border/50" />
        <DropdownMenuItem 
          onClick={handleLogout}
          className="cursor-pointer gap-2 py-2 text-red-500 focus:bg-red-500/10 focus:text-red-600 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Sair da conta</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
