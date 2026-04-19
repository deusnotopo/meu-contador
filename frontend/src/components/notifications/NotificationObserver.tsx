import { useEffect, useRef } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import { showSuccess, showError } from "@/lib/toast";

/**
 * Observador silencioso que dispara toasts quando novas notificações chegam.
 */
export function NotificationObserver() {
  const { notifications } = useNotifications();
  const prevRef = useRef(notifications.length);

  useEffect(() => {
    if (notifications.length > prevRef.current) {
      const n = notifications[0];
      if (n && !n.readAt) {
        if (n.type === "danger" || n.type === "warning") {
          showError(`🔔 ${n.title} - ${n.body}`);
        } else {
          showSuccess(`🔔 ${n.title} - ${n.body}`);
        }
      }
    }
    prevRef.current = notifications.length;
  }, [notifications]);

  return null;
}
