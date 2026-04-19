import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Flame, Lock, ChevronRight } from 'lucide-react';
import { useGamification } from '@/hooks/useGamification';
import type { Achievement } from '@/hooks/useIntelligence';

const rarityColors = {
  common: 'from-gray-500 to-gray-600',
  rare: 'from-blue-500 to-blue-600',
  epic: 'from-purple-500 to-purple-600',
  legendary: 'from-amber-500 to-orange-500',
};

const rarityBorders = {
  common: 'border-gray-500/30',
  rare: 'border-blue-500/30',
  epic: 'border-purple-500/30',
  legendary: 'border-amber-500/30 shadow-lg shadow-amber-500/20',
};

export function AchievementsSection() {
  const {
    level,
    achievements,
    unlockedAchievements,
    overallProgress,
    streaks,
  } = useGamification();

  const loginStreak = streaks['login'];

  return (
    <div className="space-y-6">
      {/* Level Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600/20 via-purple-600/10 to-transparent border border-white/10 p-6"
      >
        <div className="absolute top-0 right-0 opacity-10">
          <Trophy size={120} className="text-white" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <span className="text-2xl font-black text-white">{level.level}</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{level.title}</h3>
              <p className="text-sm text-neutral-500">
                {level.totalXp.toLocaleString()} XP total
              </p>
            </div>
          </div>

          {/* XP Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-neutral-500 uppercase tracking-wider">
              <span>Progresso</span>
              <span>
                {level.currentXp} / {level.xpToNextLevel} XP
              </span>
            </div>
            <div className="h-3 bg-black/30 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                initial={{ width: 0 }}
                animate={{
                  width: `${(level.currentXp / level.xpToNextLevel) * 100}%`,
                }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
          </div>

          {/* Streak */}
          {loginStreak && loginStreak.current > 0 && (
            <div className="mt-4 flex items-center gap-2 text-sm">
              <Flame size={16} className="text-orange-400" />
              <span className="text-neutral-400">
                <span className="font-bold text-orange-400">{loginStreak.current}</span> dias de streak!
              </span>
              <span className="text-neutral-500">
                (Melhor: {loginStreak.best})
              </span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Achievements Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Trophy size={20} className="text-amber-400" />
            Conquistas
          </h3>
          <span className="text-sm text-neutral-500">
            {unlockedAchievements.length}/{achievements.length}
          </span>
        </div>

        {/* Overall Progress Bar */}
        <div className="mb-6">
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${overallProgress}%` }}
              transition={{ duration: 0.8 }}
            />
          </div>
        </div>

        {/* Achievements List */}
        <div className="space-y-3">
          <AnimatePresence>
            {achievements.map((achievement, index) => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                index={index}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function AchievementCard({
  achievement,
  index,
}: {
  achievement: Achievement;
  index: number;
}) {
  const rarity = achievement.rarity || 'common';
  const progress = achievement.progress || 0;
  const maxProgress = achievement.maxProgress || 1;
  const xpReward = achievement.xpReward || 0;
  const progressPercent = (progress / maxProgress) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`
        relative p-4 rounded-2xl border transition-all duration-300
        ${
          achievement.isUnlocked
            ? `bg-gradient-to-r ${rarityColors[rarity]}/10 ${rarityBorders[rarity]}`
            : 'bg-white/5 border-white/5 opacity-60'
        }
      `}
    >
      <div className="flex items-center gap-4">
        {/* Icon */}
        <div
          className={`
            w-12 h-12 rounded-xl flex items-center justify-center text-2xl
            ${
              achievement.isUnlocked
                ? `bg-gradient-to-br ${rarityColors[rarity]}`
                : 'bg-white/10 grayscale'
            }
          `}
        >
          {achievement.isUnlocked ? achievement.emoji : <Lock size={20} className="text-neutral-500" />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4
              className={`font-bold text-sm ${
                achievement.isUnlocked ? 'text-white' : 'text-neutral-500'
              }`}
            >
              {achievement.name}
            </h4>
            <span
              className={`
                text-[10px] font-bold uppercase px-2 py-0.5 rounded-full
                ${
                  rarity === 'legendary'
                    ? 'bg-amber-500/20 text-amber-400'
                    : rarity === 'epic'
                    ? 'bg-purple-500/20 text-purple-400'
                    : rarity === 'rare'
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-gray-500/20 text-gray-400'
                }
              `}
            >
              {rarity}
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-1">{achievement.description}</p>

          {/* Progress */}
          {!achievement.isUnlocked && maxProgress > 1 && (
            <div className="mt-2">
              <div className="flex justify-between text-[10px] text-neutral-500 mb-1">
                <span>Progresso</span>
                <span>
                  {progress}/{maxProgress}
                </span>
              </div>
              <div className="h-1.5 bg-black/20 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                />
              </div>
            </div>
          )}
        </div>

        {/* XP Reward */}
        <div className="text-right">
          <span
            className={`text-sm font-bold ${
              achievement.isUnlocked ? 'text-amber-400' : 'text-neutral-700'
            }`}
          >
            +{xpReward} XP
          </span>
          {achievement.isUnlocked && achievement.unlockedAt && (
            <p className="text-[10px] text-neutral-500 mt-1">
              {new Date(achievement.unlockedAt).toLocaleDateString('pt-BR')}
            </p>
          )}
        </div>

        {achievement.isUnlocked && (
          <ChevronRight size={16} className="text-neutral-500" />
        )}
      </div>
    </motion.div>
  );
}
