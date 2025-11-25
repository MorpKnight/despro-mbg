import { Ionicons } from '@expo/vector-icons';
import { FlashList, type ListRenderItemInfo } from '@shopify/flash-list';
import { Link, Redirect } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Skeleton from '../../components/ui/Skeleton';
import { useAuth } from '../../hooks/useAuth';
import {
  fetchAttendanceList,
  fetchAttendanceSummary,
  type AttendanceRecord,
  type AttendanceSummary,
} from '../../services/attendance';

function formatDateLabel(date: Date) {
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isSameCalendarDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function methodLabel(method: AttendanceRecord['method']) {
  switch (method) {
    case 'nfc':
      return 'NFC';
    case 'qr':
      return 'QR';
    case 'assisted':
      return 'Bantuan';
    default:
      return 'Manual';
  }
}

function methodTone(method: AttendanceRecord['method']) {
  switch (method) {
    case 'nfc':
      return { bg: '#1D4ED810', text: '#1D4ED8' };
    case 'qr':
      return { bg: '#7C3AED10', text: '#7C3AED' };
    case 'assisted':
      return { bg: '#F59E0B10', text: '#F59E0B' };
    default:
      return { bg: '#05966910', text: '#059669' };
  }
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function StudentAttendancePage() {
  const { user } = useAuth();
  const isAdminSekolah = user?.role === 'admin_sekolah';
  const isSuperAdmin = user?.role === 'super_admin';

  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const isoDate = useMemo(() => formatIsoDate(selectedDate), [selectedDate]);
  const viewingToday = useMemo(() => isSameCalendarDay(selectedDate, new Date()), [selectedDate]);

  useEffect(() => {
    if (!isAdminSekolah) {
      setLoading(false);
      setRecords([]);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    fetchAttendanceList({ date: isoDate, limit: 500 })
      .then((list) => {
        if (!active) return;
        setRecords(list);
      })
      .catch((err) => {
        console.warn('[attendance] gagal memuat daftar', err);
        if (!active) return;
        setError('Gagal memuat data absensi untuk tanggal ini.');
        setRecords([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isoDate, isAdminSekolah]);

  useEffect(() => {
    if (!isAdminSekolah) {
      setSummaryLoading(false);
      setSummary(null);
      return;
    }

    let active = true;
    setSummaryLoading(true);
    setSummaryError(null);

    fetchAttendanceSummary()
      .then((data) => {
        if (!active) return;
        setSummary(data);
      })
      .catch((err) => {
        console.warn('[attendance] gagal memuat ringkasan', err);
        if (!active) return;
        setSummaryError('Ringkasan absensi tidak tersedia saat ini.');
        setSummary(null);
      })
      .finally(() => {
        if (active) setSummaryLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isAdminSekolah]);

  const presentCount = useMemo(() => {
    if (viewingToday && summary) return summary.presentToday;
    return records.length;
  }, [records.length, summary, viewingToday]);

  const absentCount = useMemo(() => {
    if (viewingToday && summary) return summary.absentToday;
    return null;
  }, [summary, viewingToday]);

  const totalStudents = useMemo(() => {
    if (viewingToday && summary) return summary.totalStudents;
    return null;
  }, [summary, viewingToday]);

  const handleRefresh = async () => {
    if (!isAdminSekolah) return;
    setRefreshing(true);
    setError(null);
    try {
      const list = await fetchAttendanceList({ date: isoDate, limit: 500 });
      setRecords(list);
    } catch (err) {
      console.warn('[attendance] refresh gagal', err);
      setError('Tidak dapat memuat ulang data.');
    } finally {
      setRefreshing(false);
    }
  };

  const goToPreviousDay = () => {
    setSelectedDate((prev) => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - 1));
  };

  const goToNextDay = () => {
    setSelectedDate((prev) => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 1));
  };

  const listData = loading ? [] : records;

  const renderAttendanceItem = useCallback(
    ({ item }: ListRenderItemInfo<AttendanceRecord>) => {
      const tone = methodTone(item.method);
      return (
        <Card>
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-3">
              <Text className="font-semibold text-gray-900 mb-1">
                {item.student.fullName || item.student.username}
              </Text>
              <Text className="text-xs text-gray-500 mb-2">ID: {item.student.username}</Text>
              <View className="self-start px-3 py-1 rounded-full" style={{ backgroundColor: tone.bg }}>
                <Text style={{ color: tone.text, fontSize: 12, fontWeight: '700' }}>
                  {methodLabel(item.method)}
                </Text>
              </View>
            </View>
            <View className="items-end">
              <Text className="text-sm font-semibold text-gray-900">{formatTime(item.createdAt)} WIB</Text>
              <Text className="text-xs text-gray-500">
                {new Date(item.createdAt).toLocaleDateString('id-ID')}
              </Text>
            </View>
          </View>
        </Card>
      );
    },
    [],
  );

  const renderEmptyComponent = useCallback(() => {
    if (loading) return null;
    return (
      <View className="items-center justify-center py-12">
        <Ionicons name="calendar-outline" size={40} color="#9CA3AF" />
        <Text className="text-gray-500 mt-2 text-center">
          Belum ada catatan kehadiran untuk tanggal ini. Pastikan perangkat pencatatan aktif.
        </Text>
      </View>
    );
  }, [loading]);

  if (user?.role !== 'admin_sekolah' && user?.role !== 'super_admin') {
    return <Redirect href="/" />;
  }

  if (isSuperAdmin && !isAdminSekolah) {
    return (
      <SafeAreaView className="flex-1 bg-[#f5f7fb]">
        <ScrollView className="flex-1 bg-neutral-gray">
          <View className="p-6">
            <Card>
              <Text className="text-lg font-semibold text-gray-900 mb-2">Perlu memilih sekolah</Text>
              <Text className="text-gray-600">
                Super admin perlu memilih konteks sekolah sebelum melihat data absensi. Silakan masuk sebagai admin sekolah atau
                gunakan fitur pemilihan sekolah (belum tersedia) untuk melanjutkan.
              </Text>
            </Card>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#f5f7fb]">
      <FlashList
        data={listData}
        renderItem={renderAttendanceItem}
        keyExtractor={(item) => item.id}
        // @ts-ignore
        estimatedItemSize={112}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={renderEmptyComponent}
        ListHeaderComponent={
          <View className="pt-6">
            <View className="mb-4">
              <Text className="text-2xl font-bold text-gray-900">Absensi Makan Harian</Text>
              <Text className="text-sm text-gray-600">
                Data absensi otomatis tersinkron setiap kali siswa melakukan tap NFC, scan QR, atau pencatatan manual.
              </Text>
            </View>

            <View className="mb-4 flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <View className="w-9 h-9 rounded-full items-center justify-center" style={{ backgroundColor: '#1976D220' }}>
                  <Ionicons name="calendar-outline" size={18} color="#1976D2" />
                </View>
                <Text className="text-gray-900 font-semibold">{formatDateLabel(selectedDate)}</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Ionicons name="chevron-back" size={22} color="#374151" onPress={goToPreviousDay} />
                <Ionicons name="chevron-forward" size={22} color="#374151" onPress={goToNextDay} />
              </View>
            </View>

            <View className="mb-4">
              <Link href="/(app)/attendance-scan" asChild>
                <Button title="Buka Pemindaian" />
              </Link>
            </View>

            <View className="flex-row flex-wrap gap-4 mb-4">
              <View className="flex-1 rounded-card bg-primary/10 p-4 shadow-card">
                <Text className="text-sm text-gray-700">Hadir</Text>
                <Text className="text-4xl font-extrabold text-primary">{presentCount}</Text>
                {viewingToday && summary && (
                  <Text className="text-xs text-gray-500 mt-1">Total tersinkron hari ini</Text>
                )}
              </View>

              <View className="flex-1 rounded-card bg-accent-red/10 p-4 shadow-card">
                <Text className="text-sm text-gray-700">Belum Tercatat</Text>
                <Text className="text-4xl font-extrabold text-accent-red">{absentCount ?? '—'}</Text>
                {viewingToday && summary && (
                  <Text className="text-xs text-gray-500 mt-1">Perlu verifikasi manual</Text>
                )}
              </View>

              <View className="flex-1 rounded-card bg-white p-4 shadow-card border border-gray-200">
                <Text className="text-sm text-gray-700">Total Siswa</Text>
                <Text className="text-3xl font-bold text-gray-900">{totalStudents ?? '—'}</Text>
                {summaryLoading ? (
                  <Text className="text-xs text-gray-500 mt-1">Memuat ringkasan…</Text>
                ) : summaryError ? (
                  <Text className="text-xs text-accent-red mt-1">{summaryError}</Text>
                ) : (
                  <Text className="text-xs text-gray-500 mt-1">Berdasarkan data siswa aktif</Text>
                )}
              </View>
            </View>

            {error && (
              <View className="mb-4 rounded-card bg-red-50 border border-accent-red p-4 shadow-card">
                <Text className="text-accent-red">{error}</Text>
              </View>
            )}

            {loading && (
              <View className="gap-3">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <Skeleton key={idx} height={96} rounded={18} />
                ))}
              </View>
            )}

            <View className="h-4" />
          </View>
        }
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32, backgroundColor: '#f5f7fb' }}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
