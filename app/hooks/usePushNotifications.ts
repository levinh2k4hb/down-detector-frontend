'use client';

import { useState, useEffect } from 'react';

interface PushNotificationState {
  isSupported: boolean;
  isSubscribed: boolean;
  isPermissionGranted: boolean;
  isLoading: boolean;
  error: string | null;
}

export function usePushNotifications(adminId: number | null) {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    isSubscribed: false,
    isPermissionGranted: false,
    isLoading: true,
    error: null,
  });

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';

  useEffect(() => {
    checkPushSupport();
  }, []);

  const checkPushSupport = async () => {
    try {
      const isSupported = 
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window;

      if (!isSupported) {
        setState(prev => ({
          ...prev,
          isSupported: false,
          isLoading: false,
          error: 'Push notifications not supported',
        }));
        return;
      }

      const permission = Notification.permission;
      const isPermissionGranted = permission === 'granted';

      // Check if user is already subscribed
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      const isSubscribed = !!subscription;

      setState(prev => ({
        ...prev,
        isSupported: true,
        isSubscribed,
        isPermissionGranted,
        isLoading: false,
      }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    try {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      
      setState(prev => ({
        ...prev,
        isPermissionGranted: granted,
        error: granted ? null : 'Permission denied',
      }));

      return granted;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Permission request failed',
      }));
      return false;
    }
  };

  const subscribe = async (): Promise<boolean> => {
    if (!adminId) {
      setState(prev => ({ ...prev, error: 'Admin ID required' }));
      return false;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Request permission first
      const hasPermission = state.isPermissionGranted || await requestPermission();
      if (!hasPermission) {
        return false;
      }

      // Get VAPID public key from backend
      const vapidResponse = await fetch(`${API_BASE_URL}/push-notifications/vapid-public-key`);
      const { publicKey } = await vapidResponse.json();

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      // Send subscription to backend
      const subscribeResponse = await fetch(`${API_BASE_URL}/push-notifications/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminId,
          subscription: subscription.toJSON(),
        }),
      });

      if (!subscribeResponse.ok) {
        throw new Error('Failed to save subscription');
      }

      setState(prev => ({
        ...prev,
        isSubscribed: true,
        isLoading: false,
      }));

      return true;

    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Subscription failed',
      }));
      return false;
    }
  };

  const unsubscribe = async (): Promise<boolean> => {
    if (!adminId) return false;

    try {
      setState(prev => ({ ...prev, isLoading: true }));

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
      }

      // Remove subscription from backend
      await fetch(`${API_BASE_URL}/push-notifications/unsubscribe/${adminId}`, {
        method: 'DELETE',
      });

      setState(prev => ({
        ...prev,
        isSubscribed: false,
        isLoading: false,
      }));

      return true;

    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unsubscribe failed',
      }));
      return false;
    }
  };

  const sendTestNotification = async (): Promise<boolean> => {
    if (!adminId) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/push-notifications/test/${adminId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'This is a test notification from Down Detector PWA!',
        }),
      });

      const result = await response.json();
      return result.success;

    } catch (error) {
      console.error('Test notification failed:', error);
      return false;
    }
  };

  return {
    ...state,
    requestPermission,
    subscribe,
    unsubscribe,
    sendTestNotification,
  };
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}