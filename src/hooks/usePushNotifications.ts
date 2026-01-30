// Push notifications hook for PWA
import { useState, useEffect, useCallback } from 'react';

// Extended notification options for service worker notifications
interface ExtendedNotificationOptions {
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
  renotify?: boolean;
  requireInteraction?: boolean;
  vibrate?: number[];
  actions?: Array<{ action: string; title: string }>;
}

interface PushNotificationState {
  isSupported: boolean;
  isSubscribed: boolean;
  permission: NotificationPermission | null;
  subscription: PushSubscription | null;
  error: string | null;
}

interface UsePushNotificationsReturn extends PushNotificationState {
  requestPermission: () => Promise<boolean>;
  subscribe: () => Promise<PushSubscription | null>;
  unsubscribe: () => Promise<boolean>;
  showNotification: (title: string, options?: ExtendedNotificationOptions) => void;
}

// VAPID public key - replace with your actual key
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

/**
 * Convert base64 string to ArrayBuffer for VAPID key
 */
function urlBase64ToArrayBuffer(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return buffer;
}

/**
 * Hook for managing push notifications
 */
export function usePushNotifications(): UsePushNotificationsReturn {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    isSubscribed: false,
    permission: null,
    subscription: null,
    error: null,
  });

  // Check support and current state on mount
  useEffect(() => {
    const checkSupport = async () => {
      const isSupported = 'Notification' in window &&
        'serviceWorker' in navigator &&
        'PushManager' in window;

      if (!isSupported) {
        setState((prev) => ({ ...prev, isSupported: false }));
        return;
      }

      const permission = Notification.permission;

      // Check for existing subscription
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        setState({
          isSupported: true,
          isSubscribed: !!subscription,
          permission,
          subscription,
          error: null,
        });
      } catch (err) {
        setState((prev) => ({
          ...prev,
          isSupported: true,
          permission,
          error: 'Failed to check subscription status',
        }));
      }
    };

    checkSupport();
  }, []);

  /**
   * Request notification permission
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) {
      setState((prev) => ({ ...prev, error: 'Push notifications not supported' }));
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setState((prev) => ({ ...prev, permission }));
      return permission === 'granted';
    } catch (err) {
      setState((prev) => ({ ...prev, error: 'Failed to request permission' }));
      return false;
    }
  }, [state.isSupported]);

  /**
   * Subscribe to push notifications
   */
  const subscribe = useCallback(async (): Promise<PushSubscription | null> => {
    if (!state.isSupported) {
      setState((prev) => ({ ...prev, error: 'Push notifications not supported' }));
      return null;
    }

    if (state.permission !== 'granted') {
      const granted = await requestPermission();
      if (!granted) {
        return null;
      }
    }

    try {
      const registration = await navigator.serviceWorker.ready;

      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        // Create new subscription
        const subscribeOptions: PushSubscriptionOptionsInit = {
          userVisibleOnly: true,
        };
        if (VAPID_PUBLIC_KEY) {
          subscribeOptions.applicationServerKey = urlBase64ToArrayBuffer(VAPID_PUBLIC_KEY);
        }
        subscription = await registration.pushManager.subscribe(subscribeOptions);

        // Send subscription to server
        await sendSubscriptionToServer(subscription);
      }

      setState((prev) => ({
        ...prev,
        isSubscribed: true,
        subscription,
        error: null,
      }));

      return subscription;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to subscribe';
      setState((prev) => ({ ...prev, error }));
      return null;
    }
  }, [state.isSupported, state.permission, requestPermission]);

  /**
   * Unsubscribe from push notifications
   */
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!state.subscription) {
      return true;
    }

    try {
      await state.subscription.unsubscribe();
      await removeSubscriptionFromServer(state.subscription);

      setState((prev) => ({
        ...prev,
        isSubscribed: false,
        subscription: null,
        error: null,
      }));

      return true;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to unsubscribe';
      setState((prev) => ({ ...prev, error }));
      return false;
    }
  }, [state.subscription]);

  /**
   * Show a local notification
   */
  const showNotification = useCallback((title: string, options?: ExtendedNotificationOptions) => {
    if (!state.isSupported || state.permission !== 'granted') {
      return;
    }

    // Use service worker to show notification if available
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, {
          icon: '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png',
          ...options,
        } as NotificationOptions);
      });
    } else {
      // Fallback to Notification API (with basic options only)
      new Notification(title, { body: options?.body, icon: options?.icon });
    }
  }, [state.isSupported, state.permission]);

  return {
    ...state,
    requestPermission,
    subscribe,
    unsubscribe,
    showNotification,
  };
}

/**
 * Send subscription to server
 */
async function sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
  // In a real app, send to your backend
  console.log('Would send subscription to server:', subscription.toJSON());

  // Store locally for now
  localStorage.setItem('push-subscription', JSON.stringify(subscription.toJSON()));
}

/**
 * Remove subscription from server
 */
async function removeSubscriptionFromServer(subscription: PushSubscription): Promise<void> {
  // In a real app, remove from your backend
  console.log('Would remove subscription from server:', subscription.endpoint);

  localStorage.removeItem('push-subscription');
}

/**
 * Notification types for the app
 */
export interface ChessNotification {
  type: 'message' | 'mention' | 'checkin' | 'event' | 'tournament' | 'game';
  title: string;
  body: string;
  url?: string;
  data?: Record<string, unknown>;
}

/**
 * Create notification payload for different event types
 */
export function createNotificationPayload(notification: ChessNotification): {
  title: string;
  options: ExtendedNotificationOptions;
} {
  const baseOptions: ExtendedNotificationOptions = {
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    data: {
      url: notification.url || '/',
      ...notification.data,
    },
    tag: `chess-${notification.type}`,
    renotify: true,
  };

  switch (notification.type) {
    case 'message':
      return {
        title: notification.title,
        options: {
          ...baseOptions,
          body: notification.body,
          actions: [
            { action: 'reply', title: 'Reply' },
            { action: 'dismiss', title: 'Dismiss' },
          ],
        },
      };

    case 'mention':
      return {
        title: `${notification.title} mentioned you`,
        options: {
          ...baseOptions,
          body: notification.body,
          vibrate: [200, 100, 200],
        },
      };

    case 'checkin':
      return {
        title: 'Someone checked in!',
        options: {
          ...baseOptions,
          body: notification.body,
        },
      };

    case 'event':
      return {
        title: notification.title,
        options: {
          ...baseOptions,
          body: notification.body,
          requireInteraction: true,
        },
      };

    case 'tournament':
      return {
        title: notification.title,
        options: {
          ...baseOptions,
          body: notification.body,
          vibrate: [200, 100, 200, 100, 200],
          requireInteraction: true,
        },
      };

    case 'game':
      return {
        title: notification.title,
        options: {
          ...baseOptions,
          body: notification.body,
          actions: [
            { action: 'view', title: 'Watch' },
            { action: 'dismiss', title: 'Dismiss' },
          ],
        },
      };

    default:
      return {
        title: notification.title,
        options: {
          ...baseOptions,
          body: notification.body,
        },
      };
  }
}

export default usePushNotifications;
