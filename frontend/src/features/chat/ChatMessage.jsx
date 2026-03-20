import { motion } from 'motion/react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useAppSelector } from '../../store/hooks';

function parseContent(content) {
  const parts = [];
  const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: content.slice(lastIndex, match.index),
      });
    }

    parts.push({
      type: 'code',
      language: match[1] || 'javascript',
      content: match[2].trim(),
    });

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push({
      type: 'text',
      content: content.slice(lastIndex),
    });
  }

  return parts.length > 0 ? parts : [{ type: 'text', content }];
}

function formatText(text) {
  return text
    .split(/(\*\*[^*]+\*\*|`[^`]+`)/)
    .map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={i}
            className="px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 
                       text-amber-700 dark:text-amber-400 text-sm font-mono"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
}

export default function ChatMessage({ message, isLast }) {
  const { theme } = useAppSelector((state) => state.ui);
  const isUser = message.role === 'user';
  const parts = parseContent(message.content);
  const isDark = theme === 'dark';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isUser && (
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-orange-600 
                        flex items-center justify-center text-white text-sm font-mono font-bold flex-shrink-0">
          S
        </div>
      )}

      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-stone-900 dark:bg-stone-100 text-stone-100 dark:text-stone-900 rounded-br-md'
            : 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 rounded-bl-md'
        }`}
      >
        {parts.map((part, index) => (
          <div key={index}>
            {part.type === 'text' ? (
              <p className="whitespace-pre-wrap leading-relaxed text-sm">
                {formatText(part.content)}
              </p>
            ) : (
              <div className="my-3 rounded-xl overflow-hidden border border-stone-200 dark:border-stone-700">
                <div className="flex items-center justify-between px-4 py-2 
                                bg-stone-800 dark:bg-stone-950 text-stone-400 text-xs">
                  <span className="font-mono">{part.language}</span>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigator.clipboard.writeText(part.content)}
                    className="hover:text-white transition-colors"
                  >
                    Copy
                  </motion.button>
                </div>
                <SyntaxHighlighter
                  language={part.language}
                  style={isDark ? oneDark : oneLight}
                  customStyle={{
                    margin: 0,
                    padding: '1rem',
                    fontSize: '0.8rem',
                    background: isDark ? '#1c1917' : '#fafaf9',
                  }}
                >
                  {part.content}
                </SyntaxHighlighter>
              </div>
            )}
          </div>
        ))}

        <p className={`text-xs mt-2 opacity-60`}>
          {new Date(message.timestamp || Date.now()).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>

      {isUser && (
        <div className="w-9 h-9 rounded-lg bg-stone-600 dark:bg-stone-400 
                        flex items-center justify-center text-white dark:text-stone-900 text-xs font-bold flex-shrink-0">
          You
        </div>
      )}
    </motion.div>
  );
}
