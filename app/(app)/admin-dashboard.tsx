import { Ionicons } from '@expo/vector-icons';
import { Redirect, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Grid from '../../components/layout/Grid';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import KPICard from '../../components/ui/KPICard';
import Skeleton from '../../components/ui/Skeleton';
import { StatusPill } from '../../components/ui/StatusPill';
import TextInput from '../../components/ui/TextInput';
import { useAuth } from '../../hooks/useAuth';
import { useResponsive } from '../../hooks/useResponsive';
import { fetchGlobalKpi, type GlobalKpi } from '../../services/analytics';
import { fetchCaterings, type CateringListItem } from '../../services/caterings';
import { fetchHealthStatus, type HealthStatus } from '../../services/health';
import { fetchSchools, type SchoolListItem } from '../../services/schools';
import { fetchUsers, type User } from '../../services/users';

const numberFormatter = new Intl.NumberFormat('id-ID');
type IconName = React.ComponentProps<typeof Ionicons>['name'];

const ENTITY_OPTIONS = [
  { label: 'Sekolah', value: 'school', icon: 'school' as IconName },
  { label: 'Katering', value: 'catering', icon: 'restaurant' as IconName },
  { label: 'Dinkes', value: 'dinkes', icon: 'medkit' as IconName },
] as const;

type EntityFilter = (typeof ENTITY_OPTIONS)[number]['value'];

interface SearchResultItem {
  id: string;
  title: string;
  subtitle?: string;
  badge: string;
  icon: IconName;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const { isMobile } = useResponsive();
  const [globalKpi, setGlobalKpi] = useState<GlobalKpi | null>(null);
  const [kpiLoading, setKpiLoading] = useState(true);
  const [kpiError, setKpiError] = useState<string | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [entityFilter, setEntityFilter] = useState<EntityFilter>('school');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const [kpiResult, healthResult] = await Promise.allSettled([
        fetchGlobalKpi(),
        fetchHealthStatus(),
      ]);

      if (!active) return;

      if (kpiResult.status === 'fulfilled') {
        setGlobalKpi(kpiResult.value);
        setKpiError(null);
      } else {
        console.warn('[admin-dashboard] global KPI error', kpiResult.reason);
        setKpiError('Gagal memuat ringkasan KPI.');
      }
      setKpiLoading(false);

      if (healthResult.status === 'fulfilled') {
        setHealth(healthResult.value);
        setHealthError(null);
      } else {
        console.warn('[admin-dashboard] health status error', healthResult.reason);
        setHealthError('Status sistem tidak tersedia.');
      }
      setHealthLoading(false);
    })().catch((err) => {
      console.error('[admin-dashboard] init failed', err);
      if (!active) return;
      setKpiError('Terjadi kesalahan saat memuat data.');
      setHealthError('Terjadi kesalahan saat memuat status sistem.');
      setKpiLoading(false);
      setHealthLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 350);
    return () => clearTimeout(handle);
  }, [searchInput]);

  useEffect(() => {
    if (debouncedSearch.length < 2) {
      setSearchResults([]);
      setSearchError(null);
      setSearchLoading(false);
      return;
    }

    let active = true;
    setSearchLoading(true);
    setSearchError(null);

    (async () => {
      try {
        let results: SearchResultItem[] = [];
        if (entityFilter === 'school') {
          const data = await fetchSchools({ limit: 20, search: debouncedSearch });
          results = data.map((school: SchoolListItem) => ({
            id: school.id,
            title: school.name,
            subtitle: school.kotaKabupaten || school.provinsi || school.alamat || undefined,
            badge: 'Sekolah',
            icon: 'school',
          }));
        } else if (entityFilter === 'catering') {
          const data = await fetchCaterings({ limit: 20, search: debouncedSearch });
          results = data.map((catering: CateringListItem) => ({
            id: catering.id,
            title: catering.name,
            subtitle: catering.kotaKabupaten || catering.provinsi || catering.alamat || undefined,
            badge: 'Katering',
            icon: 'restaurant',
          }));
        } else {
          const users = await fetchUsers({ limit: 20, role: 'admin_dinkes', search: debouncedSearch });
          results = users.map((admin: User) => ({
            id: admin.id,
            title: admin.fullName || admin.username,
            subtitle: admin.healthOfficeArea || 'Wilayah belum ditentukan',
            badge: 'Dinkes',
            icon: 'medkit',
          }));
        }

        if (!active) return;
        setSearchResults(results);
        setSearchError(null);
      } catch (err) {
        console.error('[admin-dashboard] entity search failed', err);
        if (!active) return;
        setSearchError('Gagal memuat data hasil pencarian. Coba lagi.');
        setSearchResults([]);
      } finally {
        if (active) {
          setSearchLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [entityFilter, debouncedSearch]);

  const formatNumber = (value?: number | null) =>
    typeof value === 'number' ? numberFormatter.format(value) : '—';

  const apiOk = health?.status === 'ok';
  const dbOk = health?.db_status === 'connected';

  if (user?.role !== 'super_admin') return <Redirect href="/" />;

  return (
    <SafeAreaView
      className="flex-1 bg-gray-50"
      edges={["top", "bottom", "left", "right"]}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: isMobile ? 16 : 32, paddingBottom: isMobile ? 24 : 48 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Page Header */}
        <View className={isMobile ? "mb-6" : "mb-8"}>
          <Text className={`${isMobile ? 'text-3xl' : 'text-4xl'} font-bold text-gray-900 mb-2`}>
            Dashboard Super Admin
          </Text>
          <Text className={`${isMobile ? 'text-base' : 'text-lg'} text-gray-600`}>
            Selamat datang kembali, {user?.username}
          </Text>
        </View>

        {/* KPI Cards */}
        <View className={isMobile ? "mb-6" : "mb-8"}>
          <Grid mobileColumns={1} tabletColumns={2} desktopColumns={2} gap={isMobile ? 3 : 4}>
            <KPICard
              icon="school"
              iconColor="#1976D2"
              title="Sekolah Terdaftar"
              value={kpiLoading ? '…' : formatNumber(globalKpi?.total_sekolah)}
              subtitle="Dalam jaringan MBG"
            />
            <KPICard
              icon="restaurant"
              iconColor="#F97316"
              title="Mitra Katering"
              value={kpiLoading ? '…' : formatNumber(globalKpi?.total_katering)}
              subtitle="Tersertifikasi program"
            />
            <KPICard
              icon="people"
              iconColor="#4CAF50"
              title="Siswa Terlayani"
              value={kpiLoading ? '…' : formatNumber(globalKpi?.total_siswa)}
              subtitle="Data siswa aktif"
            />
            <KPICard
              icon="warning"
              iconColor="#E53935"
              title="Darurat Aktif"
              value={kpiLoading ? '…' : formatNumber(globalKpi?.total_laporan_darurat_aktif)}
              subtitle="Perlu tindak lanjut"
            />
          </Grid>
          {kpiError && (
            <Text className="text-sm text-red-600 mt-4 px-2">{kpiError}</Text>
          )}
        </View>

        {/* System Status Card */}
        <Card variant="elevated" className={isMobile ? "mb-6" : "mb-8"}>
          <Text className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-900 mb-6`}>
            Status Sistem
          </Text>
          {healthLoading ? (
            <View className="gap-3">
              <Skeleton height={32} rounded={12} />
              <Skeleton height={32} rounded={12} />
            </View>
          ) : healthError ? (
            <Text className="text-red-600 text-base">{healthError}</Text>
          ) : (
            <>
              <View className={`flex-row items-center justify-between ${isMobile ? 'mb-5' : 'mb-6'}`}>
                <View className="flex-1 pr-4">
                  <Text className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-gray-900`}>API Status</Text>
                  <Text className="text-sm text-gray-700 mt-0.5">{apiOk ? 'Online dan responsif' : 'Gangguan terdeteksi'}</Text>
                </View>
                <StatusPill
                  label={apiOk ? 'Online' : 'Gangguan'}
                  tone={apiOk ? 'success' : 'danger'}
                />
              </View>

              <View className="h-px bg-gray-200 my-5" />

              <View className="flex-row items-center justify-between">
                <View className="flex-1 pr-4">
                  <Text className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-gray-900`}>Koneksi Basis Data</Text>
                  <Text className="text-sm text-gray-700 mt-0.5">{dbOk ? 'Terhubung dan sehat' : 'Koneksi basis data bermasalah'}</Text>
                </View>
                <StatusPill
                  label={dbOk ? 'Terhubung' : 'Gangguan'}
                  tone={dbOk ? 'info' : 'danger'}
                />
              </View>
            </>
          )}
        </Card>

        {/* Entity Search */}
        <Card variant="elevated" className={isMobile ? 'mb-6' : 'mb-8'}>
          <Text className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-900 mb-2`}>
            Cari Sekolah, Katering, atau Dinkes
          </Text>
          <Text className="text-sm text-gray-600 mb-4">
            Filter cepat berdasarkan nama untuk mempercepat navigasi.
          </Text>
          <TextInput
            value={searchInput}
            onChangeText={setSearchInput}
            placeholder="Cari minimal 2 karakter..."
            autoCorrect={false}
            autoCapitalize="none"
          />
          <View className="flex-row flex-wrap gap-2 mt-4">
            {ENTITY_OPTIONS.map((option) => {
              const isActive = entityFilter === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => setEntityFilter(option.value)}
                  className={`px-4 py-2 rounded-full border ${
                    isActive ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-200'
                  }`}
                >
                  <Text className={`text-xs font-semibold ${isActive ? 'text-white' : 'text-gray-700'}`}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View className="mt-4">
            {debouncedSearch.length < 2 ? (
              <Text className="text-sm text-gray-500">
                Masukkan minimal 2 karakter untuk mulai mencari.
              </Text>
            ) : searchLoading ? (
              <View className="gap-3">
                <Skeleton height={56} rounded={14} />
                <Skeleton height={56} rounded={14} />
              </View>
            ) : searchError ? (
              <Text className="text-sm text-red-600">{searchError}</Text>
            ) : searchResults.length === 0 ? (
              <Text className="text-sm text-gray-500">
                Tidak ada hasil untuk “{debouncedSearch}”.
              </Text>
            ) : (
              searchResults.map((result) => (
                <View
                  key={result.id}
                  className="py-3 border-b border-gray-100 last:border-b-0 flex-row items-center"
                >
                  <View className="w-10 h-10 rounded-full bg-blue-50 items-center justify-center mr-3">
                    <Ionicons name={result.icon} size={20} color="#2563EB" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-gray-900">{result.title}</Text>
                    {result.subtitle ? (
                      <Text className="text-xs text-gray-600 mt-0.5">{result.subtitle}</Text>
                    ) : null}
                  </View>
                  <StatusPill label={result.badge} tone="info" />
                </View>
              ))
            )}
          </View>
        </Card>

        {/* Quick Actions Card */}
        <Card variant="elevated">
          <Text className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-900 mb-6`}>
            Aksi Cepat
          </Text>
          <View className="gap-4">
            <Button
              title="Kelola Pengguna"
              variant="primary"
              icon={<Ionicons name="people" size={20} color="white" />}
              fullWidth
              onPress={() => router.push('/(app)/user-management')}
            />
            <Button
              title="Buka Laporan Lengkap"
              variant="outline"
              icon={<Ionicons name="analytics" size={20} color="#1976D2" />}
              fullWidth
              onPress={() => router.push('/(app)/analytics')}
            />
            <Button
              title="Lihat Kesehatan Sistem"
              variant="ghost"
              icon={<Ionicons name="fitness" size={20} color="#1976D2" />}
              fullWidth
              onPress={() => router.push('/(app)/system-health')}
            />
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
