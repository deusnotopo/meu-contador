// Alert import removed
import { useFinancialAlerts } from "@/hooks/useFinancialAlerts";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react";

export const GlobalAlerts = () => {
  const { alerts } = useFinancialAlerts();

  if (alerts.length === 0) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case "danger":
        return <AlertCircle className="h-4 w-4" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4" />;
      case "success":
        return <CheckCircle2 className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getVariant = (type: string) => {
    switch (type) {
      case "danger":
        return "destructive";
      case "success":
        return "default"; // Custom success style would be better but shadcn alert is limited
      default:
        return "default";
    }
  };

  return (
    <div className="space-y-4 mb-10">
      <AnimatePresence mode="popLayout">
        {alerts.map((alert, index) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, x: -20, filter: "blur(10px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 30,
              delay: index * 0.05,
            }}
          >
            <div
              className={`premium-card overflow-hidden relative group transition-all hover:translate-x-1 ${
                alert.type === "danger"
                  ? "shadow-[0_0_40px_rgba(244,63,94,0.1)]"
                  : alert.type === "success"
                  ? "shadow-[0_0_40px_rgba(16,185,129,0.1)]"
                  : alert.type === "warning"
                  ? "shadow-[0_0_40px_rgba(245,158,11,0.1)]"
                  : "shadow-premium"
              }`}
            >
              {/* Left Accent Bar */}
              <div
                className={`absolute left-0 top-0 bottom-0 w-1 ${
                  alert.type === "danger"
                    ? "bg-rose-500"
                    : alert.type === "success"
                    ? "bg-emerald-500"
                    : alert.type === "warning"
                    ? "bg-amber-500"
                    : "bg-indigo-500"
                }`}
              />

              <div className="p-6 md:p-8 flex items-start gap-6">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-2xl ${
                    alert.type === "danger"
                      ? "bg-rose-500/10 text-rose-500"
                      : alert.type === "success"
                      ? "bg-emerald-500/10 text-emerald-500"
                      : alert.type === "warning"
                      ? "bg-amber-500/10 text-amber-500"
                      : "bg-indigo-500/10 text-indigo-500"
                  }`}
                >
                  {getIcon(alert.type)}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[9px] font-black uppercase tracking-[0.3em] ${
                        alert.type === "danger"
                          ? "text-rose-500"
                          : alert.type === "success"
                          ? "text-emerald-500"
                          : alert.type === "warning"
                          ? "text-amber-500"
                          : "text-indigo-400"
                      }`}
                    >
                      {alert.title}
                    </span>
                  </div>
                  <p className="text-white font-black text-lg tracking-tight leading-tight">
                    {alert.message}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
