// app/(auth)/test.tsx
import React from "react";
import { Button, StyleSheet, Text, View } from "react-native";
import { usePushNotifications } from "../../hooks/usePushNotifications";
import { sendTestPushNotification } from "../../services/notifications";

export default function TestNotifications() {
  // Menggunakan custom hook
  const { expoPushToken, notification } = usePushNotifications();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Test Push Notifications</Text>

      <Text style={styles.label}>Expo Push Token:</Text>
      <Text selectable style={styles.token}>
        {expoPushToken ?? "Waiting for token..."}
      </Text>

      <View style={styles.buttonContainer}>
        <Button
          title="Send Test Push Notification"
          onPress={() => {
            if (expoPushToken) sendTestPushNotification(expoPushToken);
            else alert("Token belum tersedia");
          }}
        />
      </View>

      {notification && (
        <View style={styles.notificationContainer}>
          <Text style={styles.label}>Last Notification Received:</Text>
          <Text>Title: {notification.request.content.title}</Text>
          <Text>Body: {notification.request.content.body}</Text>
          <Text>Data: {JSON.stringify(notification.request.content.data)}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
  },
  label: {
    marginTop: 10,
    fontWeight: "600",
  },
  token: {
    fontSize: 12,
    textAlign: "center",
    color: "#555",
    marginVertical: 10,
  },
  buttonContainer: {
    marginTop: 20,
  },
  notificationContainer: {
    marginTop: 30,
    padding: 10,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    width: '100%',
  }
});