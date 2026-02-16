import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { store, persistor } from './store';
import App from './App';
import './index.css';

// Google OAuth Client ID
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// Loading component for PersistGate
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-950">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500" />
        <p className="text-stone-400 font-sans">Loading SocraticDev...</p>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <PersistGate loading={<LoadingFallback />} persistor={persistor}>
        <GoogleOAuthProvider clientId={googleClientId}>
          <App />
        </GoogleOAuthProvider>
      </PersistGate>
    </Provider>
  </StrictMode>
);
