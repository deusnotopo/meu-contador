import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEmotionalJournal } from '@/hooks/useEmotionalJournal';
import type { EmotionType, PurchaseMotivation } from '@/types/emotional';
import { EMOTION_CONFIG, MOTIVATION_CONFIG, EMOTIONAL_TRIGGERS } from '@/types/emotional';

interface EmotionalCheckInProps {
  isOpen: boolean;
  onClose: () => void;
  transactionAmount?: number;
  transactionCategory?: string;
  onComplete?: (entry: unknown) => void;
  initialEmotion?: EmotionType | null;
}

export function EmotionalCheckIn({
  isOpen,
  onClose,
  transactionAmount,
  transactionCategory,
  onComplete,
  initialEmotion,
}: EmotionalCheckInProps) {
  const { addEntry } = useEmotionalJournal();
  const [step, setStep] = useState<'emotion' | 'motivation' | 'triggers' | 'regret'>(initialEmotion ? 'motivation' : 'emotion');
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionType | null>(initialEmotion || null);
  const [selectedMotivation, setSelectedMotivation] = useState<PurchaseMotivation | null>(null);
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [regretLevel, setRegretLevel] = useState<number>(3);
  const [satisfactionLevel, setSatisfactionLevel] = useState<number>(3);
  const [notes, setNotes] = useState('');

  const handleEmotionSelect = (emotion: EmotionType) => {
    setSelectedEmotion(emotion);
    setStep('motivation');
  };

  const handleMotivationSelect = (motivation: PurchaseMotivation) => {
    setSelectedMotivation(motivation);
    setStep('triggers');
  };

  const handleTriggerToggle = (trigger: string) => {
    setSelectedTriggers((prev) =>
      prev.includes(trigger) ? prev.filter((t) => t !== trigger) : [...prev, trigger]
    );
  };

  const handleTriggersComplete = () => {
    setStep('regret');
  };

  const handleComplete = () => {
    if (!selectedEmotion || !selectedMotivation) return;

    const entry = addEntry({
      emotion: selectedEmotion,
      motivation: selectedMotivation,
      triggers: selectedTriggers,
      regretLevel,
      satisfactionLevel,
      notes: notes.trim() || undefined,
      amount: transactionAmount,
      category: transactionCategory,
    });

    onComplete?.(entry);
    handleClose();
  };

  const handleClose = () => {
    setStep('emotion');
    setSelectedEmotion(null);
    setSelectedMotivation(null);
    setSelectedTriggers([]);
    setRegretLevel(3);
    setSatisfactionLevel(3);
    setNotes('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-md bg-[#0a0f1a] border border-white/10 rounded-3xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-xl">
              <Sparkles size={20} className="text-indigo-400" />
            </div>
            <div>
              <h3 className="font-bold text-white">Check-in Emocional</h3>
              <p className="text-xs text-slate-500">
                {step === 'emotion' && 'Como você se sente?'}
                {step === 'motivation' && 'O que motivou esta compra?'}
                {step === 'triggers' && 'O que causou essa emoção?'}
                {step === 'regret' && 'Nível de satisfação'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/5 rounded-xl transition-colors"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 min-h-[300px]">
          <AnimatePresence mode="wait">
            {/* Step 1: Emotion */}
            {step === 'emotion' && (
              <motion.div
                key="emotion"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="grid grid-cols-2 gap-3"
              >
                {(Object.entries(EMOTION_CONFIG) as [EmotionType, typeof EMOTION_CONFIG[EmotionType]][]).map(
                  ([key, config]) => (
                    <button
                      key={key}
                      onClick={() => handleEmotionSelect(key)}
                      className={`p-4 rounded-2xl border transition-all text-left ${
                        selectedEmotion === key
                          ? 'border-indigo-500 bg-indigo-500/10'
                          : 'border-white/5 hover:border-white/10 hover:bg-white/5'
                      }`}
                    >
                      <span className="text-2xl block mb-2">{config.emoji}</span>
                      <span className="text-sm font-medium text-white">{config.label}</span>
                    </button>
                  )
                )}
              </motion.div>
            )}

            {/* Step 2: Motivation */}
            {step === 'motivation' && (
              <motion.div
                key="motivation"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-3"
              >
                {(Object.entries(MOTIVATION_CONFIG) as [PurchaseMotivation, typeof MOTIVATION_CONFIG[PurchaseMotivation]][]).map(
                  ([key, config]) => (
                    <button
                      key={key}
                      onClick={() => handleMotivationSelect(key)}
                      className={`w-full p-4 rounded-2xl border transition-all text-left flex items-center gap-4 ${
                        selectedMotivation === key
                          ? 'border-indigo-500 bg-indigo-500/10'
                          : 'border-white/5 hover:border-white/10 hover:bg-white/5'
                      }`}
                    >
                      <span className="text-2xl">{config.emoji}</span>
                      <div className="flex-1">
                        <p className="font-medium text-white">{config.label}</p>
                        <p className="text-xs text-slate-500">{config.description}</p>
                      </div>
                      <div
                        className={`w-2 h-2 rounded-full ${
                          config.riskLevel === 'high'
                            ? 'bg-rose-500'
                            : config.riskLevel === 'medium'
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                      />
                    </button>
                  )
                )}
              </motion.div>
            )}

            {/* Step 3: Triggers */}
            {step === 'triggers' && (
              <motion.div
                key="triggers"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <p className="text-sm text-slate-400 mb-4">
                  Selecione o que causou essa emoção (opcional):
                </p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {EMOTIONAL_TRIGGERS.map((trigger) => (
                    <button
                      key={trigger}
                      onClick={() => handleTriggerToggle(trigger)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                        selectedTriggers.includes(trigger)
                          ? 'bg-indigo-500 text-white'
                          : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {trigger}
                    </button>
                  ))}
                </div>
                <Button
                  onClick={handleTriggersComplete}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 rounded-xl"
                >
                  Continuar
                  <ChevronRight size={16} className="ml-2" />
                </Button>
              </motion.div>
            )}

            {/* Step 4: Regret/Satisfaction */}
            {step === 'regret' && (
              <motion.div
                key="regret"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Satisfaction */}
                <div>
                  <Label className="text-sm font-medium text-slate-300 mb-3 block">
                    Nível de satisfação com esta compra:
                  </Label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <button
                        key={level}
                        onClick={() => setSatisfactionLevel(level)}
                        className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                          satisfactionLevel === level
                            ? level <= 2
                              ? 'bg-rose-500 text-white'
                              : level === 3
                              ? 'bg-amber-500 text-white'
                              : 'bg-emerald-500 text-white'
                            : 'bg-white/5 text-slate-500 hover:bg-white/10'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-600 mt-1">
                    <span>Insatisfeito</span>
                    <span>Muito satisfeito</span>
                  </div>
                </div>

                {/* Regret */}
                <div>
                  <Label className="text-sm font-medium text-slate-300 mb-3 block">
                    Nível de arrependimento:
                  </Label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <button
                        key={level}
                        onClick={() => setRegretLevel(level)}
                        className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                          regretLevel === level
                            ? level >= 4
                              ? 'bg-rose-500 text-white'
                              : level === 3
                              ? 'bg-amber-500 text-white'
                              : 'bg-emerald-500 text-white'
                            : 'bg-white/5 text-slate-500 hover:bg-white/10'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-600 mt-1">
                    <span>Sem arrependimento</span>
                    <span>Muito arrependido</span>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <Label className="text-sm font-medium text-slate-300 mb-2 block">
                    Notas (opcional):
                  </Label>
                  <Input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ex: Comprei por impulso depois de ver stories..."
                    className="bg-white/5 border-white/10 text-white rounded-xl"
                  />
                </div>

                {/* Complete */}
                <Button
                  onClick={handleComplete}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl font-bold"
                >
                  Salvar Registro Emocional
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/5 bg-white/[0.02]">
          <p className="text-center text-[10px] text-slate-600 uppercase tracking-widest">
            Journaling Emocional • Meu Contador
          </p>
        </div>
      </motion.div>
    </div>
  );
}