import { useEffect, useState } from 'react';
import { initPushNotifications, setupPushListeners } from '@/lib/pushNotifications';
import { useToast } from '@/hooks/use-toast';

export function usePushNotifications() {
  const [token, setToken] = useState<string | null>(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Set up push notification listeners
    const cleanup = setupPushListeners(
      // On notification received (foreground)
      (notification) => {
        toast({
          title: notification.title || 'Session Reminder',
          description: notification.body || 'Time to continue your spiral journey!',
        });
      },
      // On notification action performed (tap)
      (action) => {
        // Navigate to the session if sessionId is in the notification data
        const sessionId = action.notification?.data?.sessionId;
        if (sessionId) {
          window.location.href = `/sessions/${sessionId}`;
        }
      }
    );

    return cleanup;
  }, [toast]);

  const enablePushNotifications = async () => {
    const pushToken = await initPushNotifications();
    if (pushToken) {
      setToken(pushToken);
      setIsEnabled(true);
      toast({
        title: 'Push notifications enabled',
        description: 'You will receive session reminders.',
      });
      return true;
    } else {
      toast({
        title: 'Could not enable notifications',
        description: 'Please check your device settings.',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    token,
    isEnabled,
    enablePushNotifications,
  };
}
