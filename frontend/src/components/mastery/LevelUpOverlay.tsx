import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ChevronRight } from 'lucide-react';
import { useGamification } from '@/hooks/useGamification';
import { Celebration } from '@/components/ui/Celebration';

export const LevelUpOverlay: React.FC = () => {
  const { level } = useGamification();
  const [showOverlay, setShowOverlay] = useState(false);
  const [previousLevel, setPreviousLevel] = useState(level.level);
  const [triggerConfetti, setTriggerConfetti] = useState(false);

  useEffect(() => {
    if (level.level > previousLevel) {
      // User leveled up!
      setShowOverlay(true);
      setTriggerConfetti(true);
      setPreviousLevel(level.level);

      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setShowOverlay(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [level.level, previousLevel]);

  return (
    <>
      <Celebration isVisible={triggerConfetti} onComplete={() => setTriggerConfetti(false)} />
      <AnimatePresence>
      {showOverlay && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowOverlay(false)}
        >
          <motion.div
            className="w-full max-w-sm rounded-[24px] p-6 text-center text-white relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(74,139,255,0.15), rgba(0,217,145,0.1))',
              border: '1px solid rgba(255,255,255,0.15)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4), inset 0 0 40px rgba(74,139,255,0.1)',
            }}
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking content
          >
            {/* Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-blue-500/30 blur-[60px] rounded-full pointer-events-none" />

            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: 'spring', damping: 15 }}
              className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-blue-500 to-emerald-400 flex items-center justify-center shadow-lg border border-white/20"
            >
              <ShieldCheck size={48} className="text-white drop-shadow-md" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-blue-300 mb-2">
                Level Up!
              </h2>
              <h3 className="text-4xl font-black mb-4">Nível {level.level}</h3>
              <p className="text-lg font-medium text-white/80 mb-6">
                Título: <span className="text-emerald-400 font-bold">{level.title}</span>
              </p>

              {level.perks.length > 0 && (
                <div className="bg-black/30 rounded-xl p-4 border border-white/5 text-left mb-6">
                  <div className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-2">
                    Novos Benefícios
                  </div>
                  {level.perks.map((perk, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm font-medium text-white/90">
                      <ChevronRight size={14} className="text-emerald-400" />
                      {perk}
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => setShowOverlay(false)}
                className="w-full py-3.5 rounded-xl font-bold bg-white/10 hover:bg-white/20 transition-colors border border-white/10"
              >
                Continuar
              </button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
};
