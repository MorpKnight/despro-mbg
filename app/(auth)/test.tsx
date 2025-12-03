import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useEffect, useState } from "react";
import { Button, Platform, Text, View } from "react-native";

// Notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function sendPushNotification(expoPushToken: string) {
  const message = {
    to: expoPushToken,
    sound: "default",
    title: "Hello from Expo!",
    body: "This is a test push notification",
    data: { test: "data" },
  };

  await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(message),
  });
}

async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  if (!Device.isDevice) {
    alert("Push notifications require a physical device");
    return;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    alert("Failed to get permissions");
    return;
  }

  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ??
    Constants?.easConfig?.projectId;

  if (!projectId) {
    alert("Project ID missing in config");
    return;
  }

  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  console.log("Expo push token: ", token);
  return token;
}

export default function TestNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string>("");
  const [notification, setNotification] =
    useState<Notifications.Notification>();

  useEffect(() => {
    registerForPushNotificationsAsync().then((token) =>
      setExpoPushToken(token ?? "")
    );

    const listener = Notifications.addNotificationReceivedListener((n) =>
      setNotification(n)
    );
    const responseListener =
      Notifications.addNotificationResponseReceivedListener((response) =>
        console.log(response)
      );

    return () => {
      listener.remove();
      responseListener.remove();
    };
  }, []);

  return (
    <View style={{ padding: 20, alignItems: "center" }}>
      <Text style={{ fontSize: 18, fontWeight: "bold" }}>Test Push Notifications</Text>

      <Text style={{ marginTop: 10 }}>Expo Push Token:</Text>
      <Text selectable style={{ fontSize: 12, textAlign: "center" }}>
        {expoPushToken}
      </Text>

      <View style={{ marginTop: 20 }}>
        <Button
          title="Send Test Push Notification"
          onPress={() => sendPushNotification(expoPushToken)}
        />
      </View>

      {notification && (
        <View style={{ marginTop: 30 }}>
          <Text>Last Notification:</Text>
          <Text>Title: {notification.request.content.title}</Text>
          <Text>Body: {notification.request.content.body}</Text>
        </View>
      )}
    </View>
  );
}
