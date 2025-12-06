import React, { useState } from 'react';
import { ScrollView, Text, View, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { useQuery } from '@tanstack/react-query';
import { fetchStudentFoodHistory } from '../../services/foodHistory';
import PageHeader from '../../components/ui/PageHeader';
import LoadingState from '../../components/ui/LoadingState';
import EmptyState from '../../components/ui/EmptyState';
import { Card } from '../../components/ui/Card';
import { Ionicons } from '@expo/vector-icons';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { useDebounce } from '../../hooks/useDebounce';
import SearchInput from '../../components/ui/SearchInput';
import { api } from '../../services/api';

// Locale Config
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

function formatTime(isoString: string) {
    return new Date(isoString).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

export default function StudentFoodHistoryPage() {
    const [selectedTab, setSelectedTab] = useState(0); // 0: Menu, 1: Riwayat Makan, 2: Ulasan
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebounce(searchQuery, 500);

    // --- Tab 0: Menu History ---
    const { data: menus, isLoading: loadingMenus, refetch: refetchMenus, isRefetching: refetchingMenus } = useQuery({
        queryKey: ['student-food-history', selectedDate, debouncedSearchQuery],
        queryFn: async () => {
            console.log("Fetching student food history for:", { selectedDate, debouncedSearchQuery });
            const result = await fetchStudentFoodHistory({
                startDate: debouncedSearchQuery ? undefined : selectedDate,
                endDate: debouncedSearchQuery ? undefined : selectedDate,
                search: debouncedSearchQuery
            });
            console.log("Student food history result:", JSON.stringify(result, null, 2));
            return result;
        },
        enabled: selectedTab === 0
    });

    // --- Tab 1: Attendance/Eaten Logs ---
    const { data: attendanceLogs, isLoading: loadingAttendance, refetch: refetchAttendance, isRefetching: refetchingAttendance } = useQuery({
        queryKey: ['student-attendance-log', selectedDate],
        queryFn: async () => {
            // Construct query params manually since API helper doesn't support 'params' object
            const res = await api(`attendance/list?date_filter=${selectedDate}`, {
                method: 'GET'
            });
            return Array.isArray(res) ? res : [];
        },
        enabled: selectedTab === 1
    });

    // --- Tab 2: My Reviews ---
    const { data: reviews, isLoading: loadingReviews, refetch: refetchReviews, isRefetching: refetchingReviews } = useQuery({
        queryKey: ['student-reviews'],
        queryFn: async () => {
            const res = await api('feedback', {
                method: 'GET'
            });
            return Array.isArray(res) ? res : [];
        },
        enabled: selectedTab === 2
    });

    const handleRefresh = () => {
        if (selectedTab === 0) refetchMenus();
        if (selectedTab === 1) refetchAttendance();
        if (selectedTab === 2) refetchReviews();
    };

    const isRefreshing = refetchingMenus || refetchingAttendance || refetchingReviews;

    return (
        <SafeAreaView className="flex-1 bg-[#f5f7fb]">
            <PageHeader
                title="Aktivitas Makan"
                subtitle="History, Absensi & Ulasan"
                showBackButton={true}
                className="mx-6 mt-6"
                onRefresh={handleRefresh}
                isRefreshing={isRefreshing}
            />

            <View className="px-6 mt-4 mb-2">
                <SegmentedControl
                    values={['History Menu', 'Log Makan', 'Ulasan Saya']}
                    selectedIndex={selectedTab}
                    onChange={setSelectedTab}
                />
            </View>

            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
                {/* --- Date Picker & Search (Only for Tab 0 & 1) --- */}
                {(selectedTab === 0 || selectedTab === 1) && (
                    <View className="px-6 py-4 space-y-4">
                        {selectedTab === 0 && (
                            <SearchInput
                                placeholder="Cari menu..."
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                        )}
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
                        <View className="pb-2">
                            <Text className="text-gray-500 font-medium">
                                {selectedTab === 0 ? "Menu Tanggal:" : "Log Tanggal:"} {formatDate(selectedDate)}
                            </Text>
                        </View>
                    </View>
                )}

                <View className="px-6">
                    {/* --- Content: Menu History --- */}
                    {selectedTab === 0 && (
                        loadingMenus ? <LoadingState /> :
                            (!menus || menus.length === 0) ? (
                                <EmptyState
                                    title="Tidak ada catatan"
                                    description="Tidak ada data menu pada tanggal ini atau Anda tidak hadir."
                                />
                            ) : (
                                <View className="space-y-4">
                                    {menus.map((menu) => (
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

                                            {Array.isArray(menu.ingredients) && menu.ingredients.length > 0 && (
                                                <View className="bg-gray-50 p-3 rounded-lg">
                                                    <Text className="text-xs font-semibold text-gray-600 mb-1">Kandungan Gizi & Bahan:</Text>
                                                    <View className="flex-row flex-wrap gap-1">
                                                        {menu.ingredients.map((ing: any, idx: number) => (
                                                            <Text key={idx} className="text-xs text-gray-500">
                                                                • {ing.name} {ing.quantity ? `(${ing.quantity} ${ing.unit})` : ''}
                                                            </Text>
                                                        ))}
                                                    </View>
                                                </View>
                                            )}
                                        </Card>
                                    ))}
                                </View>
                            )
                    )}

                    {/* --- Content: Attendance Log --- */}
                    {selectedTab === 1 && (
                        loadingAttendance ? <LoadingState /> :
                            (!attendanceLogs || attendanceLogs.length === 0) ? (
                                <EmptyState
                                    title="Belum Makan"
                                    description="Anda belum melakukan scan/tap makan pada tanggal ini."
                                />
                            ) : (
                                <View className="space-y-3">
                                    {attendanceLogs.map((log: any) => (
                                        <Card key={log.id} className="p-4 flex-row items-center justify-between">
                                            <View className="flex-row items-center gap-3">
                                                <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center">
                                                    <Ionicons name="qr-code-outline" size={20} color="#2563EB" />
                                                </View>
                                                <View>
                                                    <Text className="text-base font-bold text-gray-900">Makan Siang</Text>
                                                    <Text className="text-xs text-gray-500">Metode: <Text className="font-semibold text-blue-600">{log.method}</Text></Text>
                                                </View>
                                            </View>
                                            <View className="items-end">
                                                <Text className="text-lg font-mono font-bold text-gray-900">{formatTime(log.created_at)}</Text>
                                                <Text className="text-xs text-green-600 font-medium">Berhasil</Text>
                                            </View>
                                        </Card>
                                    ))}
                                </View>
                            )
                    )}

                    {/* --- Content: Reviews --- */}
                    {selectedTab === 2 && (
                        loadingReviews ? <LoadingState /> :
                            (!reviews || reviews.length === 0) ? (
                                <EmptyState
                                    title="Belum ada ulasan"
                                    description="Anda belum pernah memberikan ulasan makanan."
                                />
                            ) : (
                                <View className="space-y-4">
                                    {reviews.map((review: any) => (
                                        <Card key={review.id} className="p-4">
                                            <View className="flex-row justify-between items-start mb-2">
                                                <View>
                                                    <Text className="text-xs text-gray-400 mb-1">{formatDate(review.created_at)}</Text>
                                                    <View className="flex-row">
                                                        {[1, 2, 3, 4, 5].map((star) => (
                                                            <Ionicons
                                                                key={star}
                                                                name={star <= review.rating ? "star" : "star-outline"}
                                                                size={16}
                                                                color="#F59E0B"
                                                            />
                                                        ))}
                                                    </View>
                                                </View>
                                                {review.photo_url && (
                                                    <Image source={{ uri: review.photo_url }} className="w-12 h-12 rounded-lg bg-gray-200" />
                                                )}
                                            </View>
                                            {review.comment && (
                                                <Text className="text-gray-700 mt-2 bg-gray-50 p-3 rounded-lg italic">"{review.comment}"</Text>
                                            )}
                                        </Card>
                                    ))}
                                </View>
                            )
                    )}

                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
