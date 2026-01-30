/**
 * Analytics Utility
 *
 * Privacy-first analytics tracking system.
 * Tracks user events, conversions, and page views without cookies or PII.
 */

import apiClient from '../api/client';
import { v4 as uuidv4 } from 'uuid';

// Session management
let sessionId: string | null = null;
let anonymousId: string | null = null;

/**
 * Initialize analytics session
 */
export const initializeAnalytics = () => {
  // Get or create session ID (30 minute expiry)
  const storedSession = sessionStorage.getItem('analytics_session');
  const storedTimestamp = sessionStorage.getItem('analytics_session_timestamp');

  if (storedSession && storedTimestamp) {
    const timestamp = parseInt(storedTimestamp);
    const now = Date.now();
    const thirtyMinutes = 30 * 60 * 1000;

    if (now - timestamp < thirtyMinutes) {
      sessionId = storedSession;
    }
  }

  if (!sessionId) {
    sessionId = uuidv4();
    sessionStorage.setItem('analytics_session', sessionId);
    sessionStorage.setItem('analytics_session_timestamp', Date.now().toString());
  }

  // Get or create anonymous ID (persistent across sessions)
  anonymousId = localStorage.getItem('analytics_anonymous_id');
  if (!anonymousId) {
    anonymousId = uuidv4();
    localStorage.setItem('analytics_anonymous_id', anonymousId);
  }

  // Track session start
  trackSessionStart();

  // Track session end on page unload
  window.addEventListener('beforeunload', trackSessionEnd);
};

/**
 * Track session start
 */
const trackSessionStart = async () => {
  if (!sessionId) return;

  const deviceType = getDeviceType();
  const browserInfo = getBrowserInfo();

  try {
    await apiClient.post('/analytics/session/start', {
      session_id: sessionId,
      anonymous_id: anonymousId,
      entry_url: window.location.href,
      entry_referrer: document.referrer,
      device_type: deviceType,
      browser: browserInfo.browser,
      os: browserInfo.os
    });
  } catch (error) {
    console.error('[Analytics] Failed to start session:', error);
  }
};

/**
 * Track session end
 */
const trackSessionEnd = async () => {
  if (!sessionId) return;

  try {
    // Use sendBeacon for reliable tracking on page unload
    const data = JSON.stringify({
      session_id: sessionId,
      exit_url: window.location.href
    });

    const blob = new Blob([data], { type: 'application/json' });
    navigator.sendBeacon(`${apiClient.defaults.baseURL}/analytics/session/end`, blob);
  } catch (error) {
    console.error('[Analytics] Failed to end session:', error);
  }
};

/**
 * Track an event
 */
export const trackEvent = async (
  eventName: string,
  eventCategory: 'page_view' | 'conversion' | 'user_action' | 'error',
  properties?: Record<string, any>
) => {
  if (!sessionId) {
    initializeAnalytics();
  }

  try {
    await apiClient.post('/analytics/track', {
      event_name: eventName,
      event_category: eventCategory,
      session_id: sessionId,
      anonymous_id: anonymousId,
      properties: properties || {},
      page_url: window.location.href,
      page_referrer: document.referrer
    });
  } catch (error) {
    console.error('[Analytics] Failed to track event:', error);
  }
};

/**
 * Track page view
 */
export const trackPageView = (pageName: string, properties?: Record<string, any>) => {
  trackEvent(`page_view_${pageName}`, 'page_view', {
    page_title: document.title,
    ...properties
  });
};

/**
 * Track conversion
 */
export const trackConversion = (conversionName: string, properties?: Record<string, any>) => {
  trackEvent(conversionName, 'conversion', properties);
};

/**
 * Track user action
 */
export const trackAction = (actionName: string, properties?: Record<string, any>) => {
  trackEvent(actionName, 'user_action', properties);
};

/**
 * Track error
 */
export const trackError = (errorName: string, properties?: Record<string, any>) => {
  trackEvent(errorName, 'error', properties);
};

/**
 * Conversion tracking helpers
 */
