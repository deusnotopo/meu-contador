import { motion } from "framer-motion";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
}

export const Skeleton = ({
  className = "",
  variant = "text",
  width,
  height,
}: SkeletonProps) => {
  const baseClasses = "animate-pulse bg-muted rounded";

  const variantClasses = {
    text: "h-4 w-full",
    circular: "rounded-full",
    rectangular: "rounded-lg",
  };

  const style = {
    width: width || undefined,
    height: height || undefined,
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
    />
  );
};

// Card skeleton for loading states
export const CardSkeleton = () => {
  return (
    <div className="bg-card rounded-2xl p-6 shadow-card border border-border">
      <div className="flex items-center justify-between mb-4">
        <Skeleton variant="circular" width={48} height={48} />
        <Skeleton width={80} height={24} />
      </div>
      <Skeleton className="mb-2" width="60%" height={20} />
      <Skeleton width="40%" height={32} />
    </div>
  );
};

// Transaction list skeleton
export const TransactionListSkeleton = () => {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <Skeleton variant="circular" width={40} height={40} />
              <div className="flex-1">
                <Skeleton width="40%" height={16} className="mb-2" />
                <Skeleton width="25%" height={12} />
              </div>
            </div>
            <Skeleton width={80} height={20} />
          </div>
        </div>
      ))}
    </div>
  );
};

// AI Insights skeleton
export const AIInsightsSkeleton = () => {
  return (
    <div className="bg-card rounded-2xl p-6 shadow-card border border-border min-h-[300px]">
      <div className="flex items-center gap-2 mb-6">
        <Skeleton variant="circular" width={24} height={24} />
        <Skeleton width={150} height={20} />
      </div>

      <div className="flex flex-col items-center justify-center py-6 mb-6">
        <Skeleton
          variant="circular"
          width={100}
          height={100}
          className="mb-4"
        />
        <Skeleton width={120} height={16} />
      </div>

      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-muted/50 p-3 rounded-lg">
            <Skeleton width="90%" height={14} className="mb-2" />
            <Skeleton width="70%" height={14} />
          </div>
        ))}
      </div>
    </div>
  );
};

// Animated wrapper for smooth entrances
export const FadeIn = ({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      {children}
    </motion.div>
  );
};

// Scale animation for cards
export const ScaleIn = ({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {children}
    </motion.div>
  );
};
