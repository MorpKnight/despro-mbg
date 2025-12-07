import React, { useEffect } from "react";
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity } from "react-native";
import PageHeader from '../../components/ui/PageHeader';
import { api } from '../../services/api';
import { useQuery } from "@tanstack/react-query";

function formatDate(isoDate: string) {
    return new Date(isoDate).toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

export default function StudentMenuList() {
    const { data: menus, isLoading, refetch, isRefetching } = useQuery({
        queryKey: ['student-updated-menus'],
        queryFn: async () => {
            const res = await api('/menus/student/upcoming', { method: 'GET' });
            console.log(res);
            return Array.isArray(res) ? res : [];
        },
         refetchOnWindowFocus: false, // optional
        staleTime: 1000 * 60,
    });

    useEffect(() => {
        console.log('menus updated:', menus);
    }, [menus]);
    
    const handleRefresh = async () => {
        await refetch();
    };

    return (
        <SafeAreaView className="flex-1 bg-[#f5f7fb]">
            <PageHeader
                title="Jadwal Menu"
                subtitle="Menu yang telah ditambahkan katering"
                showBackButton={true}
                className="mx-6 mt-6"
                onRefresh={handleRefresh}
                isRefreshing={isRefetching}
            />
            <FlatList
                data={menus ?? []}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={{ paddingBottom: 40 }}
                ItemSeparatorComponent={() => <View className="h-2" />}
                renderItem={({ item }) => (
                    <View className="mx-4 my-2">
                        <TouchableOpacity className="bg-white rounded-xl p-4 shadow-md" activeOpacity={0.85}>
                            <View className="flex-row justify-between items-start">
                                <View className="flex-1 pr-2">
                                    <Text className="text-sm text-gray-500">{formatDate(item.tanggal)}</Text>
                                    <Text className="mt-1 text-lg font-bold text-gray-800">{item.nama_menu}</Text>
                                    {item.notes ? <Text className="mt-2 text-gray-600">{item.notes}</Text> : null}
                                </View>
                            </View>
                        </TouchableOpacity>
                    </View>
                )}
                refreshing={isRefetching}
                onRefresh={handleRefresh}
                ListEmptyComponent={
                    isLoading ? (
                        <View className="py-12 items-center">
                            <ActivityIndicator size="large" color="#2563eb" />
                        </View>
                    ) : (
                        <View className="py-12 items-center">
                            <Text className="text-gray-600">Belum ada menu terbaru dari katering.</Text>
                        </View>
                    )
                }
            />
        </SafeAreaView>
    );
}