export const Conversions = {
  // User signup funnel
  visitHomepage: () => trackConversion('visit_homepage'),
  viewSignupPage: () => trackConversion('view_signup_page'),
  submitSignup: () => trackConversion('submit_signup'),
  verifyEmail: () => trackConversion('verify_email'),
  completeProfile: () => trackConversion('complete_profile'),

  // Tournament booking funnel
  viewTournamentsList: () => trackConversion('view_tournaments_list'),
  viewTournamentDetail: (tournamentId: number) =>
    trackConversion('view_tournament_detail', { tournament_id: tournamentId }),
  clickRegisterTournament: (tournamentId: number) =>
    trackConversion('click_register', { tournament_id: tournamentId }),
  submitTournamentPayment: (tournamentId: number, amount: number) =>
    trackConversion('submit_payment', { tournament_id: tournamentId, amount }),
  tournamentBookingConfirmed: (tournamentId: number) =>
    trackConversion('booking_confirmed', { tournament_id: tournamentId }),

  // Club membership funnel
  viewClubsList: () => trackConversion('view_clubs_list'),
  viewClubDetail: (clubId: number) =>
    trackConversion('view_club_detail', { club_id: clubId }),
  clickJoinClub: (clubId: number) =>
    trackConversion('click_join', { club_id: clubId }),
  submitClubPayment: (clubId: number, amount: number) =>
    trackConversion('submit_payment', { club_id: clubId, amount }),
  clubMembershipConfirmed: (clubId: number) =>
    trackConversion('membership_confirmed', { club_id: clubId }),

  // Master booking funnel
  viewMastersList: () => trackConversion('view_masters_list'),
  viewMasterDetail: (masterId: number) =>
    trackConversion('view_master_detail', { master_id: masterId }),
  clickBookMaster: (masterId: number) =>
    trackConversion('click_book', { master_id: masterId }),
  submitMasterPayment: (masterId: number, amount: number) =>
    trackConversion('submit_payment', { master_id: masterId, amount }),
  masterBookingConfirmed: (masterId: number) =>
    trackConversion('booking_confirmed', { master_id: masterId }),

  // Venue submission funnel
  viewLocations: () => trackConversion('view_locations'),
  clickSubmitVenue: () => trackConversion('click_submit_venue'),
  fillVenueForm: () => trackConversion('fill_venue_form'),
  submitVenue: () => trackConversion('submit_venue'),
  venueApproved: () => trackConversion('venue_approved'),

  // Game creation funnel
  viewGames: () => trackConversion('view_games'),
  clickCreateGame: () => trackConversion('click_create_game'),
  fillGameDetails: () => trackConversion('fill_game_details'),
  submitGame: () => trackConversion('submit_game'),
  gameStarted: (gameId: number) => trackConversion('game_started', { game_id: gameId }),
};

/**
 * User action tracking helpers
 */
export const Actions = {
  clickButton: (buttonName: string, location?: string) =>
    trackAction('button_click', { button_name: buttonName, location }),

  search: (query: string, resultsCount: number) =>
    trackAction('search', { query, results_count: resultsCount }),

  filter: (filterType: string, filterValue: string) =>
    trackAction('filter', { filter_type: filterType, filter_value: filterValue }),

  share: (contentType: string, contentId: number) =>
    trackAction('share', { content_type: contentType, content_id: contentId }),

  like: (contentType: string, contentId: number) =>
    trackAction('like', { content_type: contentType, content_id: contentId }),

  comment: (contentType: string, contentId: number) =>
    trackAction('comment', { content_type: contentType, content_id: contentId }),

  favorite: (itemType: string, itemId: number) =>
    trackAction('favorite', { item_type: itemType, item_id: itemId }),

  viewProfile: (userId: number) =>
    trackAction('view_profile', { user_id: userId }),

  sendMessage: (recipientId: number) =>
    trackAction('send_message', { recipient_id: recipientId }),
};

/**
 * Utility: Get device type
 */
const getDeviceType = (): string => {
  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
};

/**
 * Utility: Get browser info
 */
const getBrowserInfo = (): { browser: string; os: string } => {
  const ua = navigator.userAgent;

  let browser = 'Unknown';
  if (ua.indexOf('Firefox') > -1) browser = 'Firefox';
  else if (ua.indexOf('Edg') > -1) browser = 'Edge';
  else if (ua.indexOf('Chrome') > -1) browser = 'Chrome';
  else if (ua.indexOf('Safari') > -1) browser = 'Safari';
  else if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) browser = 'Opera';

  let os = 'Unknown';
  if (ua.indexOf('Win') > -1) os = 'Windows';
  else if (ua.indexOf('Mac') > -1) os = 'macOS';
  else if (ua.indexOf('Linux') > -1) os = 'Linux';
  else if (ua.indexOf('Android') > -1) os = 'Android';
  else if (ua.indexOf('iOS') > -1) os = 'iOS';

  return { browser, os };
};
