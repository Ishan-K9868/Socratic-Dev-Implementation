import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { addMessage, setIsTyping, addConversation, updateConversationId } from '../../store/slices/chatSlice';
import { addNotification } from '../../store/slices/uiSlice';
import { trackChatMessage, checkNightOwl, initializeDailyQuests, syncXPToBackend } from '../../store/slices/gamificationSlice';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import api from '../../services/api';

export default function ChatPanel() {
  const dispatch = useAppDispatch();
  const { messages, isTyping, activeConversationId } = useAppSelector((state) => state.chat);
  const { mode } = useAppSelector((state) => state.ui);
  const { user } = useAppSelector((state) => state.auth);
  const messagesEndRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!activeConversationId) {
      dispatch(addConversation({ title: 'New Chat' }));
    }
  }, [activeConversationId, dispatch]);

  useEffect(() => {
    dispatch(initializeDailyQuests());
  }, [dispatch]);

  const handleSendMessage = async (content) => {
    if (!content.trim() || isLoading) return;

    dispatch(addMessage({ role: 'user', content }));
    setIsLoading(true);
    dispatch(setIsTyping(true));

    dispatch(trackChatMessage());
    dispatch(checkNightOwl());

    try {
      const response = await api.post('/chat/message', {
        message: content,
        mode,
        conversationId: activeConversationId,
        history: messages.slice(-10), // Last 10 messages for context
      });

      dispatch(addMessage({
        role: 'assistant',
        content: response.data.response.content,
      }));

      if (response.data.conversationId && response.data.conversationId !== activeConversationId) {
        dispatch(updateConversationId(response.data.conversationId));
      }

      dispatch(syncXPToBackend({ amount: 5, reason: 'chat_engagement' }));

    } catch (error) {
      console.error('Chat error:', error);
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to get response. Please try again.',
      }));
      
      dispatch(addMessage({
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please check your API configuration and try again.",
      }));
    } finally {
      setIsLoading(false);
      dispatch(setIsTyping(false));
    }
  };

  const suggestions = [
    'How do I reverse a string?',
    'Explain closures',
    'What is Big O?',
  ];

  return (
    <div className="h-[calc(100vh-3rem)] flex flex-col">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-3xl font-bold tracking-tight mb-1">
          {mode === 'learning' ? '🎓 Learning Mode' : '🔧 Building Mode'}
        </h1>
        <p className="text-stone-600 dark:text-stone-400">
          {mode === 'learning'
            ? "I'll guide you with questions to help you discover the answer"
            : "I'll provide direct solutions and code examples"}
        </p>
      </motion.div>

      <div className="flex-1 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl flex flex-col overflow-hidden shadow-sm">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="h-full flex items-center justify-center"
            >
              <div className="text-center max-w-md">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-amber-400 to-orange-600 rounded-2xl flex items-center justify-center">
                  <span className="text-3xl">💬</span>
                </div>
                <p className="text-lg font-semibold tracking-tight">
                  Welcome, {user?.displayName?.split(' ')[0]}!
                </p>
                <p className="text-stone-500 text-sm mt-2 mb-6">
                  {mode === 'learning'
                    ? 'Ask me anything and I\'ll help you understand through guided questions.'
                    : 'Ask me anything and I\'ll give you direct answers with code examples.'}
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {suggestions.map((suggestion) => (
                    <motion.button
                      key={suggestion}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSendMessage(suggestion)}
                      className="text-sm px-4 py-2 rounded-full 
                               bg-stone-100 dark:bg-stone-800 
                               text-stone-600 dark:text-stone-300
                               hover:bg-amber-500/20 hover:text-amber-700 dark:hover:text-amber-400
                               border border-stone-200 dark:border-stone-700
                               transition-all"
                    >
                      {suggestion}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <>
              <AnimatePresence mode="popLayout">
                {messages.map((message, index) => (
                  <ChatMessage
                    key={message.id || index}
                    message={message}
                    isLast={index === messages.length - 1}
                  />
                ))}
              </AnimatePresence>

              <AnimatePresence>
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex gap-3 items-center text-stone-500"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-600 rounded-lg flex items-center justify-center">
                      <span className="text-sm">S</span>
                    </div>
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.span
                          key={i}
                          className="w-2 h-2 bg-amber-500 rounded-full"
                          animate={{ y: [0, -5, 0] }}
                          transition={{
                            duration: 0.6,
                            repeat: Infinity,
                            delay: i * 0.15,
                          }}
                        />
                      ))}
                    </div>
                    <span className="text-sm">Thinking...</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
}
