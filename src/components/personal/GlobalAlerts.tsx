// Alert import removed
import { useFinancialAlerts } from "@/hooks/useFinancialAlerts";
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const GlobalAlerts = () => {
  const { alerts } = useFinancialAlerts();

  if (alerts.length === 0) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case "danger": return <AlertCircle className="h-4 w-4" />;
      case "warning": return <TriangleAlert className="h-4 w-4" />;
      case "success": return <CheckCircle2 className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getVariant = (type: string) => {
    switch (type) {
      case "danger": return "destructive";
      case "success": return "default"; // Custom success style would be better but shadcn alert is limited
      default: return "default";
    }
  };

  return (
    <div className="space-y-4 mb-8">
      <AnimatePresence>
        {alerts.map((alert, index) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className={`glass-card p-5 rounded-3xl border-0 overflow-hidden relative group transition-all hover:scale-[1.01] ${
                alert.type === 'danger' ? 'shadow-[0_0_30px_rgba(239,68,68,0.1)]' : 
                alert.type === 'success' ? 'shadow-[0_0_30px_rgba(34,197,94,0.1)]' : 
                alert.type === 'warning' ? 'shadow-[0_0_30px_rgba(245,158,11,0.1)]' : 'shadow-premium'
            }`}>
              {/* Left Color Indicator */}
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                alert.type === 'danger' ? 'bg-danger' : 
                alert.type === 'success' ? 'bg-success' : 
                alert.type === 'warning' ? 'bg-warning' : 'bg-primary'
              }`} />

              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-2xl ${
                  alert.type === 'danger' ? 'bg-danger/20 text-danger shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 
                  alert.type === 'success' ? 'bg-success/20 text-success shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 
                  alert.type === 'warning' ? 'bg-warning/20 text-warning shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 
                  'bg-primary/20 text-primary shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                }`}>
                  {getIcon(alert.type)}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${
                      alert.type === 'danger' ? 'text-danger' : 
                      alert.type === 'success' ? 'text-success' : 
                      alert.type === 'warning' ? 'text-warning' : 'text-primary'
                    }`}>
                      {alert.title}
                    </span>
                  </div>
                  <p className="text-white font-bold text-base leading-tight">
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
