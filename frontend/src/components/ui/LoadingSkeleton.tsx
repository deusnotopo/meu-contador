import { motion } from "framer-motion";

const Skeleton = ({ className }: { className?: string }) => (
  <div className={`relative overflow-hidden bg-white/5 rounded-2xl ${className}`}>
    <motion.div
      initial={{ x: "-100%" }}
      animate={{ x: "200%" }}
      transition={{ 
        repeat: Infinity, 
        duration: 1.5, 
        ease: "easeInOut" 
      }}
      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent shadow-[0_0_20px_rgba(255,255,255,0.02)]"
    />
  </div>
);

export const LoadingSkeleton = () => {
  return (
    <div className="space-y-12 animate-fade-in pb-12 pt-6">
      <Skeleton className="h-80 w-full rounded-[2.5rem]" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[500px]">
        <Skeleton className="lg:col-span-2 h-full" />
        <div className="space-y-8">
            <Skeleton className="h-full" />
        </div>
      </div>
    </div>
  );
};

export default LoadingSkeleton;
