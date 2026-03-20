import { m } from 'motion/react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { useEffect } from 'react';
import { initializeDailyQuests, completeQuest } from '../../store/slices/gamificationSlice';

export default function DailyQuests() {
  const dispatch = useAppDispatch();
  const { dailyQuests } = useAppSelector((state) => state.gamification);

  useEffect(() => {
    if (dailyQuests.length === 0) {
      dispatch(initializeDailyQuests());
    }
  }, [dispatch, dailyQuests.length]);

  const totalXP = dailyQuests.reduce((sum, q) => sum + q.xp, 0);
  const earnedXP = dailyQuests
    .filter(q => q.completed)
    .reduce((sum, q) => sum + q.xp, 0);
  const completedCount = dailyQuests.filter(q => q.completed).length;

  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const hoursLeft = Math.floor((midnight - now) / (1000 * 60 * 60));
  const minutesLeft = Math.floor(((midnight - now) % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden"
    >
      <div className="p-5 border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📋</span>
            <div>
              <h3 className="font-semibold">Daily Quests</h3>
              <p className="text-xs text-stone-500">
                Resets in {hoursLeft}h {minutesLeft}m
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold text-amber-500">{earnedXP}</span>
            <span className="text-stone-400 text-sm"> / {totalXP} XP</span>
          </div>
        </div>

        <div className="mt-3 h-2 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
          <m.div
            initial={{ width: 0 }}
            animate={{ width: `${dailyQuests.length > 0 ? (completedCount / dailyQuests.length) * 100 : 0}%` }}
            transition={{ duration: 0.5 }}
            className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
          />
        </div>
      </div>

      <div className="divide-y divide-stone-100 dark:divide-stone-800">
        {dailyQuests.map((quest, index) => (
          <QuestItem 
            key={quest.id} 
            quest={quest} 
            index={index}
          />
        ))}
      </div>

      {completedCount === dailyQuests.length && dailyQuests.length > 0 && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 bg-emerald-50 dark:bg-emerald-900/20 text-center"
        >
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
            🎉 All quests completed! Come back tomorrow for more.
          </span>
        </m.div>
      )}
    </m.div>
  );
}

function QuestItem({ quest, index }) {
  const dispatch = useAppDispatch();
  
  const progress = quest.progress || 0;
  const target = quest.target || 1;
  const progressPercent = Math.min((progress / target) * 100, 100);

  const handleComplete = () => {
    dispatch(completeQuest(quest.id));
  };

  return (
    <m.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`p-4 transition-all ${
        quest.completed 
          ? 'bg-emerald-50/50 dark:bg-emerald-900/10' 
          : 'hover:bg-stone-50 dark:hover:bg-stone-800/50'
      }`}
    >
      <div className="flex items-center gap-4">
        <div 
          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
            quest.completed
              ? 'bg-emerald-500 text-white'
              : 'bg-stone-100 dark:bg-stone-800 text-stone-400'
          }`}
        >
          {quest.completed ? '✓' : (index + 1)}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className={`font-medium text-sm ${quest.completed ? 'line-through text-stone-400' : ''}`}>
            {quest.title}
          </h4>
          
          {!quest.completed && quest.target && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-500 rounded-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-xs text-stone-500">
                {progress}/{target}
              </span>
            </div>
          )}
        </div>

        <div className={`text-right flex-shrink-0 ${quest.completed ? 'text-emerald-500' : 'text-amber-500'}`}>
          <span className="font-semibold text-sm">
            {quest.completed ? '✓ ' : '+'}{quest.xp} XP
          </span>
        </div>
      </div>
    </m.div>
  );
}
