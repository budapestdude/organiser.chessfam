// Geolocation hook for /live page
import { useState, useEffect, useCallback } from 'react';
import { SUPPORTED_CITIES } from '../types/live';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: string | null;
  isLoading: boolean;
  isSupported: boolean;
  permissionStatus: PermissionState | null;
}

interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

interface UseGeolocationReturn extends GeolocationState {
  requestPermission: () => Promise<boolean>;
  getCurrentPosition: () => Promise<{ latitude: number; longitude: number } | null>;
  getNearestCity: () => string | null;
  getDistanceToCity: (cityId: string) => number | null;
}

const DEFAULT_OPTIONS: GeolocationOptions = {
  enableHighAccuracy: false,
  timeout: 10000,
  maximumAge: 5 * 60 * 1000, // 5 minutes
};

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Hook for accessing user's geolocation
 */
export function useGeolocation(options: GeolocationOptions = {}): UseGeolocationReturn {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    isLoading: false,
    isSupported: typeof navigator !== 'undefined' && 'geolocation' in navigator,
    permissionStatus: null,
  });

  // Check permission status
  useEffect(() => {
    if (!state.isSupported) return;

    const checkPermission = async () => {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        setState((prev) => ({ ...prev, permissionStatus: result.state }));

        result.addEventListener('change', () => {
          setState((prev) => ({ ...prev, permissionStatus: result.state }));
        });
      } catch {
        // Permission API not supported
      }
    };

    checkPermission();
  }, [state.isSupported]);

  // Try to get cached position from localStorage
  useEffect(() => {
    const cached = localStorage.getItem('user-geolocation');
    if (cached) {
      try {
        const { latitude, longitude, timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;
        if (age < mergedOptions.maximumAge!) {
          setState((prev) => ({ ...prev, latitude, longitude }));
        }
      } catch {
        localStorage.removeItem('user-geolocation');
      }
    }
  }, [mergedOptions.maximumAge]);

  /**
   * Request permission and get initial position
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) {
      setState((prev) => ({ ...prev, error: 'Geolocation is not supported' }));
      return false;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;

          // Cache the position
          localStorage.setItem(
            'user-geolocation',
            JSON.stringify({ latitude, longitude, timestamp: Date.now() })
          );

          setState((prev) => ({
            ...prev,
            latitude,
            longitude,
            accuracy,
            isLoading: false,
            error: null,
          }));
          resolve(true);
        },
        (error) => {
          let errorMessage: string;
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
            default:
              errorMessage = 'Unknown error getting location';
          }

          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: errorMessage,
          }));
          resolve(false);
        },
        {
          enableHighAccuracy: mergedOptions.enableHighAccuracy,
          timeout: mergedOptions.timeout,
          maximumAge: mergedOptions.maximumAge,
        }
      );
    });
  }, [state.isSupported, mergedOptions]);

  /**
   * Get current position (one-shot)
   */
  const getCurrentPosition = useCallback(async (): Promise<{
    latitude: number;
    longitude: number;
  } | null> => {
    if (!state.isSupported) return null;

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        () => {
          resolve(null);
        },
        {
          enableHighAccuracy: mergedOptions.enableHighAccuracy,
          timeout: mergedOptions.timeout,
          maximumAge: mergedOptions.maximumAge,
        }
      );
    });
  }, [state.isSupported, mergedOptions]);

  /**
   * Get the nearest supported city
   */
  const getNearestCity = useCallback((): string | null => {
    if (state.latitude === null || state.longitude === null) {
      return null;
    }

    let nearestCity: string | null = null;
    let minDistance = Infinity;

    for (const city of SUPPORTED_CITIES) {
      const distance = calculateDistance(
        state.latitude,
        state.longitude,
        city.latitude,
        city.longitude
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearestCity = city.id;
      }
    }

    return nearestCity;
  }, [state.latitude, state.longitude]);

  /**
   * Get distance to a specific city
   */
  const getDistanceToCity = useCallback(
    (cityId: string): number | null => {
      if (state.latitude === null || state.longitude === null) {
        return null;
      }

      const city = SUPPORTED_CITIES.find((c) => c.id === cityId);
      if (!city) return null;

      return calculateDistance(
        state.latitude,
        state.longitude,
        city.latitude,
        city.longitude
      );
    },
    [state.latitude, state.longitude]
  );

  return {
    ...state,
    requestPermission,
    getCurrentPosition,
    getNearestCity,
    getDistanceToCity,
  };
}

/**
 * Get user's approximate location from IP (fallback)
 */
export async function getLocationFromIP(): Promise<{
  city: string;
  country: string;
  latitude: number;
  longitude: number;
} | null> {
  try {
    // Using a free IP geolocation service
    const response = await fetch('https://ipapi.co/json/');
    if (!response.ok) return null;

    const data = await response.json();
    return {
      city: data.city,
      country: data.country_name,
      latitude: data.latitude,
      longitude: data.longitude,
    };
  } catch {
    return null;
  }
}

/**
 * Find the nearest supported city to given coordinates
 */
export function findNearestSupportedCity(
  latitude: number,
  longitude: number
): { cityId: string; distance: number } | null {
  let nearest: { cityId: string; distance: number } | null = null;

  for (const city of SUPPORTED_CITIES) {
    const distance = calculateDistance(latitude, longitude, city.latitude, city.longitude);

    if (!nearest || distance < nearest.distance) {
      nearest = { cityId: city.id, distance };
    }
  }

  return nearest;
}
