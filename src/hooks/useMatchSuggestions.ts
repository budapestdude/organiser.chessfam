import { useState, useCallback, useEffect } from 'react';
import api from '../api/client';

export interface MatchSuggestion {
  game_id: number;
  venue_name: string;
  venue_address?: string;
  venue_lat?: number;
  venue_lng?: number;
  game_date: string;
  game_time: string;
  duration_minutes: number;
  time_control?: string;
  player_level?: string;
  max_players: number;
  participant_count: number;
  creator_name: string;
  creator_rating?: number;
  distance?: number;
  score: number;
  match_reasons: string[];
}

export interface MatchPreferences {
  preferred_time_controls?: string[];
  preferred_player_levels?: string[];
  max_distance_km?: number;
  min_rating_diff?: number;
  max_rating_diff?: number;
  preferred_days?: string[];
  preferred_times?: string[];
  auto_match?: boolean;
}

interface UseMatchSuggestionsOptions {
  lat?: number;
  lng?: number;
  enabled?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

export interface UseMatchSuggestionsReturn {
  suggestions: MatchSuggestion[];
  isLoading: boolean;
  error: string | null;
  preferences: MatchPreferences | null;
  isLoadingPreferences: boolean;
  fetchSuggestions: (options?: { lat?: number; lng?: number; maxDistance?: number; limit?: number }) => Promise<void>;
  savePreferences: (prefs: MatchPreferences) => Promise<void>;
  refreshSuggestions: () => Promise<void>;
}

export function useMatchSuggestions(options: UseMatchSuggestionsOptions = {}): UseMatchSuggestionsReturn {
  const {
    lat,
    lng,
    enabled = true,
    autoRefresh = false,
    refreshInterval = 5 * 60 * 1000, // 5 minutes default
  } = options;

  const [suggestions, setSuggestions] = useState<MatchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<MatchPreferences | null>(null);
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(false);

  // Fetch match suggestions
  const fetchSuggestions = useCallback(async (fetchOptions: {
    lat?: number;
    lng?: number;
    maxDistance?: number;
    limit?: number;
  } = {}) => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const params: any = {
        limit: fetchOptions.limit || 20,
      };

      // Use provided coordinates or fall back to options
      if (fetchOptions.lat !== undefined && fetchOptions.lng !== undefined) {
        params.lat = fetchOptions.lat;
        params.lng = fetchOptions.lng;
      } else if (lat !== undefined && lng !== undefined) {
        params.lat = lat;
        params.lng = lng;
      }

      if (fetchOptions.maxDistance !== undefined) {
        params.max_distance = fetchOptions.maxDistance;
      }

      const response = await api.get('/matching/suggestions', { params });

      setSuggestions(response.data.data.suggestions || []);
    } catch (err: any) {
      console.error('[MatchSuggestions] Failed to fetch suggestions:', err);
      setError(err.response?.data?.message || 'Failed to load match suggestions');
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [enabled, lat, lng]);

  // Fetch user preferences
  const fetchPreferences = useCallback(async () => {
    if (!enabled) return;

    setIsLoadingPreferences(true);

    try {
      const response = await api.get('/matching/preferences');
      setPreferences(response.data.data || null);
    } catch (err: any) {
      console.error('[MatchSuggestions] Failed to fetch preferences:', err);
      // Preferences are optional, so we don't set error state
      setPreferences(null);
    } finally {
      setIsLoadingPreferences(false);
    }
  }, [enabled]);

  // Save user preferences
  const savePreferences = useCallback(async (prefs: MatchPreferences) => {
    setIsLoadingPreferences(true);
    setError(null);

    try {
      const response = await api.put('/matching/preferences', prefs);
      setPreferences(response.data.data);
    } catch (err: any) {
      console.error('[MatchSuggestions] Failed to save preferences:', err);
      throw new Error(err.response?.data?.message || 'Failed to save preferences');
    } finally {
      setIsLoadingPreferences(false);
    }
  }, []);

  // Refresh suggestions (convenience method)
  const refreshSuggestions = useCallback(async () => {
    await fetchSuggestions();
  }, [fetchSuggestions]);

  // Initial load
  useEffect(() => {
    if (enabled) {
      fetchPreferences();
      fetchSuggestions();
    }
  }, [enabled]);

  // Auto-refresh if enabled
  useEffect(() => {
    if (!enabled || !autoRefresh) return;

    const intervalId = setInterval(() => {
      console.log('[MatchSuggestions] Auto-refreshing suggestions');
      fetchSuggestions();
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [enabled, autoRefresh, refreshInterval, fetchSuggestions]);

  // Refresh when location changes
  useEffect(() => {
    if (enabled && lat !== undefined && lng !== undefined) {
      fetchSuggestions();
    }
  }, [lat, lng, enabled]);

  return {
    suggestions,
    isLoading,
    error,
    preferences,
    isLoadingPreferences,
    fetchSuggestions,
    savePreferences,
    refreshSuggestions,
  };
}
