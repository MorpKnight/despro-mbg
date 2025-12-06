import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { useQuery } from '@tanstack/react-query';
import { fetchCateringFoodHistory } from '../../services/foodHistory';
import PageHeader from '../../components/ui/PageHeader';
import LoadingState from '../../components/ui/LoadingState';
import EmptyState from '../../components/ui/EmptyState';
import { Card } from '../../components/ui/Card';
import { Ionicons } from '@expo/vector-icons';

LocaleConfig.locales['id'] = LocaleConfig.locales['id'] || {
    monthNames: ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'],
    monthNamesShort: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
    dayNames: ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'],
    dayNamesShort: ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'],
    today: "Hari ini"
};
LocaleConfig.defaultLocale = 'id';

function formatDate(isoDate: string) {
    return new Date(isoDate).toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

interface Props {
    cateringId?: string;
}

import { useDebounce } from '../../hooks/useDebounce';
import SearchInput from '../../components/ui/SearchInput';

export default function CateringFoodHistoryPage({ cateringId }: Props) {
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebounce(searchQuery, 500);
    const { returnTo } = useLocalSearchParams<{ returnTo: string }>();

    const { data: menus, isLoading, isRefetching, refetch } = useQuery({
        queryKey: ['catering-food-history', selectedDate, cateringId, debouncedSearchQuery],
        queryFn: () => fetchCateringFoodHistory({
            startDate: debouncedSearchQuery ? undefined : selectedDate,
            endDate: debouncedSearchQuery ? undefined : selectedDate,
            cateringId,
            search: debouncedSearchQuery
        }),
    });

    const hasData = menus && menus.length > 0;

    return (
        <SafeAreaView className="flex-1 bg-[#f5f7fb]">
            <PageHeader
                title="History Menu Katering"
                subtitle="Daftar menu yang disajikan"
                backPath={returnTo}
                className="mx-6 mt-6"
                onRefresh={refetch}
                isRefreshing={isRefetching}
            />

            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
                <View className="px-6 py-4 space-y-4">
                    <SearchInput
                        placeholder="Cari menu atau bahan..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    <View className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <Calendar
                            current={selectedDate}
                            onDayPress={(day: any) => setSelectedDate(day.dateString)}
                            markedDates={{
                                [selectedDate]: { selected: true, disableTouchEvent: true }
                            }}
                            theme={{
                                selectedDayBackgroundColor: '#2563EB',
                                todayTextColor: '#2563EB',
                                arrowColor: '#2563EB',
                                textDayFontWeight: '500',
                            }}
                        />
                    </View>
                </View>

                <View className="px-6 pb-2">
                    <Text className="text-gray-500 font-medium">
                        Menu dibuat pada: {formatDate(selectedDate)}
                    </Text>
                </View>

                <View className="px-6">
                    {isLoading ? (
                        <LoadingState />
                    ) : !hasData ? (
                        <EmptyState
                            title="Tidak ada menu"
                            description={
                                debouncedSearchQuery
                                    ? `Tidak ditemukan menu dengan kata kunci "${debouncedSearchQuery}".`
                                    : `Anda tidak membuat menu pada tanggal ${selectedDate}.`
                            }
                        />
                    ) : (
                        <View className="space-y-4">
                            {menus!.map((menu) => (
                                <TouchableOpacity
                                    key={menu.id}
                                    onPress={() => router.push(`/menu/${menu.id}` as any)}
                                    activeOpacity={0.7}
                                >
                                    <Card className="p-4">
                                        <View className="flex-row justify-between items-start mb-2">
                                            <View className="flex-1">
                                                <Text className="text-lg font-bold text-gray-900">{menu.namaMenu}</Text>
                                            </View>
                                            <View className="bg-orange-100 px-3 py-1 rounded-full">
                                                <Ionicons name="nutrition" size={12} color="#C2410C" />
                                            </View>
                                        </View>

                                        {menu.notes && (
                                            <Text className="text-sm text-gray-600 mb-3 italic">Catatan: {menu.notes}</Text>
                                        )}

                                        <View className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                                            <Text className="text-xs font-bold text-blue-700 mb-1">Status Distribusi</Text>
                                            {/* Show Preview of School count if available, mostly it is not in list unless eager loaded. 
                                            Assuming simplistic list view first. */}
                                            <Text className="text-xs text-blue-600">
                                                Klik untuk melihat detail distribusi sekolah dan ulasan.
                                            </Text>
                                        </View>
                                    </Card>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
