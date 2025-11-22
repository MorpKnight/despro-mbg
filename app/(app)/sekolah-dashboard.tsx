import { Redirect, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Chip } from '../../components/ui/Chip';
import TextInput from '../../components/ui/TextInput';
import { useAuth } from '../../hooks/useAuth';
import { fetchAttendanceSummary, type AttendanceSummary } from '../../services/attendance';
import { fetchEmergencyReports, type EmergencyReport, type ReportStatus } from '../../services/emergency';
import { fetchFeedbackList, type FeedbackItem } from '../../services/feedback';
import { fetchSchools, type SchoolListItem } from '../../services/schools';

const ALL_LOCATIONS = 'ALL_LOCATIONS';
const SCHOOL_PAGE_SIZE = 6;

interface StatCardProps {
  icon: string;
  label: string;
  value: string;
  caption?: string;
  accentClass: string;
  borderClass: string;
}

function StatCard({ icon, label, value, caption, accentClass, borderClass }: StatCardProps) {
  return (
    <View className={`flex-1 min-w-[150px] rounded-2xl border ${borderClass} bg-white px-4 py-3`}>
      <View className="flex-row items-center gap-2 mb-2">
        <View className={`w-9 h-9 rounded-full items-center justify-center ${accentClass}`}>
          <Text className="text-lg">{icon}</Text>
        </View>
        <Text className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</Text>
      </View>
      <Text className="text-2xl font-bold text-gray-900 mb-1">{value}</Text>
      {caption ? <Text className="text-sm text-gray-500">{caption}</Text> : null}
    </View>
  );
}

function formatRelativeTime(dateInput: string | null | undefined): string {
  if (!dateInput) return '—';
  const value = new Date(dateInput);
  if (Number.isNaN(value.getTime())) return '—';
  const diffMs = Date.now() - value.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Baru saja';
  if (minutes < 60) return `${minutes} menit yang lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam yang lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari yang lalu`;
}

function ratingToEmoji(rating: number): string {
  if (rating >= 4.5) return '😍';
  if (rating >= 4) return '😊';
  if (rating >= 3) return '🙂';
  if (rating >= 2) return '😐';
  return '🙁';
}

function statusBadge(status: ReportStatus): { label: string; bubbleClass: string; textClass: string } {
  switch (status) {
    case 'selesai':
      return { label: 'Selesai', bubbleClass: 'bg-emerald-50 border-emerald-400', textClass: 'text-emerald-600' };
    case 'proses':
      return { label: 'Dalam Proses', bubbleClass: 'bg-amber-50 border-amber-400', textClass: 'text-amber-700' };
    default:
      return { label: 'Menunggu', bubbleClass: 'bg-rose-50 border-rose-300', textClass: 'text-rose-600' };
  }
}

