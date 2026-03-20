import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { m, AnimatePresence } from 'motion/react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchDueCards,
  fetchStats,
  startSession,
} from '../../store/slices/srsSlice';
import FlashcardForm from './FlashcardForm';

export default function SRSDashboard() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { stats, cards, dueCards, loading } = useAppSelector((state) => state.srs);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    dispatch(fetchStats());
    dispatch(fetchDueCards());
  }, [dispatch]);

  const handleStartReview = () => {
    dispatch(startSession());
    navigate('/app/srs/review');
  };

  const localTotal = cards.length;
  const localDueNow = dueCards.length;
  
  const displayStats = {
    total: stats.total > 0 ? stats.total : localTotal,
    dueNow: stats.dueNow > 0 ? stats.dueNow : localDueNow,
    new: stats.new > 0 ? stats.new : localTotal, // Assume all cards are new if no API data
    learning: stats.learning || 0,
    mastered: stats.mastered || 0,
  };

  const masteryPercent = displayStats.total > 0 
    ? Math.round((displayStats.mastered / displayStats.total) * 100) 
    : 0;

  return (
    <m.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">📚 Flashcards</h1>
        <p className="text-stone-600 dark:text-stone-400">
          Master concepts with the scientifically-proven SM-2 algorithm
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatsCard
          label="Due Now"
          value={displayStats.dueNow}
          icon="🔥"
          color="text-orange-500"
          delay={0}
        />
        <StatsCard
          label="New Cards"
          value={displayStats.new}
          icon="✨"
          color="text-amber-500"
          delay={0.1}
        />
        <StatsCard
          label="Learning"
          value={displayStats.learning}
          icon="📖"
          color="text-rose-500"
          delay={0.2}
        />
        <StatsCard
          label="Mastered"
          value={displayStats.mastered}
          icon="🏆"
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
          <h3 className="font-medium">Overall Mastery</h3>
          <span className="text-2xl font-bold text-amber-500">{masteryPercent}%</span>
        </div>
        <div className="h-3 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
          <m.div
            initial={{ width: 0 }}
            animate={{ width: `${masteryPercent}%` }}
            transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
          />
        </div>
        <div className="flex justify-between mt-2 text-sm text-stone-500">
          <span>{displayStats.mastered} cards mastered</span>
          <span>{displayStats.total} total cards</span>
        </div>
      </m.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <m.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleStartReview}
          disabled={displayStats.dueNow === 0}
          className={`relative overflow-hidden p-6 rounded-2xl text-left transition-all group
            ${displayStats.dueNow > 0
              ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white hover:shadow-lg hover:shadow-amber-500/25'
              : 'bg-stone-100 dark:bg-stone-800 cursor-not-allowed opacity-60'
            }`}
        >
          <div className="relative z-10">
            <span className="text-3xl mb-3 block">🎯</span>
            <h3 className="text-lg font-bold mb-1">
              {displayStats.dueNow > 0 ? 'Start Review' : 'All Caught Up!'}
            </h3>
            <p className="text-sm opacity-80">
              {displayStats.dueNow > 0
                ? `${displayStats.dueNow} cards waiting for you`
                : 'No cards due for review'}
            </p>
          </div>
          {displayStats.dueNow > 0 && (
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-700" />
          )}
        </m.button>

        <m.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowAddForm(true)}
          className="p-6 rounded-2xl text-left bg-stone-900 dark:bg-stone-100 text-stone-100 dark:text-stone-900 hover:opacity-90 transition-all group relative overflow-hidden"
        >
          <div className="relative z-10">
            <span className="text-3xl mb-3 block">➕</span>
            <h3 className="text-lg font-bold mb-1">Add New Card</h3>
            <p className="text-sm opacity-70">Create a flashcard manually</p>
          </div>
        </m.button>
      </div>

      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6"
      >
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <span>🧠</span> How It Works
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { emoji: '📝', title: 'Review', desc: 'See the question' },
            { emoji: '🤔', title: 'Recall', desc: 'Think of the answer' },
            { emoji: '⭐', title: 'Rate', desc: 'How well you knew it' },
            { emoji: '📅', title: 'Schedule', desc: 'SM-2 sets next review' },
          ].map((step, i) => (
            <div key={step.title} className="text-center p-3">
              <span className="text-2xl mb-2 block">{step.emoji}</span>
              <h4 className="font-medium text-sm">{step.title}</h4>
              <p className="text-stone-500 text-xs mt-1">{step.desc}</p>
            </div>
          ))}
        </div>
      </m.div>

      <AnimatePresence>
        {showAddForm && (
          <FlashcardForm onClose={() => setShowAddForm(false)} />
        )}
      </AnimatePresence>
    </m.div>
  );
}

function StatsCard({ label, value, icon, color, delay }) {
  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-4"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xl">{icon}</span>
        <span className={`text-2xl font-bold ${color}`}>
          {value}
        </span>
      </div>
      <p className="text-stone-500 text-sm">{label}</p>
    </m.div>
  );
}
