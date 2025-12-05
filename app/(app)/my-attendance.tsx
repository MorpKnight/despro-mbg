import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import LoadingState from '../../components/ui/LoadingState';
import PageHeader from '../../components/ui/PageHeader';
import { fetchAttendanceList, type AttendanceRecord } from '../../services/attendance';
import { useAuth } from '../../hooks/useAuth';

// Use same locale config as attendance-history
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
        month: 'long',
        year: 'numeric'
    });
}

export default function MyAttendancePage() {
    const { user } = useAuth();
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

    const { data: attendances, isLoading, isRefetching, refetch } = useQuery({
        queryKey: ['my-attendance', selectedDate],
        queryFn: () => fetchAttendanceList({
            limit: 50,
            date: selectedDate
            // Backend automatically filters by current_user.id for SISWA
        }),
    });

    const hasData = attendances && attendances.length > 0;

    return (
        <SafeAreaView className="flex-1 bg-[#f5f7fb]">
            <PageHeader
                title="Absensi Saya"
                subtitle="Riwayat kehadiran anda"
                showBackButton={true}
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
                            title="Tidak ada data"
                            description={`Anda tidak memiliki data absensi pada tanggal ${selectedDate}.`}
                        />
                    ) : (
                        <View className="space-y-3">
                            {attendances!.map((item) => (
                                <Card key={item.id} className="p-4 flex-row items-center justify-between">
                                    <View className="flex-1">
                                        <Text className="font-bold text-gray-900 text-base">
                                            {item.method === 'nfc' ? 'Kartu NFC' :
                                                item.method === 'qr' ? 'QR Code' :
                                                    item.method === 'manual' ? 'Manual' : item.method}
                                        </Text>
                                        <Text className="text-gray-500 text-xs mt-1">
                                            Tercatat: {formatDate(item.createdAt)}
                                        </Text>
                                    </View>
                                    <View className="bg-emerald-100 px-3 py-1 rounded-full">
                                        <Text className="text-emerald-700 font-bold text-xs">
                                            {formatTime(item.createdAt)}
                                        </Text>
                                    </View>
                                </Card>
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