export default function SekolahDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 900;

  const isSuperAdmin = user?.role === 'super_admin';
  const isSchoolAdmin = user?.role === 'admin_sekolah';

  const [schools, setSchools] = useState<SchoolListItem[]>([]);
  const [schoolsLoading, setSchoolsLoading] = useState(false);
  const [schoolsError, setSchoolsError] = useState<string | null>(null);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
  const [schoolSearchInput, setSchoolSearchInput] = useState('');
  const [debouncedSchoolSearch, setDebouncedSchoolSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState<string>(ALL_LOCATIONS);
  const [schoolPage, setSchoolPage] = useState(0);

  const [attendance, setAttendance] = useState<AttendanceSummary | null>(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);
  const [attendanceFetchedAt, setAttendanceFetchedAt] = useState<string | null>(null);

  const [reports, setReports] = useState<EmergencyReport[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  const adminSchoolFromProfile = useMemo<SchoolListItem | null>(() => {
    if (!isSchoolAdmin || !user?.sekolah) return null;
    return {
      id: user.schoolId ?? user.sekolah.id,
      name: user.sekolah.name ?? 'Sekolah Tanpa Nama',
      alamat: user.sekolah.alamat ?? undefined,
      provinsi: user.sekolah.provinsi ?? undefined,
      kotaKabupaten: user.sekolah.kotaKabupaten ?? undefined,
      kecamatan: user.sekolah.kecamatan ?? undefined,
      kelurahan: user.sekolah.kelurahan ?? undefined,
      contactPhone: user.sekolah.contactPhone ?? undefined,
    };
  }, [isSchoolAdmin, user?.schoolId, user?.sekolah]);

  const selectedSchoolMeta = useMemo<SchoolListItem | null>(() => {
    if (isSuperAdmin) {
      return schools.find((item) => item.id === selectedSchoolId) ?? null;
    }
    return adminSchoolFromProfile;
  }, [adminSchoolFromProfile, isSuperAdmin, schools, selectedSchoolId]);

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSchoolSearch(schoolSearchInput.trim());
    }, 350);
    return () => clearTimeout(handle);
  }, [schoolSearchInput]);

  useEffect(() => {
    if (!isSuperAdmin) return;
    let active = true;
    setSchoolsLoading(true);
    setSchoolsError(null);

    fetchSchools({ limit: 100, search: debouncedSchoolSearch || undefined })
      .then((list) => {
        if (!active) return;
        setSchools(list);
      })
      .catch((err) => {
        console.warn('[sekolah-dashboard] gagal memuat sekolah', err);
        if (!active) return;
        setSchoolsError('Tidak dapat memuat daftar sekolah.');
        setSchools([]);
      })
      .finally(() => {
        if (active) setSchoolsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [debouncedSchoolSearch, isSuperAdmin]);

  useEffect(() => {
    if (!isSchoolAdmin) return;
    setSelectedSchoolId((prev) => prev ?? (user?.schoolId ?? user?.sekolah?.id ?? null));
  }, [isSchoolAdmin, user?.schoolId, user?.sekolah?.id]);

  const shouldFetchData = useMemo(() => {
    if (isSuperAdmin) return Boolean(selectedSchoolId);
    if (isSchoolAdmin) return Boolean(user?.schoolId ?? user?.sekolah?.id);
    return false;
  }, [isSchoolAdmin, isSuperAdmin, selectedSchoolId, user?.schoolId, user?.sekolah?.id]);

  const locationOptions = useMemo(() => {
    const uniques = Array.from(
      new Set(
        schools
          .map((school) => (school.kotaKabupaten || school.provinsi || school.kecamatan || '')?.trim())
          .filter((value) => Boolean(value))
      )
    ) as string[];
    return uniques.sort((a, b) => a.localeCompare(b));
  }, [schools]);

  const filteredSchools = useMemo(() => {
    if (locationFilter === ALL_LOCATIONS) return schools;
    return schools.filter((school) => {
      const location = school.kotaKabupaten || school.provinsi || school.kecamatan || '';
      return location.trim() === locationFilter;
    });
  }, [locationFilter, schools]);

  useEffect(() => {
    if (!isSuperAdmin) return;
    if (filteredSchools.length === 0) {
      setSelectedSchoolId(null);
      setSchoolPage(0);
      return;
    }
    setSchoolPage(0);
    if (!selectedSchoolId || !filteredSchools.some((school) => school.id === selectedSchoolId)) {
      setSelectedSchoolId(filteredSchools[0].id);
    }
  }, [filteredSchools, isSuperAdmin, selectedSchoolId]);

  const totalSchoolPages = Math.ceil(filteredSchools.length / SCHOOL_PAGE_SIZE) || 0;
  const paginatedSchools = useMemo(() => {
    if (filteredSchools.length === 0) return [];
    const start = schoolPage * SCHOOL_PAGE_SIZE;
    return filteredSchools.slice(start, start + SCHOOL_PAGE_SIZE);
  }, [filteredSchools, schoolPage]);

  useEffect(() => {
    if (totalSchoolPages === 0) {
      setSchoolPage(0);
      return;
    }
    setSchoolPage((prev) => {
      if (prev >= totalSchoolPages) {
        return Math.max(totalSchoolPages - 1, 0);
      }
      return prev;
    });
  }, [totalSchoolPages]);

  useEffect(() => {
    if (!shouldFetchData) {
      setAttendance(null);
      setAttendanceFetchedAt(null);
      return;
    }
    let active = true;
    setAttendanceLoading(true);
    setAttendanceError(null);

    fetchAttendanceSummary({ schoolId: selectedSchoolId ?? undefined })
      .then((summary) => {
        if (!active) return;
        setAttendance(summary);
        setAttendanceFetchedAt(new Date().toISOString());
      })
      .catch((err) => {
        console.warn('[sekolah-dashboard] gagal memuat ringkasan presensi', err);
        if (!active) return;
        setAttendance(null);
        setAttendanceError('Tidak dapat memuat ringkasan presensi.');
      })
      .finally(() => {
        if (active) setAttendanceLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedSchoolId, shouldFetchData]);

  useEffect(() => {
    if (!shouldFetchData) {
      setReports([]);
      setFeedbackItems([]);
      return;
    }

    let active = true;
    setReportsLoading(true);
    setFeedbackLoading(true);
    setDataError(null);

    Promise.allSettled([
      fetchEmergencyReports({ schoolId: selectedSchoolId ?? undefined }),
      fetchFeedbackList({ schoolId: selectedSchoolId ?? undefined }),
    ])
      .then(([reportsResult, feedbackResult]) => {
        if (!active) return;
        if (reportsResult.status === 'fulfilled') {
          setReports(reportsResult.value);
        } else {
          console.warn('[sekolah-dashboard] gagal memuat laporan darurat', reportsResult.reason);
          setReports([]);
          setDataError('Sebagian data tidak dapat dimuat.');
        }

        if (feedbackResult.status === 'fulfilled') {
          setFeedbackItems(feedbackResult.value);
        } else {
          console.warn('[sekolah-dashboard] gagal memuat feedback', feedbackResult.reason);
          setFeedbackItems([]);
          setDataError('Sebagian data tidak dapat dimuat.');
        }
      })
      .finally(() => {
        if (!active) return;
        setReportsLoading(false);
        setFeedbackLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedSchoolId, shouldFetchData]);

  if (!isSuperAdmin && !isSchoolAdmin) {
    return <Redirect href="/" />;
  }

  if (isSchoolAdmin && !shouldFetchData) {
    return (
      <SafeAreaView className="flex-1 bg-[#f5f7fb]">
        <ScrollView className="flex-1 bg-neutral-gray">
          <View className="p-6">
            <View className="bg-white rounded-2xl p-6 shadow-sm">
              <Text className="text-lg font-semibold text-gray-900 mb-2">Profil belum lengkap</Text>
              <Text className="text-gray-600">
                Akun Anda belum terasosiasi dengan sekolah mana pun. Hubungi super admin untuk memperbarui profil.
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const attendancePresent = attendance?.presentToday ?? 0;
  const attendanceTotal = attendance?.totalStudents ?? 0;
  const attendanceRatio = attendance ? `${attendancePresent}/${attendanceTotal}` : '—';
  const attendanceStatus = attendance ? 'Online' : 'Tidak diketahui';
  const recentReports = reports.slice(0, 4);
  const recentFeedback = feedbackItems.slice(0, 4);
  const unresolvedReports = reports.filter((report) => report.status !== 'selesai').length;
  const attendancePercentage = attendance && attendanceTotal > 0 ? Math.round((attendancePresent / attendanceTotal) * 100) : null;
  const averageRating = feedbackItems.length > 0 ? (feedbackItems.reduce((total, current) => total + current.rating, 0) / feedbackItems.length) : null;
  const schoolAddress = selectedSchoolMeta?.alamat || [selectedSchoolMeta?.kelurahan, selectedSchoolMeta?.kecamatan, selectedSchoolMeta?.kotaKabupaten]
    .filter(Boolean)
    .join(', ');
  const schoolContact = selectedSchoolMeta?.contactPhone || '-';
  const locationDisplay = [selectedSchoolMeta?.kotaKabupaten, selectedSchoolMeta?.provinsi].filter(Boolean).join(', ');

  const quickStats: StatCardProps[] = [
    {
      icon: '👥',
      label: 'Kehadiran Hari Ini',
      value: attendancePercentage !== null ? `${attendancePercentage}%` : '—',
      caption: attendance ? `${attendancePresent} dari ${attendanceTotal} siswa` : 'Data belum tersedia',
      accentClass: 'bg-emerald-50',
      borderClass: 'border-emerald-100',
    },
    {
      icon: '🚨',
      label: 'Laporan Aktif',
      value: unresolvedReports ? `${unresolvedReports}` : '0',
      caption: reports.length ? `${reports.length} total laporan periode ini` : 'Belum ada laporan terkirim',
      accentClass: 'bg-rose-50',
      borderClass: 'border-rose-100',
    },
    {
      icon: '⭐',
      label: 'Rating Rata-rata',
      value: averageRating !== null ? averageRating.toFixed(1) : '—',
      caption: feedbackItems.length ? `${feedbackItems.length} umpan balik terbaru` : 'Belum ada feedback',
      accentClass: 'bg-amber-50',
      borderClass: 'border-amber-100',
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-[#f5f7fb]">
      <ScrollView className="flex-1 bg-neutral-gray">
        <View className="p-6">
          {/* Header */}
          <View className="mb-6">
            <Text className="text-2xl font-bold text-gray-900 mb-1">Dashboard Sekolah</Text>
            <Text className="text-gray-600">Ringkasan Aktivitas & Laporan</Text>
            {selectedSchoolMeta && (
              <Text className="text-sm text-gray-500 mt-1">
                {selectedSchoolMeta.name}
                {selectedSchoolMeta.kotaKabupaten ? ` • ${selectedSchoolMeta.kotaKabupaten}` : ''}
              </Text>
            )}
          </View>

          {selectedSchoolMeta && (
            <View className={`${isMobile ? 'flex-col space-y-3' : 'flex-row gap-3'} mb-6`}>
              <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-sm font-semibold text-gray-800 uppercase tracking-wide">Profil Sekolah</Text>
                  <Text className="text-xs text-gray-400">ID {selectedSchoolMeta.id.slice(0, 8)}</Text>
                </View>
                <View className="space-y-2">
                  <View>
                    <Text className="text-xs text-gray-500">Nama</Text>
                    <Text className="text-base font-semibold text-gray-900">{selectedSchoolMeta.name}</Text>
                  </View>
                  {schoolAddress ? (
                    <View>
                      <Text className="text-xs text-gray-500">Alamat</Text>
                      <Text className="text-sm text-gray-700">{schoolAddress}</Text>
                    </View>
                  ) : null}
                  {locationDisplay ? (
                    <View>
                      <Text className="text-xs text-gray-500">Lokasi</Text>
                      <Text className="text-sm text-gray-700">{locationDisplay}</Text>
                    </View>
                  ) : null}
                  <View>
                    <Text className="text-xs text-gray-500">Kontak</Text>
                    <Text className="text-sm text-gray-700">{schoolContact}</Text>
                  </View>
                </View>
              </View>
              <View className="flex-1 bg-blue-50 rounded-2xl p-4 shadow-sm">
                <Text className="text-sm font-semibold text-gray-800 mb-3">Ringkasan Singkat</Text>
                <View className={`${isMobile ? 'space-y-3' : 'flex-row gap-3'} flex-wrap`}>
                  {quickStats.map((stat) => (
                    <StatCard key={stat.label} {...stat} />
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* School Selector for Super Admin */}
          {isSuperAdmin && (
            <View className="mb-6">
              <Text className="text-base font-semibold text-gray-800 mb-3">Pilih Sekolah</Text>
              <View className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
                <View className="gap-2">
                  <Text className="text-xs font-semibold uppercase text-gray-500">Pencarian Sekolah</Text>
                  <TextInput
                    placeholder="Cari nama atau NPSN sekolah"
                    value={schoolSearchInput}
                    autoCorrect={false}
                    autoCapitalize="none"
                    onChangeText={setSchoolSearchInput}
                  />
                </View>

                {locationOptions.length > 0 && (
                  <View className="space-y-2">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-sm font-semibold text-gray-700">Filter Lokasi</Text>
                      <Pressable onPress={() => setLocationFilter(ALL_LOCATIONS)}>
                        <Text className="text-xs font-semibold text-primary">Reset</Text>
                      </Pressable>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                      {[{ label: 'Semua lokasi', value: ALL_LOCATIONS }, ...locationOptions.map((city) => ({ label: city, value: city }))].map((option) => (
                        <Chip
                          key={option.value}
                          label={option.label}
                          active={option.value === locationFilter}
                          onPress={() => setLocationFilter(option.value)}
                          className="mr-2 mb-2"
                        />
                      ))}
                    </ScrollView>
                  </View>
                )}

                <View className="gap-3">
                  <Text className="text-sm font-semibold text-gray-700">Daftar Sekolah</Text>
                  {schoolsLoading ? (
                    <View className="py-2 items-center">
                      <ActivityIndicator color="#2563EB" />
                    </View>
                  ) : schoolsError ? (
                    <Text className="text-sm text-red-600">{schoolsError}</Text>
                  ) : filteredSchools.length === 0 ? (
                    <Text className="text-sm text-gray-500">
                      Tidak ada sekolah yang cocok dengan kata kunci atau lokasi yang dipilih.
                    </Text>
                  ) : (
                    <View className="space-y-2">
                      {paginatedSchools.map((school) => (
                        <Pressable
                          key={school.id}
                          onPress={() => setSelectedSchoolId(school.id)}
                          className={`rounded-xl border px-4 py-3 ${
                            school.id === selectedSchoolId ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50'
                          }`}
                        >
                          <Text className="text-base font-semibold text-gray-800">{school.name}</Text>
                          <Text className="text-xs text-gray-500">
                            {school.kotaKabupaten || school.provinsi || 'Lokasi tidak tersedia'}
                          </Text>
                        </Pressable>
                      ))}
                      {filteredSchools.length > SCHOOL_PAGE_SIZE && (
                        <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
                          <Text className="text-xs text-gray-500">
                            Menampilkan {filteredSchools.length === 0 ? 0 : schoolPage * SCHOOL_PAGE_SIZE + 1}–
                            {Math.min((schoolPage + 1) * SCHOOL_PAGE_SIZE, filteredSchools.length)} dari {filteredSchools.length}
                          </Text>
                          <View className="flex-row gap-2">
                            <Pressable
                              disabled={schoolPage === 0}
                              onPress={() => setSchoolPage((prev) => Math.max(prev - 1, 0))}
                              className={`px-3 py-2 rounded-lg border ${schoolPage === 0 ? 'border-gray-200 bg-gray-100' : 'border-gray-300 bg-white'}`}
                            >
                              <Text className={`text-sm font-semibold ${schoolPage === 0 ? 'text-gray-400' : 'text-gray-700'}`}>Prev</Text>
                            </Pressable>
                            <Pressable
                              disabled={schoolPage >= totalSchoolPages - 1}
                              onPress={() => setSchoolPage((prev) => Math.min(prev + 1, totalSchoolPages - 1))}
                              className={`px-3 py-2 rounded-lg border ${
                                schoolPage >= totalSchoolPages - 1 ? 'border-gray-200 bg-gray-100' : 'border-gray-300 bg-white'
                              }`}
                            >
                              <Text
                                className={`text-sm font-semibold ${
                                  schoolPage >= totalSchoolPages - 1 ? 'text-gray-400' : 'text-gray-700'
                                }`}
                              >
                                Next
                              </Text>
                            </Pressable>
                          </View>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* Emergency report banner */}
          <View className="bg-white rounded-2xl p-6 shadow-sm mb-4">
            <View className="items-center mb-4">
              <View className="w-12 h-12 rounded-full border-2 border-blue-600 bg-blue-50 items-center justify-center mb-2">
                <Text className="text-blue-600 font-bold text-xl">!</Text>
              </View>
              <Text className="text-lg font-bold text-[#333]">Pelaporan Darurat</Text>
              <Text className="text-sm text-gray-600 text-center">
                {unresolvedReports > 0
                  ? `${unresolvedReports} laporan menunggu tindak lanjut`
                  : 'Segera laporkan keadaan darurat yang membutuhkan tindak lanjut'}
              </Text>
            </View>
            <Pressable
              onPress={() => router.push('/(app)/emergency-report')}
              className="bg-blue-600 py-3 px-5 rounded-lg self-center active:opacity-90"
            >
              <Text className="text-white font-semibold text-sm">BUAT LAPORAN DARURAT</Text>
            </Pressable>
          </View>

          {/* Attendance + Announcements */}
          <View className={`${isMobile ? 'flex-col' : 'flex-row'} gap-3`}>
            {/* Attendance card */}
            <View className="flex-1 bg-white rounded-2xl p-6 shadow-sm mb-3">
              <View className="flex-row items-center mb-3">
                <View className="w-9 h-9 rounded-full bg-emerald-50 items-center justify-center mr-2">
                  <Text className="text-emerald-500 text-lg">👥</Text>
                </View>
                <Text className="text-base font-semibold text-[#333]">Kehadiran Hari Ini</Text>
              </View>
              {attendanceLoading ? (
                <View className="py-4 items-center">
                  <ActivityIndicator color="#059669" />
                </View>
              ) : (
                <>
                  <View className="items-center mb-3">
                    <Text className="text-3xl font-bold text-[#333]">{attendanceRatio}</Text>
                    <Text className="text-sm text-gray-500">Siswa menerima MBG</Text>
                  </View>
                  <View className="h-px bg-gray-200 mb-3" />
                  <View className="space-y-2">
                    <View className="flex-row justify-between">
                      <Text className="text-sm text-gray-500">Status Perangkat:</Text>
                      <View className="flex-row items-center">
                        <View
                          className={`w-2 h-2 rounded-full ${
                            attendanceStatus === 'Online' ? 'bg-emerald-500' : 'bg-gray-400'
                          } mr-1`}
                        />
                        <Text className="text-sm text-[#333]">{attendanceStatus}</Text>
                      </View>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-sm text-gray-500">Pembaruan Terakhir:</Text>
                      <Text className="text-sm text-[#333]">
                        {attendanceFetchedAt ? formatRelativeTime(attendanceFetchedAt) : '—'}
                      </Text>
                    </View>
                  </View>
                </>
              )}
              {attendanceError && <Text className="text-xs text-red-600 mt-3">{attendanceError}</Text>}
              <View className="flex-row justify-end mt-4">
                <Text className="text-primary font-semibold" onPress={() => router.push('/(app)/student-attendance')}>
                  Lihat Detail
                </Text>
              </View>
            </View>

            {/* Emergency / Announcements */}
            <View className="flex-1 bg-white rounded-2xl p-6 shadow-sm mb-3">
              <View className="flex-row items-center mb-3">
                <View className="w-9 h-9 rounded-full bg-blue-50 items-center justify-center mr-2">
                  <Text className="text-blue-600 text-lg">📣</Text>
                </View>
                <Text className="text-base font-semibold text-[#333]">Laporan Darurat Terbaru</Text>
              </View>
              {reportsLoading ? (
                <View className="py-4 items-center">
                  <ActivityIndicator color="#2563EB" />
                </View>
              ) : recentReports.length === 0 ? (
                <Text className="text-gray-500">Belum ada laporan darurat baru.</Text>
              ) : (
                recentReports.map((report) => {
                  const badge = statusBadge(report.status);
                  return (
                    <View key={report.id} className="flex-row mb-4">
                      <View className={`w-7 h-7 rounded-full border ${badge.bubbleClass} items-center justify-center mr-2`}>
                        <Text className={`text-xs font-semibold ${badge.textClass}`}>{report.status.slice(0, 1).toUpperCase()}</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm font-semibold text-[#333]">{report.title}</Text>
                        {report.description ? (
                          <Text className="text-sm text-gray-600">{report.description}</Text>
                        ) : null}
                        <Text className="text-xs text-gray-500 mt-1">
                          {report.reportedBy ?? 'Admin Sekolah'} · {formatRelativeTime(report.date)}
                        </Text>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </View>

          {/* Feedback section */}
          <View className="bg-white rounded-2xl p-6 shadow-sm mt-3">
            <View className="flex-row items-center mb-3">
              <View className="w-9 h-9 rounded-full bg-yellow-50 items-center justify-center mr-2">
                <Text className="text-yellow-500 text-lg">💬</Text>
              </View>
              <Text className="text-base font-semibold text-[#333]">Umpan Balik Terbaru</Text>
            </View>
            {feedbackLoading ? (
              <View className="py-4 items-center">
                <ActivityIndicator color="#F97316" />
              </View>
            ) : recentFeedback.length === 0 ? (
              <Text className="text-gray-500">Belum ada umpan balik terbaru.</Text>
            ) : (
              recentFeedback.map((feedback) => (
                <View key={feedback.id} className="flex-row items-start mb-4 pb-4 border-b border-gray-100">
                  <Text className="text-2xl mr-3">{ratingToEmoji(feedback.rating)}</Text>
                  <View className="flex-1">
                    <Text className="font-semibold text-gray-900 mb-1">
                      {feedback.student.fullName ?? feedback.student.username}
                    </Text>
                    {feedback.comment ? (
                      <Text className="text-gray-600">{feedback.comment}</Text>
                    ) : (
                      <Text className="text-gray-500 italic">Tidak ada catatan tambahan.</Text>
                    )}
                    <Text className="text-xs text-gray-500 mt-1">{formatRelativeTime(feedback.createdAt)}</Text>
                  </View>
                </View>
              ))
            )}
            {dataError && <Text className="text-xs text-red-600 mt-2">{dataError}</Text>}
            <View className="flex-row justify-end mt-3">
              <Text className="text-primary font-semibold" onPress={() => router.push('/(app)/feedback-list')}>
                Lihat Semua
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
