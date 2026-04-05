import { AnimatePresence, motion } from 'framer-motion';
import { Bot, X, Sparkles, Brain } from 'lucide-react';
import { useState, useCallback } from 'react';
import { AIFinancialChat } from './AIFinancialChat';
import { useFeatureFlags } from '@/context/FeatureFlagsContext';

// ─── Floating Trigger Button ──────────────────────────────────
export const AdviserTrigger = ({ onClick }: { onClick: () => void }) => {
  const { isEnabled } = useFeatureFlags();
  const isAiEnabled = isEnabled('ai_advisor');
  
  return (
    <motion.button
      id="adviser-trigger-btn"
      onClick={onClick}
      className="adviser-fab"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.8 }}
      title="Consultor Neural"
      aria-label="Abrir Consultor de Inteligência Artificial"
    >
      {/* Pulse ring */}
      <motion.span
        className="adviser-fab-ring"
        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
        transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
      />
      <div className="adviser-fab-inner">
        {isAiEnabled ? (
          <Brain size={22} className="text-white" />
        ) : (
          <Bot size={22} className="text-white" />
        )}
      </div>
    </motion.button>
  );
};

// ─── Full Overlay Sheet ───────────────────────────────────────
interface AdviserOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdviserOverlay = ({ isOpen, onClose }: AdviserOverlayProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="adviser-backdrop"
            className="adviser-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            key="adviser-sheet"
            className="adviser-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 350, damping: 36 }}
          >
            {/* Sheet Handle */}
            <div className="adviser-handle-bar" />

            {/* Header */}
            <div className="adviser-header">
              <div className="adviser-header-identity">
                <div className="adviser-header-icon">
                  <Brain size={20} className="text-violet-300" />
                  <motion.span
                    className="adviser-header-pulse"
                    animate={{ scale: [1, 1.6, 1], opacity: [1, 0, 1] }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                  />
                </div>
                <div>
                  <div className="adviser-eyebrow">
                    <Sparkles size={10} className="inline mr-1" />
                    CONSULTOR NEURAL
                  </div>
                  <div className="adviser-title">Inteligência Financeira</div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="adviser-close-btn"
                aria-label="Fechar consultor"
              >
                <X size={18} />
              </button>
            </div>

            {/* Chat Body */}
            <div className="adviser-body">
              <AIFinancialChat onClose={onClose} />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// ─── Combined Hook + Components export ───────────────────────
export const useAdviser = () => {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  return { isOpen, open, close };
};
