import { useEffect, useRef } from 'react';
import { profileApi } from '../api/profile';
import { useStore } from '../store';
import { TokenManager } from '../utils/token';

const HEARTBEAT_INTERVAL = 60000; // 60 seconds

export const useHeartbeat = () => {
  const user = useStore((state) => state.user);
  const logout = useStore((state) => state.logout);
  const intervalRef = useRef<number | null>(null);
  const failedAttemptsRef = useRef(0);

  useEffect(() => {
    // Clear interval and reset when user logs out or no valid token
    const token = TokenManager.getToken();
    if (!user || !token || TokenManager.isTokenExpired(token)) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      failedAttemptsRef.current = 0;
      return;
    }

    // Send heartbeat with error handling
    const sendHeartbeat = async () => {
      // Check token validity before each heartbeat
      const currentToken = TokenManager.getToken();
      if (!currentToken || TokenManager.isTokenExpired(currentToken)) {
        // Token expired - stop heartbeat
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        return;
      }

      try {
        await profileApi.heartbeat();
        failedAttemptsRef.current = 0; // Reset on success
      } catch (error: any) {
        failedAttemptsRef.current++;

        // If we get 401, token is invalid - stop heartbeat and logout
        if (error?.response?.status === 401) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          // Clear invalid token
          TokenManager.clearTokens();
          logout();
          return;
        }

        // After 3 consecutive failures, stop trying
        if (failedAttemptsRef.current >= 3) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
        // Don't log errors to console - heartbeat failures are expected sometimes
      }
    };

    sendHeartbeat();

    // Set up interval for periodic heartbeats
    intervalRef.current = window.setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [user, logout]);
};
