import { m } from 'motion/react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { useEffect } from 'react';
import { fetchStats } from '../../store/slices/srsSlice';

export default function AnalyticsDashboard() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { stats: srsStats, cards, dueCards } = useAppSelector((state) => state.srs);
  const { dailyXPProgress, dailyXPGoal, weeklyXP, stats: gamificationStats, unlockedAchievements } = useAppSelector((state) => state.gamification);

  useEffect(() => {
    dispatch(fetchStats());
  }, [dispatch]);

  const dailyProgress = Math.min((dailyXPProgress / dailyXPGoal) * 100, 100);

  const displayStats = {
    total: srsStats.total > 0 ? srsStats.total : cards.length,
    mastered: srsStats.mastered || 0,
  };

  return (
    <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">◎ Analytics</h1>
        <p className="text-stone-600 dark:text-stone-400">
          Track your progress and level up your skills
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon="⭐"
          label="Total XP"
          value={weeklyXP || 0}
          color="text-amber-500"
          delay={0}
        />
        <StatCard
          icon="🏆"
          label="League"
          value={user?.currentLeague || 'Bronze'}
          color="text-yellow-500"
          delay={0.1}
        />
        <StatCard
          icon="🔥"
          label="Streak"
          value={`${user?.currentStreak || 0} days`}
          color="text-orange-500"
          delay={0.2}
        />
        <StatCard
          icon="📚"
          label="Cards Mastered"
          value={displayStats.mastered}
          color="text-emerald-500"
          delay={0.3}
        />
      </div>

      <m.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 mb-6"
      >
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-medium flex items-center gap-2">
            <span>🎯</span> Daily Goal
          </h3>
          <span className="text-lg font-bold">
            <span className="text-amber-500">{dailyXPProgress}</span>
            <span className="text-stone-400"> / {dailyXPGoal} XP</span>
          </span>
        </div>
        <div className="h-4 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
          <m.div
            initial={{ width: 0 }}
            animate={{ width: `${dailyProgress}%` }}
            transition={{ duration: 1, delay: 0.5 }}
            className={`h-full rounded-full ${
              dailyProgress >= 100 
                ? 'bg-gradient-to-r from-emerald-500 to-green-500' 
                : 'bg-gradient-to-r from-amber-500 to-orange-500'
            }`}
          />
        </div>
        {dailyProgress >= 100 && (
          <p className="text-emerald-500 text-sm mt-2 font-medium">✓ Daily goal achieved!</p>
        )}
      </m.div>

      <m.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 mb-6"
      >
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <span>📈</span> This Week
        </h3>
        <div className="text-center py-4">
          <span className="text-5xl font-bold text-amber-500">{weeklyXP}</span>
          <span className="text-stone-500 text-lg ml-2">XP earned</span>
        </div>
      </m.div>

      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6"
      >
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <span>🧠</span> Your Activity
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryItem label="Messages Sent" value={gamificationStats.totalMessages || 0} icon="💬" />
          <SummaryItem label="Challenges Done" value={gamificationStats.totalDojoCompleted || 0} icon="🥋" />
          <SummaryItem label="Cards Reviewed" value={gamificationStats.totalCardsReviewed || 0} icon="📚" />
          <SummaryItem label="Badges Earned" value={unlockedAchievements.length || 0} icon="🏅" />
        </div>
      </m.div>
    </m.div>
  );
}

function StatCard({ icon, label, value, color, delay }) {
  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-4"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        <span className={`text-xl font-bold ${color}`}>{value}</span>
      </div>
      <p className="text-stone-500 text-sm">{label}</p>
    </m.div>
  );
}

function SummaryItem({ label, value, icon }) {
  return (
    <div className="text-center p-3 bg-stone-50 dark:bg-stone-800/50 rounded-xl">
      <span className="text-2xl mb-1 block">{icon}</span>
      <span className="text-lg font-bold block">{value}</span>
      <span className="text-xs text-stone-500">{label}</span>
    </div>
  );
}
