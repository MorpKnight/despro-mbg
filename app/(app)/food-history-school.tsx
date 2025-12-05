import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { useQuery } from '@tanstack/react-query';
import { fetchSchoolFoodHistory } from '../../services/foodHistory';
import PageHeader from '../../components/ui/PageHeader';
import LoadingState from '../../components/ui/LoadingState';
import EmptyState from '../../components/ui/EmptyState';
import { Card } from '../../components/ui/Card';
import { Ionicons } from '@expo/vector-icons';

// Reuse LocaleConfig setup globally usually, but ensuring it here
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
    schoolId?: string;
}

import { useDebounce } from '../../hooks/useDebounce';
import SearchInput from '../../components/ui/SearchInput';

export default function SchoolFoodHistoryPage({ schoolId }: Props) {
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebounce(searchQuery, 500);

    const { data: menus, isLoading, isRefetching, refetch } = useQuery({
        queryKey: ['school-food-history', selectedDate, schoolId, debouncedSearchQuery],
        queryFn: () => fetchSchoolFoodHistory({
            startDate: debouncedSearchQuery ? undefined : selectedDate,
            endDate: debouncedSearchQuery ? undefined : selectedDate,
            schoolId,
            search: debouncedSearchQuery
        }),
    });

    const hasData = menus && menus.length > 0;

    return (
        <SafeAreaView className="flex-1 bg-[#f5f7fb]">
            <PageHeader
                title="History Makanan Sekolah"
                subtitle="Menu dari katering terhubung"
                showBackButton={true}
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
                        Menu Tanggal: {formatDate(selectedDate)}
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
                                    : `Tidak ada data menu untuk tanggal ${selectedDate}.`
                            }
                        />
                    ) : (
                        <View className="space-y-4">
                            {menus!.map((menu) => (
                                <Card key={menu.id} className="p-4">
                                    <View className="flex-row justify-between items-start mb-2">
                                        <View className="flex-1">
                                            <Text className="text-lg font-bold text-gray-900">{menu.namaMenu}</Text>
                                            <Text className="text-xs text-gray-500 mt-1">
                                                {menu.cateringName ? `Provided by: ${menu.cateringName}` : `Catering ID: ${menu.cateringId.substring(0, 8)}...`}
                                            </Text>
                                        </View>
                                        <View className="bg-blue-100 px-3 py-1 rounded-full">
                                            <Ionicons name="restaurant" size={12} color="#1E40AF" />
                                        </View>
                                    </View>

                                    {menu.notes && (
                                        <View className="bg-gray-50 p-3 rounded-lg mb-2">
                                            <Text className="text-sm text-gray-600 italic">"{menu.notes}"</Text>
                                        </View>
                                    )}

                                    {menu.ingredients && (
                                        <View>
                                            <Text className="text-xs font-semibold text-gray-500 mb-1">Komposisi:</Text>
                                            <View className="flex-row flex-wrap gap-1">
                                                {Object.entries(menu.ingredients).map(([key, val]: [string, any]) => (
                                                    <View key={key} className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                                        <Text className="text-xs text-slate-700">{key}: {val}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                        </View>
                                    )}
                                </Card>
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
