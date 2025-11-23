import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Card from '../../components/ui/Card';
import { api } from '../../services/api';

interface Notification {
    id: string;
    title: string;
    message: string;
    is_read: boolean;
    created_at: string;
    type: string;
}

export default function NotificationsPage() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showOnlyUnread, setShowOnlyUnread] = useState(false);

    const fetchNotifications = async () => {
        try {
            const data = await api('notifications/');
            setNotifications(data);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchNotifications();

        // Poll every 10 seconds
        const interval = setInterval(() => {
            fetchNotifications();
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    const handleMarkAsRead = async (id: string) => {
        try {
            await api(`notifications/${id}/read`, { method: 'PATCH' });
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
            );
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const filteredNotifications = useMemo(() => {
        if (!showOnlyUnread) return notifications;
        return notifications.filter(n => !n.is_read);
    }, [notifications, showOnlyUnread]);

    const renderItem = ({ item }: { item: Notification }) => (
        <TouchableOpacity
            onPress={() => !item.is_read && handleMarkAsRead(item.id)}
            activeOpacity={0.7}
        >
            <Card className={`mb-3 p-4 ${item.is_read ? 'bg-white' : 'bg-blue-50 border-l-4 border-l-blue-500'}`}>
                <View className="flex-row justify-between items-start">
                    <View className="flex-1 mr-3">
                        <Text className={`text-base ${item.is_read ? 'font-semibold text-gray-800' : 'font-bold text-blue-900'}`}>
                            {item.title}
                        </Text>
                        <Text className="text-gray-600 mt-1 leading-5">{item.message}</Text>
                        <Text className="text-xs text-gray-400 mt-2">
                            {new Date(item.created_at).toLocaleString('id-ID')}
                        </Text>
                    </View>
                    {!item.is_read && (
                        <View className="w-3 h-3 rounded-full bg-blue-500 mt-1" />
                    )}
                </View>
            </Card>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView className="flex-1 bg-[#f5f7fb]">
            <View className="flex-1 p-6">
                <View className="flex-row items-center mb-6">
                    <TouchableOpacity onPress={() => router.back()} className="mr-4">
                        <Ionicons name="arrow-back" size={24} color="#111827" />
                    </TouchableOpacity>
                    <Text className="text-2xl font-bold text-gray-900">Notifikasi</Text>
                </View>

                {/* Filter Toggle */}
                <TouchableOpacity
                    onPress={() => setShowOnlyUnread(!showOnlyUnread)}
                    className="flex-row items-center gap-2 mb-4 p-3 bg-white rounded-lg border border-gray-200"
                >
                    <Ionicons
                        name={showOnlyUnread ? 'checkbox' : 'square-outline'}
                        size={24}
                        color={showOnlyUnread ? '#1976D2' : '#9CA3AF'}
                    />
                    <Text className="text-base text-gray-700">Tampilkan hanya yang belum dibaca</Text>
                </TouchableOpacity>

                {loading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color="#1976D2" />
                    </View>
                ) : (
                    <FlatList
                        data={filteredNotifications}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={{ paddingBottom: 20 }}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchNotifications(); }} />
                        }
                        ListEmptyComponent={
                            <View className="items-center justify-center py-10">
                                <Ionicons name="notifications-off-outline" size={48} color="#9CA3AF" />
                                <Text className="text-gray-500 mt-4">
                                    {showOnlyUnread ? 'Tidak ada notifikasi yang belum dibaca.' : 'Tidak ada notifikasi.'}
                                </Text>
                            </View>
                        }
                    />
                )}
            </View>
        </SafeAreaView>
    );
}
