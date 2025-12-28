import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

export interface PushNotificationToken {
  value: string;
}

export async function initPushNotifications(): Promise<string | null> {
  // Only run on native platforms
  if (!Capacitor.isNativePlatform()) {
    console.log('Push notifications only available on native platforms');
    return null;
  }

  try {
    // Request permission
    const permStatus = await PushNotifications.requestPermissions();
    
    if (permStatus.receive === 'granted') {
      // Register with Apple / Google to receive push
      await PushNotifications.register();
      
      // Get the token when registration is successful
      return new Promise((resolve) => {
        PushNotifications.addListener('registration', (token: PushNotificationToken) => {
          console.log('Push registration success, token:', token.value);
          resolve(token.value);
        });

        PushNotifications.addListener('registrationError', (error: any) => {
          console.error('Push registration error:', error);
          resolve(null);
        });
      });
    } else {
      console.log('Push notification permission denied');
      return null;
    }
  } catch (error) {
    console.error('Error initializing push notifications:', error);
    return null;
  }
}

export function setupPushListeners(
  onNotificationReceived?: (notification: any) => void,
  onNotificationActionPerformed?: (notification: any) => void
) {
  if (!Capacitor.isNativePlatform()) {
    return () => {};
  }

  // Show notification when app is in foreground
  const receivedListener = PushNotifications.addListener(
    'pushNotificationReceived',
    (notification) => {
      console.log('Push notification received:', notification);
      onNotificationReceived?.(notification);
    }
  );

  // Handle notification tap
  const actionListener = PushNotifications.addListener(
    'pushNotificationActionPerformed',
    (notification) => {
      console.log('Push notification action performed:', notification);
      onNotificationActionPerformed?.(notification);
    }
  );

  // Return cleanup function
  return () => {
    receivedListener.then(l => l.remove());
    actionListener.then(l => l.remove());
  };
}

export async function scheduleSessionReminder(
  sessionId: string,
  sessionTitle: string,
  reminderTime: Date
): Promise<void> {
  // For session reminders, we'd typically send this to the backend
  // to schedule a push notification via FCM/APNs
  console.log('Session reminder scheduled:', {
    sessionId,
    sessionTitle,
    reminderTime
  });
  
  // In a real implementation, you would:
  // 1. Save the reminder to the database
  // 2. Use a server-side scheduler to send the push at the right time
  // 3. The server would use Firebase Cloud Messaging (FCM) or APNs
}

export async function cancelSessionReminder(sessionId: string): Promise<void> {
  console.log('Session reminder cancelled:', sessionId);
  // Cancel the scheduled notification on the server
}
