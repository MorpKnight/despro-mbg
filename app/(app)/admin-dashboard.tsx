import { Ionicons } from '@expo/vector-icons';
import { Redirect, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import KPICard from '../../components/ui/KPICard';
import { useAuth } from '../../hooks/useAuth';
import { fetchGlobalKpi, type GlobalKpi } from '../../services/analytics';
import { fetchHealthStatus, type HealthStatus } from '../../services/health';

const numberFormatter = new Intl.NumberFormat('id-ID');

export default function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();
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
      className="flex-1 bg-[#f5f7fb]"
      edges={["top", "bottom", "left", "right"]}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Page Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-900 mb-1">
            Dashboard Super Admin
          </Text>
          <Text className="text-gray-600">
            Selamat datang kembali, {user?.username}
          </Text>
        </View>

        {/* KPI Cards */}
        <View className="mb-6">
          <View className="flex-row flex-wrap justify-between gap-4">
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
          </View>
          {kpiError && (
            <Text className="text-sm text-accent-red mt-3">{kpiError}</Text>
          )}
        </View>

        {/* System Status Card */}
        <Card className="mb-6">
          <Text className="text-lg font-bold text-gray-900 mb-4">
            Status Sistem
          </Text>
          {healthLoading ? (
            <Text className="text-gray-600">Memeriksa status sistem…</Text>
          ) : healthError ? (
            <Text className="text-accent-red">{healthError}</Text>
          ) : (
            <>
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center flex-shrink">
                  <View className={`w-3 h-3 rounded-full ${apiOk ? 'bg-primary' : 'bg-accent-red'} mr-3`} />
                  <View>
                    <Text className="font-semibold text-gray-900">API Status</Text>
                    <Text className="text-sm text-gray-600">{apiOk ? 'Online dan responsif' : 'Gangguan terdeteksi'}</Text>
                  </View>
                </View>
                <Ionicons name={apiOk ? 'checkmark-circle' : 'alert-circle'} size={28} color={apiOk ? '#4CAF50' : '#E53935'} />
              </View>

              <View className="h-px bg-gray-200 mb-4" />

              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-shrink">
                  <View className={`w-3 h-3 rounded-full ${dbOk ? 'bg-primary' : 'bg-accent-red'} mr-3`} />
                  <View>
                    <Text className="font-semibold text-gray-900">Koneksi Basis Data</Text>
                    <Text className="text-sm text-gray-600">{dbOk ? 'Terhubung dan sehat' : 'Koneksi basis data bermasalah'}</Text>
                  </View>
                </View>
                <Ionicons name={dbOk ? 'checkmark-circle' : 'alert-circle'} size={28} color={dbOk ? '#4CAF50' : '#E53935'} />
              </View>
            </>
          )}
        </Card>

        {/* Quick Actions Card */}
        <Card>
          <Text className="text-lg font-bold text-gray-900 mb-4">
            Aksi Cepat
          </Text>
          <View className="gap-3">
            <Button
              title="Kelola Pengguna"
              variant="primary"
              onPress={() => router.push('/(app)/user-management')}
            />
            <Button
              title="Buka Laporan Lengkap"
              variant="secondary"
              onPress={() => router.push('/(app)/analytics')}
            />
            <Button
              title="Lihat Kesehatan Sistem"
              variant="secondary"
              onPress={() => router.push('/(app)/system-health')}
            />
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
