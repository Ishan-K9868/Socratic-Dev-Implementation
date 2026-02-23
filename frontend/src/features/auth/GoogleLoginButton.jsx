import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAppDispatch } from '../../store/hooks';
import { setCredentials, setLoading, setError } from '../../store/slices/authSlice';
import { authAPI } from '../../services/api';

export default function GoogleLoginButton() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleSuccess = async (credentialResponse) => {
    try {
      dispatch(setLoading(true));

      // Send Google credential to backend for verification
      const response = await authAPI.googleLogin(credentialResponse.credential);

      // Store credentials in Redux
      dispatch(
        setCredentials({
          user: response.data.user,
          token: response.data.token,
        })
      );

      // Navigate to app
      navigate('/app');
    } catch (error) {
      console.error('Login failed:', error);
      dispatch(setError(error.response?.data?.message || 'Login failed. Please try again.'));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleError = () => {
    dispatch(setError('Google Sign-In failed. Please try again.'));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      className="transition-none"
    >
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={handleError}
        theme="filled_black"
        size="large"
        text="signin_with"
        shape="pill"
        width="300"
      />
    </motion.div>
  );
}
