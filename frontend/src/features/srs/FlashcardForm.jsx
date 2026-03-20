import { useState } from 'react';
import { m } from 'motion/react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { createCard } from '../../store/slices/srsSlice';
import { trackCardCreated } from '../../store/slices/gamificationSlice';

export default function FlashcardForm({ onClose, initialData = null }) {
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector((state) => state.srs);

  const [form, setForm] = useState({
    front: initialData?.front || '',
    back: initialData?.back || '',
    type: initialData?.type || 'basic',
    language: initialData?.language || 'javascript',
    tags: initialData?.tags?.join(', ') || '',
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.front.trim()) {
      setError('Front content is required');
      return;
    }
    if (!form.back.trim()) {
      setError('Back content is required');
      return;
    }

    const tags = form.tags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    try {
      await dispatch(
        createCard({
          front: form.front.trim(),
          back: form.back.trim(),
          type: form.type,
          language: form.language,
          tags,
        })
      ).unwrap();

      dispatch(trackCardCreated());

      onClose();
    } catch (err) {
      setError(err || 'Failed to create card');
    }
  };

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <m.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-stone-900 rounded-2xl p-6 w-full max-w-lg border border-stone-200 dark:border-stone-800 shadow-xl"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="text-2xl">📝</span>
            {initialData ? 'Edit Flashcard' : 'Create Flashcard'}
          </h2>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-stone-600 dark:text-stone-400 mb-2">
              Front (Question)
            </label>
            <textarea
              name="front"
              value={form.front}
              onChange={handleChange}
              placeholder="What is the time complexity of binary search?"
              rows={3}
              className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-3 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm text-stone-600 dark:text-stone-400 mb-2">
              Back (Answer)
            </label>
            <textarea
              name="back"
              value={form.back}
              onChange={handleChange}
              placeholder="O(log n) - it divides the search space in half each iteration"
              rows={3}
              className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-3 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-stone-600 dark:text-stone-400 mb-2">Type</label>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
              >
                <option value="basic">Basic</option>
                <option value="code">Code</option>
                <option value="cloze">Cloze (Fill-in)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-stone-600 dark:text-stone-400 mb-2">
                Language
              </label>
              <select
                name="language"
                value={form.language}
                onChange={handleChange}
                className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="cpp">C++</option>
                <option value="java">Java</option>
                <option value="general">General</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-stone-600 dark:text-stone-400 mb-2">
              Tags (comma separated)
            </label>
            <input
              type="text"
              name="tags"
              value={form.tags}
              onChange={handleChange}
              placeholder="algorithms, searching, arrays"
              className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-3 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <m.button
              type="button"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={onClose}
              className="flex-1 py-3 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-xl font-medium transition-colors"
            >
              Cancel
            </m.button>
            <m.button
              type="submit"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              disabled={loading.action}
              className="flex-1 py-3 bg-stone-900 dark:bg-stone-100 text-stone-100 dark:text-stone-900 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading.action ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>Create Card</>
              )}
            </m.button>
          </div>
        </form>

        <div className="mt-5 pt-4 border-t border-stone-200 dark:border-stone-800">
          <p className="text-xs text-stone-500">
            💡 <strong>Tip:</strong> Keep questions focused on one concept.
            Good cards have clear, specific answers.
          </p>
        </div>
      </m.div>
    </m.div>
  );
}
