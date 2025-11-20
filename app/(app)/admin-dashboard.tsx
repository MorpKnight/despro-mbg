import { Ionicons } from '@expo/vector-icons';
import { Redirect, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import Grid from '../../components/layout/Grid';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import KPICard from '../../components/ui/KPICard';
import Skeleton from '../../components/ui/Skeleton';
import { StatusPill } from '../../components/ui/StatusPill';
import { useAuth } from '../../hooks/useAuth';
import { useResponsive } from '../../hooks/useResponsive';
import { fetchGlobalKpi, type GlobalKpi } from '../../services/analytics';
import { fetchHealthStatus, type HealthStatus } from '../../services/health';

const numberFormatter = new Intl.NumberFormat('id-ID');

export default function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const { isDesktop, isMobile } = useResponsive();
  const [globalKpi, setGlobalKpi] = useState<GlobalKpi | null>(null);
  const [kpiLoading, setKpiLoading] = useState(true);
  const [kpiError, setKpiError] = useState<string | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [healthError, setHealthError] = useState<string | null>(null);

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
