/**
 * useAnalytics Hook
 *
 * React hook for automatic page view tracking and manual event tracking
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView, trackAction, trackConversion, trackError } from '../utils/analytics';

/**
 * Automatically track page views on route changes
 */
export const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    // Extract page name from pathname
    const pageName = location.pathname === '/'
      ? 'home'
      : location.pathname.slice(1).replace(/\//g, '_');

    trackPageView(pageName, {
      path: location.pathname,
      search: location.search,
      hash: location.hash
    });
  }, [location]);
};

/**
 * Manual event tracking hook
 */
export const useAnalytics = () => {
  return {
    trackAction,
    trackConversion,
    trackError,
    trackPageView
  };
};

export default useAnalytics;
