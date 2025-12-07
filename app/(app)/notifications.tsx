import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useFocusEffect } from "@react-navigation/native";
import Card from "../../components/ui/Card";
import { usePushNotifications } from "../../hooks/usePushNotifications";
import { fetchNotifications, markNotificationAsRead, type NotificationItem } from "../../services/notifications";

function formatDate(isoString: string) {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Baru saja";
  if (diffMins < 60) return `${diffMins} menit yang lalu`;
  if (diffHours < 24) return `${diffHours} jam yang lalu`;
  if (diffDays < 7) return `${diffDays} hari yang lalu`;
  
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getLevelColor(level: string) {
  switch (level) {
    case "error":
      return "bg-red-100 text-red-800";
    case "warning":
      return "bg-yellow-100 text-yellow-800";
    case "success":
      return "bg-green-100 text-green-800";
    default:
      return "bg-blue-100 text-blue-800";
  }
}

function getLevelIcon(level: string) {
  switch (level) {
    case "error":
      return "alert-circle";
    case "warning":
      return "warning";
    case "success":
      return "checkmark-circle";
    default:
      return "information-circle";
  }
}

export default function NotificationsPage() {
  const router = useRouter();
  const { expoPushToken } = usePushNotifications();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch notifikasi dari API
  const {
    data: notifications = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
    staleTime: 30 * 1000, // 30 detik
  });

  // Refresh saat focus
  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [refetch])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleNotificationPress = async (item: NotificationItem) => {
    // Mark as read jika belum dibaca
    if (!item.is_read) {
      try {
        await markNotificationAsRead(item.id);
        // Refetch untuk update UI
        await refetch();
      } catch (error) {
        console.warn("Failed to mark notification as read", error);
      }
    }

    // Navigate jika ada link
    if (item.link_to) {
      router.push(item.link_to as any);
    }
  };

  const renderItem = ({ item }: { item: NotificationItem }) => {
    const levelColor = getLevelColor(item.level);
    const levelIcon = getLevelIcon(item.level);

    return (
      <TouchableOpacity
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <Card className={`mb-3 p-4 ${!item.is_read ? "bg-blue-50 border-l-4 border-blue-500" : "bg-white"}`}>
          <View className="flex-row justify-between items-start">
            <View className="flex-1 mr-3">
              <View className="flex-row items-center mb-2">
                <Ionicons
                  name={levelIcon as any}
                  size={20}
                  color={
                    item.level === "error"
                      ? "#EF4444"
                      : item.level === "warning"
                      ? "#F59E0B"
                      : item.level === "success"
                      ? "#10B981"
                      : "#3B82F6"
                  }
                />
                <View className={`ml-2 px-2 py-0.5 rounded-full ${levelColor}`}>
                  <Text className="text-xs font-medium capitalize">
                    {item.level}
                  </Text>
                </View>
                {!item.is_read && (
                  <View className="ml-2 w-2 h-2 bg-blue-500 rounded-full" />
                )}
              </View>
              <Text className="text-base font-semibold text-gray-900 mb-1">
                {item.message}
              </Text>
              <View className="flex-row items-center justify-between mt-2">
                <Text className="text-xs text-gray-400">
                  {formatDate(item.created_at)}
                </Text>
                {item.type && (
                  <Text className="text-xs text-gray-400 capitalize">
                    {item.type}
                  </Text>
                )}
              </View>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f5f7fb]">
      <View className="flex-row items-center p-6">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-gray-900">Notifikasi</Text>
      </View>

      {isLoading && !refreshing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="text-gray-500 mt-4">Memuat notifikasi...</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing || isRefetching}
              onRefresh={handleRefresh}
            />
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-10">
              <Ionicons
                name="notifications-off-outline"
                size={48}
                color="#9CA3AF"
              />
              <Text className="text-gray-500 mt-4 text-center">
                Belum ada notifikasi yang diterima.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
