import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { m, AnimatePresence } from 'motion/react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchDueCards,
  fetchStats,
  reviewCard,
  endSession,
} from '../../store/slices/srsSlice';
import { syncXPToBackend, trackCardReviewed } from '../../store/slices/gamificationSlice';

export default function ReviewSession() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { dueCards, session, loading } = useAppSelector((state) => state.srs);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [reviewError, setReviewError] = useState('');

  useEffect(() => {
    dispatch(fetchDueCards());
  }, [dispatch]);

  const currentCard = dueCards[session.currentIndex];
  const progress = dueCards.length > 0
    ? ((session.currentIndex) / dueCards.length) * 100
    : 0;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === ' ' && !isFlipped) {
        e.preventDefault();
        setIsFlipped(true);
      }
      if (isFlipped && !loading.action) {
        if (e.key === '1') handleRate(0);
        if (e.key === '2') handleRate(2);
        if (e.key === '3') handleRate(3);
        if (e.key === '4') handleRate(5);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, currentCard, loading.action]);

  const handleRate = async (quality) => {
    if (!currentCard || loading.action) return;
    const wasLastCard = session.currentIndex >= dueCards.length - 1;
    setReviewError('');

    setIsExiting(true);

    try {
      await dispatch(reviewCard({ id: currentCard._id, quality })).unwrap();

      const xpEarned = quality >= 3 ? (quality === 5 ? 10 : 5) : 2;
      dispatch(syncXPToBackend({ amount: xpEarned, reason: 'flashcard_review' }));
      dispatch(trackCardReviewed());

      dispatch(fetchStats());

      setIsFlipped(false);

      if (wasLastCard) {
        dispatch(endSession());
        navigate('/app/srs');
      }
    } catch (error) {
      console.error('Failed to submit review:', error);
      setReviewError('Could not save your review. Please try again.');
    } finally {
      setIsExiting(false);
    }
  };

  const handleEndSession = () => {
    dispatch(endSession());
    navigate('/app/srs');
  };

  if (!loading.cards && dueCards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <m.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <span className="text-6xl mb-4 block">🎉</span>
          <h2 className="text-2xl font-bold mb-2">All caught up!</h2>
          <p className="text-stone-500 dark:text-stone-400 mb-6">No cards due for review right now.</p>
          <m.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/app/srs')}
            className="px-6 py-3 bg-stone-900 dark:bg-stone-100 text-stone-100 dark:text-stone-900 rounded-xl font-medium"
          >
            Back to Dashboard
          </m.button>
        </m.div>
      </div>
    );
  }

  if (loading.cards && dueCards.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-stone-500">Loading cards...</p>
        </div>
      </div>
    );
  }

  return (
    <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="max-w-2xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={handleEndSession}
            className="text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors flex items-center gap-2 text-sm"
          >
            <span>←</span> End Session
          </button>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-stone-500">
              {session.currentIndex + 1} / {dueCards.length}
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              ✓ {session.correct}
            </span>
          </div>
        </div>

        <div className="h-2 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
          <m.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-gradient-to-r from-amber-500 to-orange-500"
          />
        </div>
      </div>

      {reviewError && (
        <div className="max-w-2xl mx-auto mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800/60 dark:bg-red-900/20 dark:text-red-300">
          {reviewError}
        </div>
      )}

      <div className="max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          {currentCard && (
            <m.div
              key={currentCard._id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: isExiting ? 0 : 1, x: isExiting ? -50 : 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="perspective-1000"
            >
              <div
                className="relative h-80 cursor-pointer transition-transform duration-500"
                onClick={() => !isFlipped && setIsFlipped(true)}
                style={{
                  transformStyle: 'preserve-3d',
                  transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                }}
              >
                <div
                  className="absolute inset-0 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-8 flex flex-col justify-center items-center text-center"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <div className="text-xs text-stone-400 mb-4 flex items-center gap-2">
                    {currentCard.tags?.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-stone-100 dark:bg-stone-800 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <p className="text-lg font-medium whitespace-pre-wrap leading-relaxed">
                    {currentCard.front}
                  </p>
                  <p className="text-stone-400 text-sm mt-6">
                    Tap to reveal answer
                  </p>
                </div>

                <div
                  className="absolute inset-0 bg-amber-50 dark:bg-stone-800 border border-amber-200 dark:border-amber-900/30 rounded-2xl p-8 flex flex-col justify-center items-center text-center"
                  style={{
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                  }}
                >
                  <span className="text-xs text-amber-600 dark:text-amber-400 mb-4 font-medium">Answer</span>
                  <p className="text-lg whitespace-pre-wrap leading-relaxed">
                    {currentCard.back}
                  </p>
                </div>
              </div>
            </m.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isFlipped && (
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mt-8"
            >
              <p className="text-center text-stone-500 mb-4 text-sm">How well did you know it?</p>
              <div className="grid grid-cols-4 gap-3">
                <RatingButton
                  onClick={() => handleRate(0)}
                  label="Again"
                  sublabel="<1min"
                  className="bg-red-500 hover:bg-red-600"
                  disabled={loading.action}
                />
                <RatingButton
                  onClick={() => handleRate(2)}
                  label="Hard"
                  sublabel="~6min"
                  className="bg-orange-500 hover:bg-orange-600"
                  disabled={loading.action}
                />
                <RatingButton
                  onClick={() => handleRate(3)}
                  label="Good"
                  sublabel={currentCard?.interval <= 1 ? '1d' : `${currentCard?.interval}d`}
                  className="bg-emerald-500 hover:bg-emerald-600"
                  disabled={loading.action}
                />
                <RatingButton
                  onClick={() => handleRate(5)}
                  label="Easy"
                  sublabel={currentCard?.interval <= 1 ? '4d' : `${Math.round(currentCard?.interval * 1.5)}d`}
                  className="bg-amber-500 hover:bg-amber-600"
                  disabled={loading.action}
                />
              </div>
            </m.div>
          )}
        </AnimatePresence>

        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 text-center"
        >
          <p className="text-stone-400 text-xs">
            Tip: Press space to flip, 1-4 to rate
          </p>
        </m.div>
      </div>

      <style>{`
        .perspective-1000 {
          perspective: 1000px;
        }
      `}</style>
    </m.div>
  );
}

function RatingButton({ onClick, label, sublabel, className, disabled }) {
  return (
    <m.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={`${className} py-4 rounded-xl text-white font-medium transition-all
        disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      <span className="block text-base">{label}</span>
      <span className="block text-xs opacity-80">{sublabel}</span>
    </m.button>
  );
}
