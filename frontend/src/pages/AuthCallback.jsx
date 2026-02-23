import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAppDispatch } from '../store/hooks';
import { setCredentials, setError, setLoading } from '../store/slices/authSlice';

/**
 * OAuth callback handler
 * Receives token from URL and validates it with backend
 */
export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');

      if (!token) {
        dispatch(setError('No authentication token received'));
        navigate('/login', { replace: true });
        return;
      }

      try {
        dispatch(setLoading(true));

        // Fetch user data with the token directly in header
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to authenticate');
        }

        const data = await response.json();

        // Set credentials in Redux (this will also persist the token)
        dispatch(
          setCredentials({
            user: data.user,
            token: token,
          })
        );

        // Navigate to app
        navigate('/app', { replace: true });
      } catch (error) {
        console.error('Auth callback error:', error);
        dispatch(setError('Authentication failed. Please try again.'));
        navigate('/login', { replace: true });
      } finally {
        dispatch(setLoading(false));
      }
    };

    handleCallback();
  }, [searchParams, navigate, dispatch]);

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-t-2 border-amber-500 rounded-full mx-auto mb-4"
        />
        <p className="text-stone-600 dark:text-stone-300 font-sans">Completing sign in...</p>
      </motion.div>
    </div>
  );
}
