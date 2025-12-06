import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Card from "../../components/ui/Card";
import { usePushNotifications } from "../../hooks/usePushNotifications";

export default function NotificationsPage() {
  const router = useRouter();

  const { expoPushToken, notification } = usePushNotifications();
  const [notifications, setNotifications] = useState<any[]>([]);

  // Add notification when received
  React.useEffect(() => {
    if (notification) {
      const newNotification = {
        id: Date.now().toString(),
        title: notification.request.content.title,
        message: notification.request.content.body,
        data: notification.request.content.data,
        created_at: new Date().toLocaleString("id-ID"),
      };
      setNotifications((prev) => [newNotification, ...prev]);
    }
  }, [notification]);

  const renderItem = ({ item }: { item: any }) => (
    <Card className="mb-3 p-4 bg-white">
      <View className="flex-row justify-between items-start">
        <View className="flex-1 mr-3">
          <Text className="text-base font-bold text-gray-900">{item.title}</Text>
          <Text className="text-gray-600 mt-1 leading-5">{item.message}</Text>
          <Text className="text-xs text-gray-400 mt-2">{item.created_at}</Text>
        </View>
      </View>
    </Card>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#f5f7fb]">
      <View className="flex-row items-center p-6">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-gray-900">Notifikasi</Text>
      </View>

      <View className="px-6">
        <Text className="text-xs text-gray-500">
          Expo Push Token: {expoPushToken ?? "Waiting..."}
        </Text>
      </View>

      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20 }}
        ListEmptyComponent={
          <View className="items-center justify-center py-10">
            <Ionicons
              name="notifications-off-outline"
              size={48}
              color="#9CA3AF"
            />
            <Text className="text-gray-500 mt-4">
              Belum ada notifikasi yang diterima.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
