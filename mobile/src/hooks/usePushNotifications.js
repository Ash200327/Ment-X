import { useState, useEffect, useRef } from 'react';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import axiosInstance from '../api/axiosConfig';

const Notifications = Constants.appOwnership !== 'expo' ? require('expo-notifications') : null;

if (Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

export default function usePushNotifications(isAuthenticated) {
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState(false);
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    if (!Notifications) return;

    if (isAuthenticated) {
      registerForPushNotificationsAsync().then(token => {
        setExpoPushToken(token);
        // Send token to backend
        if (token) {
          axiosInstance.post('/api/notifications/register-token', { token })
            .catch(err => console.error("Failed to register push token", err));
        }
      });
    }

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response);
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [isAuthenticated]);

  return { expoPushToken, notification };
}

async function registerForPushNotificationsAsync() {
  let token;

  if (Constants.appOwnership === 'expo') {
    console.warn('Push notifications are not supported in Expo Go. Skipping...');
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }
    // Note: getExpoPushTokenAsync requires a projectId in app.json if using EAS
    try {
      token = (await Notifications.getExpoPushTokenAsync()).data;
    } catch (e) {
      console.warn("Could not get push token. Ensure projectId is configured in app.json if using EAS Build.", e);
    }
  } else {
    // Cannot get token on simulator
  }

  return token;
}
