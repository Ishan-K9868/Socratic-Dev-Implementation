import { m } from 'motion/react';
import { useAppSelector } from '../../store/hooks';

const ACHIEVEMENTS = [
  { 
    id: 'first_chat', 
    name: 'First Steps', 
    description: 'Send your first message to the AI tutor', 
    icon: '💬', 
    xp: 10,
    category: 'basics'
  },
  { 
    id: 'streak_3', 
    name: 'Consistent', 
    description: '3-day learning streak', 
    icon: '🔥', 
    xp: 25,
    category: 'dedication'
  },
  { 
    id: 'streak_7', 
    name: 'Week Warrior', 
    description: '7-day learning streak', 
    icon: '🔥', 
    xp: 50,
    category: 'dedication'
  },
  { 
    id: 'streak_30', 
    name: 'Monthly Master', 
    description: '30-day learning streak', 
    icon: '👑', 
    xp: 200,
    category: 'dedication'
  },
  { 
    id: 'cards_10', 
    name: 'Card Collector', 
    description: 'Create 10 flashcards', 
    icon: '📚', 
    xp: 15,
    category: 'srs'
  },
  { 
    id: 'cards_100', 
    name: 'Memory Master', 
    description: 'Create 100 flashcards', 
    icon: '🧠', 
    xp: 100,
    category: 'srs'
  },
  { 
    id: 'dojo_first', 
    name: 'Dojo Initiate', 
    description: 'Complete your first challenge', 
    icon: '🥋', 
    xp: 15,
    category: 'dojo'
  },
  { 
    id: 'dojo_all', 
    name: 'Dojo Master', 
    description: 'Try all challenge types', 
    icon: '🏯', 
    xp: 75,
    category: 'dojo'
  },
  { 
    id: 'xp_100', 
    name: 'Getting Started', 
    description: 'Earn 100 XP total', 
    icon: '⭐', 
    xp: 10,
    category: 'progress'
  },
  { 
    id: 'xp_1000', 
    name: 'Rising Star', 
    description: 'Earn 1,000 XP total', 
    icon: '🌟', 
    xp: 50,
    category: 'progress'
  },
  { 
    id: 'xp_5000', 
    name: 'Superstar', 
    description: 'Earn 5,000 XP total', 
    icon: '✨', 
    xp: 100,
    category: 'progress'
  },
  { 
    id: 'night_owl', 
    name: 'Night Owl', 
    description: 'Study past midnight', 
    icon: '🦉', 
    xp: 15,
    category: 'special'
  },
];

export default function Achievements() {
  const { unlockedAchievements, stats } = useAppSelector((state) => state.gamification);
  const { user } = useAppSelector((state) => state.auth);

  const allUnlocked = unlockedAchievements || [];
  
  const totalXPFromAchievements = ACHIEVEMENTS
    .filter(a => allUnlocked.includes(a.id))
    .reduce((sum, a) => sum + a.xp, 0);

  return (
    <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">★ Achievements</h1>
        <p className="text-stone-600 dark:text-stone-400">
          Collect badges and earn bonus XP
        </p>
      </div>

      <m.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 mb-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-lg">Your Progress</h3>
            <p className="text-stone-500 text-sm mt-1">
              {allUnlocked.length} of {ACHIEVEMENTS.length} achievements unlocked
            </p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-amber-500">{totalXPFromAchievements}</span>
            <span className="text-stone-500 text-sm block">bonus XP earned</span>
          </div>
        </div>
        <div className="mt-4 h-3 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
          <m.div
            initial={{ width: 0 }}
            animate={{ width: `${(allUnlocked.length / ACHIEVEMENTS.length) * 100}%` }}
            transition={{ duration: 1, delay: 0.3 }}
            className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
          />
        </div>
      </m.div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {ACHIEVEMENTS.map((achievement, index) => {
          const isUnlocked = allUnlocked.includes(achievement.id);
          
          return (
            <m.div
              key={achievement.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + index * 0.03 }}
              className={`relative overflow-hidden rounded-2xl p-5 text-center transition-all ${
                isUnlocked
                  ? 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-2 border-amber-400 dark:border-amber-600'
                  : 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 opacity-60 grayscale'
              }`}
            >
              {isUnlocked && (
                <div className="absolute inset-0 bg-gradient-to-t from-amber-500/10 to-transparent pointer-events-none" />
              )}
              
              <div className="relative z-10">
                <span className="text-4xl block mb-3">
                  {isUnlocked ? achievement.icon : '🔒'}
                </span>
                <h4 className="font-semibold text-sm mb-1">{achievement.name}</h4>
                <p className="text-xs text-stone-500 mb-2 line-clamp-2">
                  {achievement.description}
                </p>
                <span className={`text-xs font-medium ${
                  isUnlocked ? 'text-amber-600 dark:text-amber-400' : 'text-stone-400'
                }`}>
                  +{achievement.xp} XP
                </span>
              </div>

              {isUnlocked && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
            </m.div>
          );
        })}
      </div>

      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 flex flex-wrap gap-3 justify-center text-xs text-stone-500"
      >
        <span className="px-3 py-1 bg-stone-100 dark:bg-stone-800 rounded-full">💬 Basics</span>
        <span className="px-3 py-1 bg-stone-100 dark:bg-stone-800 rounded-full">🔥 Dedication</span>
        <span className="px-3 py-1 bg-stone-100 dark:bg-stone-800 rounded-full">📚 SRS</span>
        <span className="px-3 py-1 bg-stone-100 dark:bg-stone-800 rounded-full">🥋 Dojo</span>
        <span className="px-3 py-1 bg-stone-100 dark:bg-stone-800 rounded-full">⭐ Progress</span>
      </m.div>
    </m.div>
  );
}
