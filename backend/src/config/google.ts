// Google OAuth Configuration

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/v1/auth/google/callback';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

if (!GOOGLE_CLIENT_ID && process.env.NODE_ENV === 'production') {
  console.warn('Warning: GOOGLE_CLIENT_ID not set. Google OAuth will be disabled.');
}

if (!GOOGLE_CLIENT_SECRET && process.env.NODE_ENV === 'production') {
  console.warn('Warning: GOOGLE_CLIENT_SECRET not set. Google OAuth will be disabled.');
}

export const googleConfig = {
  clientId: GOOGLE_CLIENT_ID || '',
  clientSecret: GOOGLE_CLIENT_SECRET || '',
  callbackUrl: GOOGLE_CALLBACK_URL,
  frontendUrl: FRONTEND_URL,
  // Scopes for user info
  scopes: [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ],
  // Check if Google OAuth is configured
  isConfigured: !!(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET),
};

// Generate Google OAuth authorization URL
export const getGoogleAuthUrl = (): string => {
  const params = new URLSearchParams({
    client_id: googleConfig.clientId,
    redirect_uri: googleConfig.callbackUrl,
    response_type: 'code',
    scope: googleConfig.scopes.join(' '),
    access_type: 'offline',
    prompt: 'consent',
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

// Exchange authorization code for tokens
export const exchangeCodeForTokens = async (code: string): Promise<{
  access_token: string;
  id_token: string;
  refresh_token?: string;
}> => {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      client_id: googleConfig.clientId,
      client_secret: googleConfig.clientSecret,
      redirect_uri: googleConfig.callbackUrl,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange code for tokens: ${error}`);
  }

  const data = await response.json() as {
    access_token: string;
    id_token: string;
    refresh_token?: string;
  };
  return data;
};

// Fetch Google user profile
export const getGoogleUserProfile = async (accessToken: string): Promise<{
  id: string;
  email: string;
  name: string;
  picture: string;
  verified_email: boolean;
}> => {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch Google user profile');
  }

  const data = await response.json() as {
    id: string;
    email: string;
    name: string;
    picture: string;
    verified_email: boolean;
  };
  return data;
};
