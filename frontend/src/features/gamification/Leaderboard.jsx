import { m } from 'motion/react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { useEffect } from 'react';
import { fetchLeaderboard } from '../../store/slices/gamificationSlice';

const LEAGUES = [
  { name: 'bronze', color: 'from-amber-700 to-amber-900', icon: '🥉', minXP: 0 },
  { name: 'silver', color: 'from-slate-400 to-slate-600', icon: '🥈', minXP: 500 },
  { name: 'gold', color: 'from-yellow-400 to-amber-500', icon: '🥇', minXP: 2000 },
  { name: 'platinum', color: 'from-cyan-400 to-blue-500', icon: '💎', minXP: 5000 },
  { name: 'diamond', color: 'from-violet-400 to-purple-600', icon: '👑', minXP: 10000 },
];

export default function Leaderboard() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { weeklyXP, leaderboard, leaderboardLoading } = useAppSelector((state) => state.gamification);

  useEffect(() => {
    dispatch(fetchLeaderboard());
  }, [dispatch]);

  const currentUserId = user?.id || 'current';
  const userPosition = leaderboard.findIndex(p => p.id === currentUserId) + 1 || null;

  const userXP = user?.totalXP || weeklyXP || 0;
  const currentLeague = LEAGUES.slice().reverse().find(l => userXP >= l.minXP) || LEAGUES[0];
  const nextLeague = LEAGUES[LEAGUES.indexOf(currentLeague) + 1];
  const progressToNext = nextLeague 
    ? ((userXP - currentLeague.minXP) / (nextLeague.minXP - currentLeague.minXP)) * 100
    : 100;

  if (leaderboardLoading && leaderboard.length === 0) {
    return (
      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-8"
      >
        <div className="flex items-center justify-center gap-3">
          <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-stone-500">Loading leaderboard...</span>
        </div>
      </m.div>
    );
  }

  if (!leaderboardLoading && leaderboard.length === 0) {
    return (
      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-8 text-center"
      >
        <span className="text-4xl mb-3 block">🏆</span>
        <h3 className="font-semibold mb-1">No Rankings Yet</h3>
        <p className="text-stone-500 text-sm">Be the first to earn XP and climb the leaderboard!</p>
      </m.div>
    );
  }

  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden"
    >
      <div className="p-5 border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏆</span>
            <div>
              <h3 className="font-semibold">Weekly Leaderboard</h3>
              <p className="text-xs text-stone-500">Compete with other learners</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xl">{currentLeague.icon}</span>
            <span className="block text-xs text-stone-500">{currentLeague.name} League</span>
          </div>
        </div>

        {nextLeague && (
          <div>
            <div className="flex justify-between text-xs text-stone-500 mb-1">
              <span>{currentLeague.name}</span>
              <span>{nextLeague.name}</span>
            </div>
            <div className="h-2 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
              <m.div
                initial={{ width: 0 }}
                animate={{ width: `${progressToNext}%` }}
                transition={{ duration: 0.8 }}
                className={`h-full bg-gradient-to-r ${currentLeague.color} rounded-full`}
              />
            </div>
            <p className="text-xs text-stone-500 mt-1 text-center">
              {nextLeague.minXP - userXP} XP to {nextLeague.name}
            </p>
          </div>
        )}
      </div>

      {leaderboard.length >= 3 && (
        <div className="p-5 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50">
          <div className="flex items-end justify-center gap-4">
            {leaderboard[1] && (
              <PodiumSpot 
                player={leaderboard[1]} 
                position={2}
                height="h-20"
              />
            )}
            {leaderboard[0] && (
              <PodiumSpot 
                player={leaderboard[0]} 
                position={1}
                height="h-28"
              />
            )}
            {leaderboard[2] && (
              <PodiumSpot 
                player={leaderboard[2]} 
                position={3}
                height="h-16"
              />
            )}
          </div>
        </div>
      )}

      <div className="divide-y divide-stone-100 dark:divide-stone-800">
        {leaderboard.slice(3).map((player, index) => (
          <LeaderboardRow 
            key={player.id} 
            player={player} 
            position={index + 4}
            isCurrentUser={player.id === currentUserId}
          />
        ))}
      </div>

      {userPosition && userPosition > leaderboard.length && (
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border-t border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-amber-600">#{userPosition}</span>
            <span className="font-medium">You</span>
            <span className="ml-auto text-amber-600 font-semibold">{weeklyXP} XP</span>
          </div>
        </div>
      )}
    </m.div>
  );
}

function PodiumSpot({ player, position, height }) {
  const colors = {
    1: 'from-yellow-400 to-amber-500',
    2: 'from-slate-300 to-slate-500',
    3: 'from-amber-600 to-amber-800',
  };
  const medals = { 1: '🥇', 2: '🥈', 3: '🥉' };

  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: position * 0.1 }}
      className="flex flex-col items-center"
    >
      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${colors[position]} flex items-center justify-center text-white font-bold mb-2`}>
        {player.name.charAt(0)}
      </div>
      <span className="text-xs font-medium text-center w-20 truncate">{player.name}</span>
      <span className="text-xs text-amber-500 font-semibold">{player.xp} XP</span>
      <div className={`${height} w-20 bg-gradient-to-t ${colors[position]} rounded-t-lg mt-2 flex items-center justify-center`}>
        <span className="text-2xl">{medals[position]}</span>
      </div>
    </m.div>
  );
}

function LeaderboardRow({ player, position, isCurrentUser }) {
  return (
    <m.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: position * 0.05 }}
      className={`p-4 flex items-center gap-4 ${
        isCurrentUser ? 'bg-amber-50 dark:bg-amber-900/20' : ''
      }`}
    >
      <span className="w-8 text-center font-semibold text-stone-500">
        {position}
      </span>
      <div className="w-10 h-10 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center font-medium">
        {player.name.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <span className="font-medium block truncate">
          {player.name}
          {isCurrentUser && <span className="text-amber-500 ml-2">(You)</span>}
        </span>
        <span className="text-xs text-stone-500">🔥 {player.streak} day streak</span>
      </div>
      <span className="font-semibold text-amber-500">{player.xp} XP</span>
    </m.div>
  );
}
