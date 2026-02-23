import { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';

export default function ChatInput({ onSend, isLoading }) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [message]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSend(message);
      setMessage('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-stone-200 dark:border-stone-800 p-4 bg-stone-50 dark:bg-stone-900/50"
    >
      <div className="flex gap-3 items-end">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything about coding..."
            disabled={isLoading}
            rows={1}
            className="w-full resize-none min-h-[48px] max-h-[200px] px-4 py-3 pr-12
                       bg-white dark:bg-stone-800 
                       border border-stone-200 dark:border-stone-700 
                       rounded-xl text-stone-900 dark:text-stone-100
                       placeholder:text-stone-400 dark:placeholder:text-stone-500
                       focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all"
          />
          
          {/* Character count */}
          {message.length > 0 && (
            <span className="absolute right-3 bottom-3 text-xs text-stone-400">
              {message.length}
            </span>
          )}
        </div>

        {/* Send button */}
        <motion.button
          type="submit"
          disabled={!message.trim() || isLoading}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`h-12 w-12 rounded-xl flex items-center justify-center transition-all ${
            message.trim() && !isLoading
              ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/25'
              : 'bg-stone-200 dark:bg-stone-800 text-stone-400 cursor-not-allowed'
          }`}
        >
          {isLoading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-5 h-5 border-2 border-stone-400 border-t-transparent rounded-full"
            />
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
          )}
        </motion.button>
      </div>

      {/* Helper text */}
      <p className="text-xs text-stone-400 mt-2">
        Press <kbd className="px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-xs font-mono">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-xs font-mono">Shift + Enter</kbd> for new line
      </p>
    </form>
  );
}
