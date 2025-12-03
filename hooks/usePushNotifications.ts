// hooks/usePushNotifications.ts
import * as Notifications from "expo-notifications";
import { useEffect, useRef, useState } from "react";
import { registerForPushNotificationsAsync } from "../services/notifications";

export const usePushNotifications = () => {
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>("");
  const [notification, setNotification] = useState<Notifications.Notification | undefined>(
    undefined
  );

  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    // 1. Register Token
    registerForPushNotificationsAsync().then((token) => {
      setExpoPushToken(token);
      // TODO: Di sini Anda bisa memanggil API backend Anda untuk menyimpan token user
      // contoh: if(token) await api('users/device-token', { method: 'POST', body: { token } });
    });

    // 2. Setup Listeners
    // Listener ketika notifikasi diterima saat aplikasi sedang dibuka (foreground)
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      setNotification(notification);
    });

    // Listener ketika user menekan notifikasi (background/killed)
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log("User tapped notification:", response);
      // Di sini bisa ditambahkan logika navigasi (router.push)
    });

    // 3. Cleanup
    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return {
    expoPushToken,
    notification,
  };
};