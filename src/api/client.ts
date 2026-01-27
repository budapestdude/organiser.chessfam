import axios, { AxiosError } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import { TokenManager } from '../utils/token';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Simple in-memory cache for GET requests
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds

// Request queue for rate limiting
let requestQueue: Promise<unknown> = Promise.resolve();
const MIN_REQUEST_INTERVAL = 100; // 100ms between requests

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Request interceptor - add token and implement caching
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = TokenManager.getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Check cache for GET requests
    if (config.method?.toLowerCase() === 'get') {
      const cacheKey = `${config.url}${JSON.stringify(config.params || {})}`;
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        // Return cached data by throwing a special error that we'll catch
        const error = new Error('CACHE_HIT') as Error & { cachedData: unknown };
        error.cachedData = cached.data;
        throw error;
      }
    }

    // Add small delay between requests to avoid rate limiting
    requestQueue = requestQueue.then(() => delay(MIN_REQUEST_INTERVAL));
    await requestQueue;

    return config;
  },
  (error) => {
    // Check if this is our cache hit
    if (error.message === 'CACHE_HIT') {
      return Promise.reject(error);
    }
    return Promise.reject(error);
  }
);

// Response interceptor - handle token refresh and caching
apiClient.interceptors.response.use(
  (response) => {
    // Cache successful GET responses
    if (response.config.method?.toLowerCase() === 'get') {
      const cacheKey = `${response.config.url}${JSON.stringify(response.config.params || {})}`;
      cache.set(cacheKey, { data: response.data, timestamp: Date.now() });
    }
    return response;
  },
  async (error: AxiosError & { cachedData?: unknown }) => {
    // Handle cache hit
    if (error.message === 'CACHE_HIT') {
      return { data: error.cachedData, status: 200, statusText: 'OK (cached)', headers: {}, config: {} };
    }

    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean; _retryCount?: number };

    // Handle rate limiting (429) with exponential backoff
    if (error.response?.status === 429) {
      const retryCount = originalRequest._retryCount || 0;
      if (retryCount < 3) {
        originalRequest._retryCount = retryCount + 1;
        const backoffDelay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        console.log(`Rate limited, retrying in ${backoffDelay}ms...`);
        await delay(backoffDelay);
        return apiClient(originalRequest);
      }
      // After 3 retries, return cached data if available for GET requests
      if (originalRequest.method?.toLowerCase() === 'get') {
        const cacheKey = `${originalRequest.url}${JSON.stringify(originalRequest.params || {})}`;
        const cached = cache.get(cacheKey);
        if (cached) {
          console.log('Returning stale cache after rate limit');
          return { data: cached.data, status: 200, statusText: 'OK (stale cache)', headers: {}, config: {} };
        }
      }
    }

    // If 401 and we haven't retried yet, try to refresh the token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = TokenManager.getRefreshToken();

        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Try to refresh the token
        const { data } = await axios.post(`${apiClient.defaults.baseURL}/auth/refresh`, {
          refreshToken,
        });

        // Save new tokens
        TokenManager.setTokens(data.token, data.refreshToken);

        // Retry the original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${data.token}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed - clear tokens and redirect to home
        TokenManager.clearTokens();
        localStorage.removeItem('chessfam-organizer-storage'); // Clear Zustand store
        window.location.href = '/';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Clear cache function (useful when data changes)
export function clearApiCache() {
  cache.clear();
}

export default apiClient;
