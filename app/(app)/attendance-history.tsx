import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import LoadingState from '../../components/ui/LoadingState';
import PageHeader from '../../components/ui/PageHeader';
import { fetchAttendanceList, type AttendanceRecord } from '../../services/attendance';

// Configure Locale for Indonesian
LocaleConfig.locales['id'] = {
    monthNames: [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ],
    monthNamesShort: [
        'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
        'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
    ],
    dayNames: ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'],
    dayNamesShort: ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'],
    today: "Hari ini"
};
LocaleConfig.defaultLocale = 'id';

function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',

    });
}

export default function AttendanceHistoryPage({ schoolId }: { schoolId?: string }) {
    // Current date for default selection
    const { returnTo } = useLocalSearchParams<{ returnTo: string }>();
    const today = new Date().toISOString().split('T')[0];
    const [selectedDate, setSelectedDate] = useState(today);
    const [page, setPage] = useState(0);

    const {
        data: attendanceData,
        isLoading,
        isRefetching,
        refetch
    } = useQuery({
        queryKey: ['attendance-list', selectedDate, page, schoolId],
        queryFn: () => fetchAttendanceList({
            date: selectedDate,
            offset: page * 20,
            limit: 20,
            schoolId // Pass optional schoolId
        })
    });

    const attendances = attendanceData || [];
    const hasNextPage = attendances.length === 20;
    const hasData = attendances.length > 0;

    return (
        <SafeAreaView className="flex-1 bg-[#f5f7fb]">
            <PageHeader
                title="Riwayat Absensi"
                subtitle="Daftar kehadiran siswa"
                showBackButton={true}
                backPath={returnTo}
                className="mx-6 mt-6"
                onRefresh={refetch}
                isRefreshing={isRefetching}
            />

            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
                <View className="px-6 py-4">
                    <View className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <Calendar
                            current={selectedDate}
                            onDayPress={(day: { dateString: string }) => {
                                setSelectedDate(day.dateString);
                                setPage(0);
                            }}
                            markedDates={{
                                [selectedDate]: { selected: true, disableTouchEvent: true }
                            }}
                            theme={{
                                selectedDayBackgroundColor: '#2563EB',
                                todayTextColor: '#2563EB',
                                arrowColor: '#2563EB',
                                textDayFontWeight: '500',
                                textMonthFontWeight: 'bold',
                                textDayHeaderFontWeight: 'bold',
                                textDayFontSize: 14,
                                textMonthFontSize: 16,
                                textDayHeaderFontSize: 12
                            }}
                        />
                    </View>
                </View>

                <View className="px-6 pb-2">
                    <Text className="text-gray-500 font-medium">
                        Kehadiran: {formatDate(selectedDate)}
                    </Text>
                </View>

                <View className="px-6">
                    {isLoading ? (
                        <LoadingState />
                    ) : !hasData ? (
                        <EmptyState
                            title="Belum ada data absensi"
                            description={`Tidak ada data kehadiran untuk tanggal ${selectedDate}.`}
                        />
                    ) : (
                        <View className="space-y-3">
                            {attendances!.map((item) => (
                                <Card key={item.id} className="p-4 flex-row items-center justify-between">
                                    <View className="flex-1">
                                        <Text className="font-bold text-gray-900 text-base">
                                            {item.student?.fullName ?? "Siswa Tanpa Nama"}
                                        </Text>
                                        <Text className="text-gray-500 text-xs mt-1">
                                            Metode: {item.method}
                                        </Text>
                                    </View>
                                    <View className="bg-emerald-100 px-3 py-1 rounded-full">
                                        <Text className="text-emerald-700 font-bold text-xs">
                                            {formatTime(item.createdAt)}
                                        </Text>
                                    </View>
                                </Card>
                            ))}

                            <View className="flex-row justify-between pt-4">
                                <Pressable
                                    disabled={page === 0}
                                    onPress={() => setPage(p => Math.max(0, p - 1))}
                                    className={`px-4 py-2 rounded-lg border ${page === 0 ? 'bg-gray-100 border-gray-200 opacity-50' : 'bg-white border-gray-300'}`}
                                >
                                    <Text className="text-gray-700">Sebelumnya</Text>
                                </Pressable>

                                <Pressable
                                    disabled={!hasNextPage}
                                    onPress={() => setPage(p => p + 1)}
                                    className={`px-4 py-2 rounded-lg border ${!hasNextPage ? 'bg-gray-100 border-gray-200 opacity-50' : 'bg-white border-gray-300'}`}
                                >
                                    <Text className="text-gray-700">Selanjutnya</Text>
                                </Pressable>
                            </View>
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
