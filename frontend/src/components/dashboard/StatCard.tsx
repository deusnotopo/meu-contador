import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  variant: "income" | "expense" | "balance" | "neutral";
  delay?: number;
}

const StatCard = ({ title, value, subtitle, icon: Icon, variant, delay = 0 }: StatCardProps) => {
  const variantClasses = {
    income: "stat-card stat-card-income",
    expense: "stat-card stat-card-expense",
    balance: "stat-card stat-card-balance",
    neutral: "stat-card stat-card-neutral",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ 
        y: -5, 
        scale: 1.02,
        transition: { duration: 0.2 } 
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ 
        type: "spring",
        stiffness: 300,
        damping: 20,
        delay 
      }}
      className={cn(variantClasses[variant], "group")}
    >
      {/* Glossy Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="flex items-start justify-between relative z-10">
        <div className="space-y-3">
          <p className={cn(
            "text-xs font-bold uppercase tracking-widest opacity-80",
            variant === "neutral" ? "text-muted-foreground" : "text-white/90"
          )}>
            {title}
          </p>
          <div className="space-y-1">
            <p className="text-3xl font-heading font-extrabold tracking-tight">
              {value}
            </p>
            {subtitle && (
              <p className={cn(
                "text-xs font-medium opacity-70",
                variant === "neutral" ? "text-muted-foreground" : "text-white/80"
              )}>
                {subtitle}
              </p>
            )}
          </div>
        </div>
        <div className={cn(
          "p-4 rounded-2xl shadow-inner transition-transform duration-500 group-hover:rotate-12",
          variant === "neutral" ? "bg-white/5 border border-white/10" : "bg-white/20"
        )}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </motion.div>
  );
};

export default StatCard;
