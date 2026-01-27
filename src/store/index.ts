import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI } from '../api/auth';
import { TokenManager } from '../utils/token';
import type { User, DashboardData, Tournament, Club, TournamentAnalytics, FinancialData } from '../types';

interface OrganizerStore {
  // Auth state
  user: User | null;
  isAuthenticated: boolean;

  // Dashboard data
  dashboardData: DashboardData | null;
  dashboardLoading: boolean;

  // Tournaments
  tournaments: Tournament[];
  tournamentsLoading: boolean;
  selectedTournament: Tournament | null;
  tournamentAnalytics: TournamentAnalytics | null;

  // Clubs
  clubs: Club[];
  clubsLoading: boolean;
  selectedClub: Club | null;

  // Financials
  financialData: FinancialData | null;
  financialsLoading: boolean;

  // Auth actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  initializeAuth: () => Promise<void>;
  setUser: (user: User | null) => void;

  // Data actions
  fetchDashboard: () => Promise<void>;
  fetchTournaments: () => Promise<void>;
  fetchClubs: () => Promise<void>;
  fetchFinancials: (from: string, to: string) => Promise<void>;
  setSelectedTournament: (tournament: Tournament | null) => void;
  setSelectedClub: (club: Club | null) => void;
}

export const useStore = create<OrganizerStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      dashboardData: null,
      dashboardLoading: false,
      tournaments: [],
      tournamentsLoading: false,
      selectedTournament: null,
      tournamentAnalytics: null,
      clubs: [],
      clubsLoading: false,
      selectedClub: null,
      financialData: null,
      financialsLoading: false,

      // Auth actions
      login: async (email: string, password: string) => {
        try {
          const { user, token, refreshToken } = await authAPI.login({ email, password });
          TokenManager.setTokens(token, refreshToken);
          set({ user, isAuthenticated: true });
        } catch (error: any) {
          throw new Error(error.response?.data?.message || 'Login failed');
        }
      },

      logout: async () => {
        try {
          await authAPI.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          TokenManager.clearTokens();
          set({
            user: null,
            isAuthenticated: false,
            dashboardData: null,
            tournaments: [],
            clubs: [],
            selectedTournament: null,
            selectedClub: null,
          });
          localStorage.removeItem('chessfam-organizer-storage');
        }
      },

      initializeAuth: async () => {
        const token = TokenManager.getToken();
        if (!token) {
          set({ user: null, isAuthenticated: false });
          return;
        }

        if (TokenManager.isTokenExpired(token)) {
          try {
            const refreshToken = TokenManager.getRefreshToken();
            if (refreshToken) {
              const { token: newToken, refreshToken: newRefreshToken } = await authAPI.refreshToken(refreshToken);
              TokenManager.setTokens(newToken, newRefreshToken);
            } else {
              throw new Error('No refresh token');
            }
          } catch (error) {
            TokenManager.clearTokens();
            set({ user: null, isAuthenticated: false });
            return;
          }
        }

        try {
          const { user } = await authAPI.me();
          set({ user, isAuthenticated: true });
        } catch (error) {
          TokenManager.clearTokens();
          set({ user: null, isAuthenticated: false });
        }
      },

      setUser: (user: User | null) => {
        set({ user, isAuthenticated: !!user });
      },

      // Data actions
      fetchDashboard: async () => {
        set({ dashboardLoading: true });
        try {
          const { organizerAPI } = await import('../api/organizer');
          const dashboardData = await organizerAPI.getDashboard();
          set({ dashboardData });
        } catch (error) {
          console.error('Failed to fetch dashboard:', error);
          throw error;
        } finally {
          set({ dashboardLoading: false });
        }
      },

      fetchTournaments: async () => {
        set({ tournamentsLoading: true });
        try {
          const { tournamentsAPI } = await import('../api/tournaments');
          const tournaments = await tournamentsAPI.getMyTournaments();
          set({ tournaments });
        } catch (error) {
          console.error('Failed to fetch tournaments:', error);
          throw error;
        } finally {
          set({ tournamentsLoading: false });
        }
      },

      fetchClubs: async () => {
        set({ clubsLoading: true });
        try {
          const { clubsAPI } = await import('../api/clubs');
          const clubs = await clubsAPI.getMyClubs();
          // Filter to only owned clubs on frontend for now
          const userId = get().user?.id;
          const ownedClubs = clubs.filter((club: any) => club.owner_id === userId);
          set({ clubs: ownedClubs });
        } catch (error) {
          console.error('Failed to fetch clubs:', error);
          throw error;
        } finally {
          set({ clubsLoading: false });
        }
      },

      fetchFinancials: async (from: string, to: string) => {
        set({ financialsLoading: true });
        try {
          const { organizerAPI } = await import('../api/organizer');
          const financialData = await organizerAPI.getFinancials(from, to);
          set({ financialData });
        } catch (error) {
          console.error('Failed to fetch financials:', error);
          throw error;
        } finally {
          set({ financialsLoading: false });
        }
      },

      setSelectedTournament: (tournament: Tournament | null) => {
        set({ selectedTournament: tournament });
      },

      setSelectedClub: (club: Club | null) => {
        set({ selectedClub: club });
      },
    }),
    {
      name: 'chessfam-organizer-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
