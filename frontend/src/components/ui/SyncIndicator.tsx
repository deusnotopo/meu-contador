import { auth } from "@/lib/firebase";
import { Check, CloudOff, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

type SyncStatus = "synced" | "syncing" | "offline" | "error";

export const SyncIndicator = () => {
  const [status, setStatus] = useState<SyncStatus>("synced");
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!isOnline) {
      setStatus("offline");
    } else if (auth.currentUser) {
      setStatus("synced");
    }
  }, [isOnline]);

  // Listen for custom sync events
  useEffect(() => {
    const handleSyncStart = () => setStatus("syncing");
    const handleSyncEnd = () => setStatus("synced");
    const handleSyncError = () => setStatus("error");

    window.addEventListener("sync:start", handleSyncStart);
    window.addEventListener("sync:end", handleSyncEnd);
    window.addEventListener("sync:error", handleSyncError);

    return () => {
      window.removeEventListener("sync:start", handleSyncStart);
      window.removeEventListener("sync:end", handleSyncEnd);
      window.removeEventListener("sync:error", handleSyncError);
    };
  }, []);

  if (!auth.currentUser) return null;

  const statusConfig = {
    synced: {
      icon: Check,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      label: "Sincronizado",
    },
    syncing: {
      icon: Loader2,
      color: "text-indigo-400",
      bg: "bg-indigo-500/10",
      label: "Sincronizando...",
      animate: true,
    },
    offline: {
      icon: CloudOff,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      label: "Offline",
    },
    error: {
      icon: CloudOff,
      color: "text-rose-400",
      bg: "bg-rose-500/10",
      label: "Erro ao sincronizar",
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  // Don't show anything if synced to reduce noise, unless user hovers or it's crucial
  // Actually, let's keep it minimal: Just the icon
  return (
    <div
      className={`flex items-center justify-center w-8 h-8 rounded-full ${config.bg} border border-white/10 transition-all`}
      title={config.label}
    >
      <Icon
        size={14}
        className={`${config.color} ${config.animate ? "animate-spin" : ""}`}
      />
    </div>
  );
};
