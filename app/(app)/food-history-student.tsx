import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { useQuery } from '@tanstack/react-query';
import { fetchStudentFoodHistory } from '../../services/foodHistory';
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

import { useDebounce } from '../../hooks/useDebounce';
import SearchInput from '../../components/ui/SearchInput';

export default function StudentFoodHistoryPage() {
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebounce(searchQuery, 500);

    const { data: menus, isLoading, isRefetching, refetch } = useQuery({
        queryKey: ['student-food-history', selectedDate, debouncedSearchQuery],
        queryFn: () => fetchStudentFoodHistory({
            startDate: debouncedSearchQuery ? undefined : selectedDate,
            endDate: debouncedSearchQuery ? undefined : selectedDate,
            search: debouncedSearchQuery
        }),
    });

    const hasData = menus && menus.length > 0;

    return (
        <SafeAreaView className="flex-1 bg-[#f5f7fb]">
            <PageHeader
                title="Apa yang saya makan?"
                subtitle="History makanan MBG"
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
                            title="Tidak ada catatan"
                            description={
                                debouncedSearchQuery
                                    ? `Tidak ditemukan menu dengan kata kunci "${debouncedSearchQuery}".`
                                    : `Tidak ada data menu pada tanggal ${selectedDate} (atau Anda tidak hadir).`
                            }
                        />
                    ) : (
                        <View className="space-y-4">
                            {menus!.map((menu) => (
                                <Card key={menu.id} className="p-4 border-l-4 border-l-emerald-500">
                                    <View className="flex-row items-center gap-3 mb-3">
                                        <View className="w-10 h-10 bg-emerald-100 rounded-full items-center justify-center">
                                            <Ionicons name="fast-food" size={20} color="#059669" />
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-lg font-bold text-gray-900">{menu.namaMenu}</Text>
                                            <Text className="text-xs text-gray-500">
                                                {menu.cateringName ? `Oleh: ${menu.cateringName}` : 'MBG Resmi'}
                                            </Text>
                                        </View>
                                    </View>

                                    {menu.ingredients && (
                                        <View className="bg-gray-50 p-3 rounded-lg">
                                            <Text className="text-xs font-semibold text-gray-600 mb-1">Kandungan Gizi & Bahan:</Text>
                                            <View className="flex-row flex-wrap gap-1">
                                                {Object.entries(menu.ingredients).map(([key, val]: [string, any]) => (
                                                    <Text key={key} className="text-xs text-gray-500">• {key}: {val}</Text>
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
