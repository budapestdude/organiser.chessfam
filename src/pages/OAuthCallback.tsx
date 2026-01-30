import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useStore } from '../store';
import { TokenManager } from '../utils/token';

export default function OAuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      console.log('[OAuth] Starting callback handler');

      // Check for error
      const error = searchParams.get('error');
      if (error) {
        console.error('[OAuth] Error from backend:', error);
        setStatus('error');
        setErrorMessage(decodeURIComponent(error));
        return;
      }

      // Get tokens and user info from URL
      const token = searchParams.get('token');
      const refreshToken = searchParams.get('refreshToken');
      const userId = searchParams.get('userId');
      const name = searchParams.get('name');
      const email = searchParams.get('email');

      console.log('[OAuth] Received data:', {
        hasToken: !!token,
        hasRefreshToken: !!refreshToken,
        userId,
        name,
        email
      });

      if (!token || !refreshToken || !userId) {
        console.error('[OAuth] Missing required authentication data');
        setStatus('error');
        setErrorMessage('Missing authentication data');
        return;
      }

      try {
        console.log('[OAuth] Storing tokens...');
        // Store tokens
        TokenManager.setTokens(token, refreshToken);

        console.log('[OAuth] Initializing auth and fetching user profile...');
        // Fetch full user profile and initialize favorites
        const initializeAuth = useStore.getState().initializeAuth;
        await initializeAuth();

        const user = useStore.getState().user;
        console.log('[OAuth] Auth initialized, user:', user);

        // Close auth modal if it's open
        const closeAuthModal = useStore.getState().closeAuthModal;
        closeAuthModal();
        console.log('[OAuth] Closed auth modal');

        setStatus('success');

        // Redirect to search page after a short delay
        setTimeout(() => {
          console.log('[OAuth] Redirecting to search...');
          navigate('/search', { replace: true });
        }, 1500);
      } catch (err) {
        console.error('[OAuth] Callback error:', err);
        setStatus('error');
        setErrorMessage('Failed to complete authentication');
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex items-center justify-center">
      <div className="text-center">
        {status === 'loading' && (
          <>
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gold-400/10 rounded-full mb-4">
              <Loader2 className="w-12 h-12 text-gold-400 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Signing you in...</h1>
            <p className="text-gray-400">Please wait while we complete your authentication.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/10 rounded-full mb-4 animate-pulse">
              <CheckCircle className="w-12 h-12 text-green-400" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Welcome!</h1>
            <p className="text-gray-400">You've been signed in successfully. Redirecting...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-500/10 rounded-full mb-4">
              <XCircle className="w-12 h-12 text-red-400" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Authentication Failed</h1>
            <p className="text-gray-400 mb-6">{errorMessage || 'Something went wrong. Please try again.'}</p>
            <button
              onClick={() => navigate('/', { replace: true })}
              className="bg-gradient-to-r from-gold-400 to-gold-500 text-black font-semibold px-6 py-3 rounded-lg hover:from-gold-500 hover:to-gold-600 transition-all"
            >
              Back to Home
            </button>
          </>
        )}
      </div>
    </div>
  );
}
