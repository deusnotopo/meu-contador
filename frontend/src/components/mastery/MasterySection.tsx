import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Flame, Star, Award, Zap, ChevronRight, ShieldCheck } from 'lucide-react';
import { useGamification } from '@/hooks/useGamification';
import type { TabType } from '@/types/navigation';
import type { Achievement } from '@/types/gamification';

interface MasterySectionProps {
  onBack?: (tab: TabType) => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, y: 0, 
    transition: { type: "spring", stiffness: 100, damping: 15 }
  },
};

export const MasterySection: React.FC<MasterySectionProps> = ({ onBack }) => {
  const { 
    level, 
    achievements, 
    streaks, 
    unlockedAchievements,
  } = useGamification();

  const xpPercentage = (level.currentXp / level.xpToNextLevel) * 100;

  const getRarityColor = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'legendary': return 'var(--amber)';
      case 'epic': return 'var(--purple)';
      case 'rare': return 'var(--blue)';
      default: return 'var(--t3)';
    }
  };

  const getRarityGlow = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'legendary': return '0 0 20px rgba(251,191,36,0.4)';
      case 'epic': return '0 0 20px rgba(168,85,247,0.4)';
      case 'rare': return '0 0 20px rgba(59,130,246,0.4)';
      default: return 'none';
    }
  };

  return (
    <motion.div 
      className="p-4 pb-24"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* --- Header --- */}
      <div className="flex items-center gap-3 mb-8 pt-2">
        {onBack && (
          <button className="back-btn" onClick={() => onBack('inicio')}>
            <ArrowLeft size={16} />
          </button>
        )}
        <div>
          <div className="eyebrow" style={{ color: 'var(--blue)' }}>Progressão de Elite</div>
          <div className="page-title leading-tight" style={{ margin: 0 }}>Maestria Financeira</div>
        </div>
      </div>

      {/* --- LEVEL HERO CARD --- */}
      <motion.div variants={itemVariants} className="mb-8">
        <div 
          className="hero p-6 relative overflow-hidden" 
          style={{ 
            background: 'linear-gradient(135deg, rgba(74,139,255,0.1), rgba(0,217,145,0.05))',
            border: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          {/* Background Glow */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full" />
          
          <div className="flex items-center gap-5 mb-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center relative z-10">
                <span className="text-4xl font-black font-mono text-white tracking-tighter">{level.level}</span>
              </div>
              <div className="absolute -inset-2 bg-blue-500/20 blur-xl opacity-50 rounded-full" />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck size={16} className="text-blue-400" />
                <span className="text-xs font-bold uppercase tracking-widest text-blue-400">Título Atual</span>
              </div>
              <h2 className="text-2xl font-black text-white leading-none mb-2">{level.title}</h2>
              <div className="text-[11px] text-white/50 leading-relaxed font-medium">
                Próximo título em {5 - (level.level % 5)} níveis: <strong>{level.perks[0] || 'Vantagens Pro'}</strong>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-end text-[11px] font-bold uppercase tracking-wider px-1">
              <span className="text-white/40">Progresso XP</span>
              <span className="text-blue-400 font-mono">{level.currentXp} <span className="text-white/20">/</span> {level.xpToNextLevel}</span>
            </div>
            <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-px">
              <motion.div 
                className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full relative"
                initial={{ width: 0 }}
                animate={{ width: `${xpPercentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              >
                <div className="absolute top-0 right-0 h-full w-2 bg-white/30 blur-sm" />
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* --- STREAKS HUD --- */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {['login', 'budget', 'savings'].map((type) => {
          const streak = streaks[type];
          const labels = { login: 'Acesso', budget: 'Gastos', savings: 'Poupado' };
          const icons = { login: <Flame />, budget: <Zap />, savings: <Star /> };
          const colors = { login: 'text-orange-500', budget: 'text-yellow-400', savings: 'text-emerald-400' };
          
          return (
            <motion.div key={type} variants={itemVariants} className="card p-3 text-center border-white/5">
              <div className={`mb-2 flex justify-center ${colors[type as 'login'|'budget'|'savings']}`}>
                {React.cloneElement(icons[type as 'login'|'budget'|'savings'] as React.ReactElement, { size: 18 })}
              </div>
              <div className="text-[20px] font-black font-mono text-white mb-0.5 leading-none">
                {streak?.current || 0}
              </div>
              <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-none">
                {labels[type as 'login'|'budget'|'savings']}
              </div>
              { (streak?.current || 0) > 0 && (
                <div className="mt-2 h-1 w-8 bg-white/10 mx-auto rounded-full overflow-hidden">
                  <div className={`h-full ${colors[type as 'login'|'budget'|'savings'].replace('text', 'bg')} w-full`} />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* --- ACHIEVEMENT VAULT --- */}
      <div className="mb-4 flex items-center justify-between px-1">
        <h3 className="section-label m-0">Vault de Conquistas</h3>
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-white/40 bg-white/5 px-2.5 py-1 rounded-full">
          <Award size={12} className="text-blue-500" />
          <span>{unlockedAchievements.length} / {achievements.length}</span>
        </div>
      </div>

      <motion.div 
        variants={containerVariants} 
        className="grid grid-cols-4 gap-3"
      >
        {achievements.map((a: Achievement) => (
          <motion.div 
            key={a.id}
            variants={itemVariants}
            className={`
              aspect-square rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all
              ${a.isUnlocked ? 'bg-white/5 border-white/10' : 'bg-white/[0.02] border-white/5 grayscale pointer-events-none'}
            `}
            style={{ 
              borderWidth: '1px',
              borderStyle: 'solid',
              boxShadow: a.isUnlocked ? getRarityGlow(a.rarity) : 'none'
            }}
          >
            <div className="text-2xl filter drop-shadow-lg">{a.emoji}</div>
            <div 
              className="text-[8px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded-full"
              style={{ background: `${getRarityColor(a.rarity)}20`, color: getRarityColor(a.rarity) }}
            >
              {a.rarity}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* --- PERKS LIST --- */}
      <div className="mt-8 mb-4">
        <h3 className="section-label">Benefícios Desbloqueados</h3>
        <div className="card space-y-3">
          {level.perks.map((perk, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <ChevronRight size={14} strokeWidth={3} />
              </div>
              <span className="text-[13px] font-bold text-white/80">{perk}</span>
            </div>
          ))}
          {level.perks.length === 0 && (
            <div className="text-[13px] text-white/40 font-medium py-2">
              Nenhum benefício extra desbloqueado ainda. Continue subindo de nível!
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
