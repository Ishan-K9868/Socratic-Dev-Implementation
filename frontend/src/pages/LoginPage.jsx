import { Link, Navigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { toggleTheme } from '../store/slices/uiSlice';
import GoogleLoginButton from '../features/auth/GoogleLoginButton';

export default function LoginPage() {
  const { isAuthenticated, error } = useAppSelector((state) => state.auth);
  const { theme } = useAppSelector((state) => state.ui);
  const dispatch = useAppDispatch();

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-amber-500/10 to-orange-500/5 rounded-full blur-3xl"
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-rose-500/10 to-amber-500/5 rounded-full blur-3xl"
          animate={{ rotate: -360 }}
          transition={{ duration: 80, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      {/* Theme toggle - top right */}
      <motion.button
        onClick={() => dispatch(toggleTheme())}
        className="absolute top-6 right-6 w-10 h-10 rounded-full bg-stone-200 dark:bg-stone-800 flex items-center justify-center text-lg z-10"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 100 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-8 shadow-xl">
          {/* Logo */}
          <Link to="/" className="inline-flex items-center gap-3 mb-8">
            <motion.div
              className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-600 rounded-lg flex items-center justify-center"
              whileHover={{ rotate: 12 }}
            >
              <span className="text-white font-mono font-bold text-lg">S</span>
            </motion.div>
            <span className="font-semibold text-xl tracking-tight">SocraticDev</span>
          </Link>

          {/* Headline */}
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Welcome back
          </h1>
          <p className="text-stone-600 dark:text-stone-400 mb-8">
            Sign in to continue your learning journey
          </p>

          {/* Error message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 dark:text-red-400 text-sm"
            >
              {error}
            </motion.div>
          )}

          {/* Google Login */}
          <div className="flex justify-center mb-8">
            <GoogleLoginButton />
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-200 dark:border-stone-800" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-white dark:bg-stone-900 text-stone-500">
                Secure authentication via Google
              </span>
            </div>
          </div>

          {/* Terms */}
          <p className="text-xs text-stone-500 text-center leading-relaxed">
            By signing in, you agree to our terms and conditions.
          </p>
        </div>

        {/* Back link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center mt-6"
        >
          <Link
            to="/"
            className="text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors inline-flex items-center gap-2 text-sm"
          >
            <span>←</span> Back to home
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
