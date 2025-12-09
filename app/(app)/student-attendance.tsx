import { Ionicons } from '@expo/vector-icons';
import { FlashList, type ListRenderItemInfo } from '@shopify/flash-list';
import { Link, Redirect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Skeleton from '../../components/ui/Skeleton';
import TextInput from '../../components/ui/TextInput';
import PageHeader from '../../components/ui/PageHeader';
import { useAuth } from '../../hooks/useAuth';
import {
  fetchAttendanceList,
  fetchAttendanceSummary,
  type AttendanceRecord,
  type AttendanceSummary,
} from '../../services/attendance';
import { SchoolListItem, fetchSchools } from '../../services/schools';

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
  const { returnTo } = useLocalSearchParams<{ returnTo: string }>();
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

  // Super Admin specific state
  const [schools, setSchools] = useState<SchoolListItem[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<SchoolListItem | null>(null);
  const [schoolModalVisible, setSchoolModalVisible] = useState(false);
  const [schoolSearchQuery, setSchoolSearchQuery] = useState('');

  const isoDate = useMemo(() => formatIsoDate(selectedDate), [selectedDate]);
  const viewingToday = useMemo(() => isSameCalendarDay(selectedDate, new Date()), [selectedDate]);

  // Load schools for Super Admin
  useEffect(() => {
    if (isSuperAdmin) {
      fetchSchools({ limit: 100 }).then((data) => {
        setSchools(data);
        if (data.length > 0 && !selectedSchool) {
          setSelectedSchool(data[0]);
        }
      }).catch(err => console.warn('Failed to load schools', err));
    }
  }, [isSuperAdmin]);

  const filteredSchools = useMemo(() => {
    if (!schoolSearchQuery) return schools;
    return schools.filter(s => s.name.toLowerCase().includes(schoolSearchQuery.toLowerCase()));
  }, [schools, schoolSearchQuery]);

  const effectiveSchoolId = isSuperAdmin ? selectedSchool?.id : undefined;
  const canLoadData = isAdminSekolah || (isSuperAdmin && effectiveSchoolId);

  useEffect(() => {
    if (!canLoadData) {
      setLoading(false);
      setRecords([]);
      setSummary(null);
      setSummaryLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setSummaryLoading(true);
    setError(null);
    setSummaryError(null);

    Promise.all([
      fetchAttendanceList({ date: isoDate, limit: 500, schoolId: effectiveSchoolId }),
      fetchAttendanceSummary({ schoolId: effectiveSchoolId })
    ])
      .then(([list, summaryData]) => {
        if (!active) return;
        setRecords(list);
        setSummary(summaryData);
      })
      .catch((err) => {
        console.warn('[attendance] gagal memuat data', err);
        if (!active) return;
        setError('Gagal memuat data absensi.');
        setSummaryError('Ringkasan tidak tersedia.');
      })
      .finally(() => {
        if (active) {
          setLoading(false);
          setSummaryLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [isoDate, canLoadData, effectiveSchoolId]);

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
    if (!canLoadData) return;
    setRefreshing(true);
    setError(null);
    try {
      const [list, summaryData] = await Promise.all([
        fetchAttendanceList({ date: isoDate, limit: 500, schoolId: effectiveSchoolId }),
        fetchAttendanceSummary({ schoolId: effectiveSchoolId })
      ]);
      setRecords(list);
      setSummary(summaryData);
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
        <Card className="mb-3">
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
    if (isSuperAdmin && !selectedSchool) {
      return (
        <View className="items-center justify-center py-12">
          <Ionicons name="school-outline" size={40} color="#9CA3AF" />
          <Text className="text-gray-500 mt-2 text-center">
            Silakan pilih sekolah terlebih dahulu untuk melihat data absensi.
          </Text>
          <Button
            title="Pilih Sekolah"
            onPress={() => setSchoolModalVisible(true)}
            className="mt-4"
            size="sm"
          />
        </View>
      );
    }
    return (
      <View className="items-center justify-center py-12">
        <Ionicons name="calendar-outline" size={40} color="#9CA3AF" />
        <Text className="text-gray-500 mt-2 text-center">
          Belum ada catatan kehadiran untuk tanggal ini.
        </Text>
      </View>
    );
  }, [loading, isSuperAdmin, selectedSchool]);

  if (user?.role !== 'admin_sekolah' && user?.role !== 'super_admin') {
    return <Redirect href="/" />;
  }

  return (
    <SafeAreaView className="flex-1 bg-[#f5f7fb]">
      <PageHeader
        title="Absensi Harian"
        subtitle="Daftar kehadiran harian siswa"
        showBackButton={false}
        onRefresh={handleRefresh}
        isRefreshing={refreshing}
        className="mx-6 mt-6 mb-4"
      />

      <FlashList
        data={listData}
        renderItem={renderAttendanceItem}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyComponent}
        ListHeaderComponent={
          <>
            <View className="mb-4">
              {isSuperAdmin && (
                <TouchableOpacity
                  onPress={() => setSchoolModalVisible(true)}
                  className="flex-row items-center mb-4 bg-white px-3 py-2 rounded-lg border border-gray-200 self-start"
                >
                  <Ionicons name="school" size={16} color="#4B5563" />
                  <Text className="ml-2 text-gray-700 font-medium">
                    {selectedSchool ? selectedSchool.name : 'Pilih Sekolah'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#9CA3AF" className="ml-2" />
                </TouchableOpacity>
              )}
              <Text className="text-sm text-gray-600 mb-2">
                Data absensi otomatis tersinkron setiap kali siswa melakukan tap NFC, scan QR, atau pencatatan manual.
              </Text>
            </View>

            <View className="mb-6 flex-row items-center justify-between bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-full items-center justify-center bg-blue-50">
                  <Ionicons name="calendar" size={20} color="#2563EB" />
                </View>
                <View>
                  <Text className="text-xs text-gray-500">Tanggal</Text>
                  <Text className="text-gray-900 font-bold">{formatDateLabel(selectedDate)}</Text>
                </View>
              </View>
              <View className="flex-row items-center gap-1">
                <TouchableOpacity onPress={goToPreviousDay} className="p-2 bg-gray-50 rounded-full">
                  <Ionicons name="chevron-back" size={20} color="#374151" />
                </TouchableOpacity>
                <TouchableOpacity onPress={goToNextDay} className="p-2 bg-gray-50 rounded-full">
                  <Ionicons name="chevron-forward" size={20} color="#374151" />
                </TouchableOpacity>
              </View>
            </View>

            {isAdminSekolah && (
              <View className="mb-6">
                <Link href={{ pathname: "/(app)/attendance-scan", params: { returnTo: '/(app)/student-attendance' } }} asChild>
                  <Button title="Buka Pemindaian QR" />
                </Link>
              </View>
            )}

            <View className="flex-row flex-wrap gap-4 mb-6">
              <View className="flex-1 rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
                <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Hadir</Text>
                <Text className="text-4xl font-extrabold text-emerald-600">{presentCount}</Text>
                {viewingToday && summary && (
                  <Text className="text-xs text-gray-400 mt-1">Tersinkron hari ini</Text>
                )}
              </View>

              <View className="flex-1 rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
                <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total Siswa</Text>
                <Text className="text-3xl font-bold text-gray-900">{totalStudents ?? '—'}</Text>
                <Text className="text-sm font-semibold text-red-500 mt-2">
                  {absentCount !== null ? `${absentCount} Belum` : ''}
                </Text>
              </View>
            </View>

            {error && (
              <View className="mb-4 rounded-xl bg-red-50 border border-red-100 p-4">
                <Text className="text-red-600">{error}</Text>
              </View>
            )}

            {loading && (
              <View className="gap-3 mb-4">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <Skeleton key={idx} height={80} rounded={16} />
                ))}
              </View>
            )}
          </>
        }
      />

      <Modal visible={schoolModalVisible} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6 h-[70%]">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-gray-900">Pilih Sekolah</Text>
              <TouchableOpacity onPress={() => setSchoolModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <TextInput
              placeholder="Cari sekolah..."
              value={schoolSearchQuery}
              onChangeText={setSchoolSearchQuery}
              className="mb-4"
            />

            <ScrollView>
              {filteredSchools.map((school) => (
                <TouchableOpacity
                  key={school.id}
                  onPress={() => {
                    setSelectedSchool(school);
                    setSchoolModalVisible(false);
                  }}
                  className={`py-3 border-b border-gray-100 flex-row justify-between items-center ${selectedSchool?.id === school.id ? 'bg-blue-50 px-2 -mx-2 rounded-lg' : ''
                    }`}
                >
                  <Text className={`text-base ${selectedSchool?.id === school.id ? 'text-blue-700 font-semibold' : 'text-gray-900'}`}>
                    {school.name}
                  </Text>
                  {selectedSchool?.id === school.id && (
                    <Ionicons name="checkmark" size={20} color="#1976D2" />
                  )}
                </TouchableOpacity>
              ))}
              {filteredSchools.length === 0 && (
                <Text className="text-center text-gray-500 py-8">Tidak ada sekolah ditemukan.</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
