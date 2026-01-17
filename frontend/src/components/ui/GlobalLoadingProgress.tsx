import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import React from "react";

export const GlobalLoadingProgress: React.FC = () => {
  const { isSyncing } = useAuth();

  return (
    <AnimatePresence>
      {isSyncing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-white/5 overflow-hidden"
        >
          <motion.div
            className="h-full bg-primary shadow-[0_0_15px_rgba(14,165,233,0.8)]"
            initial={{ x: "-100%" }}
            animate={{ x: "0%" }}
            transition={{
              repeat: Infinity,
              duration: 1.5,
              ease: "easeInOut",
            }}
            style={{ width: "50%" }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
