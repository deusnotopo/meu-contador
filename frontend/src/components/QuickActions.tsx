import { motion } from 'framer-motion';
import { Plus, Zap } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';

interface QuickActionsProps {
  onNewTransaction?: () => void;
  onNewReminder?: () => void;
}

export function QuickActions({ onNewTransaction, onNewReminder }: QuickActionsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    {
      icon: Plus,
      label: 'Nova Transação',
      onClick: onNewTransaction,
      color: 'bg-indigo-500 hover:bg-indigo-600',
      shortcut: 'Ctrl+N',
    },
    {
      icon: Zap,
      label: 'Novo Lembrete',
      onClick: onNewReminder,
      color: 'bg-emerald-500 hover:bg-emerald-600',
      shortcut: 'Ctrl+R',
    },
  ];

  return (
    <div className="fixed bottom-24 right-8 z-40">
      {/* Action buttons */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="flex flex-col gap-3 mb-4"
        >
          {actions.map((action, index) => (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => {
                action.onClick?.();
                setIsOpen(false);
              }}
              className={`${action.color} text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-3 transition-all hover:scale-105 group`}
              aria-label={action.label}
              title={`${action.label} (${action.shortcut})`}
            >
              <action.icon className="w-5 h-5" aria-hidden="true" />
              <span className="font-semibold text-sm">{action.label}</span>
              <span className="text-xs opacity-70 ml-2">{action.shortcut}</span>
            </motion.button>
          ))}
        </motion.div>
      )}

      {/* Main FAB */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-16 h-16 rounded-full shadow-2xl transition-all ${
          isOpen
            ? 'bg-red-500 hover:bg-red-600 rotate-45'
            : 'bg-indigo-600 hover:bg-indigo-700'
        }`}
        aria-label={isOpen ? 'Fechar ações rápidas' : 'Abrir ações rápidas'}
        aria-expanded={isOpen}
      >
        <Plus className="w-8 h-8" aria-hidden="true" />
      </Button>
    </div>
  );
}
