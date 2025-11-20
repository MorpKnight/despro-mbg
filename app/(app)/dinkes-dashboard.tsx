import { Ionicons } from '@expo/vector-icons';
import { Redirect, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { ChipGroup } from '../../components/ui/Chip';
import KPICard from '../../components/ui/KPICard';
import Skeleton from '../../components/ui/Skeleton';
import { StatusPill } from '../../components/ui/StatusPill';
import { useAuth } from '../../hooks/useAuth';
import {
    fetchDinkesKpi,
    fetchSatisfactionTrend,
    type DinkesKpi,
    type SatisfactionTrend,
} from '../../services/analytics';
import { fetchEmergencyReports, type EmergencyReport } from '../../services/emergency';

const integerFormatter = new Intl.NumberFormat('id-ID');
const decimalFormatter = new Intl.NumberFormat('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 2 });

function formatInteger(value?: number | null) {
  return typeof value === 'number' ? integerFormatter.format(value) : '—';
}

function formatDecimal(value?: number | null) {
  return typeof value === 'number' ? decimalFormatter.format(value) : '—';
}

export default function DinkesDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [kpi, setKpi] = useState<DinkesKpi | null>(null);
  const [reports, setReports] = useState<EmergencyReport[]>([]);
  const [trend, setTrend] = useState<SatisfactionTrend | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const areas = [
    { id: 'a1', name: 'Bogor Utara' },
    { id: 'a2', name: 'Bogor Selatan' },
    { id: 'a3', name: 'Bogor Timur' },
    { id: 'a4', name: 'Bogor Barat' },
    { id: 'a5', name: 'Bogor Tengah' },
  ];
  const [selectedArea, setSelectedArea] = useState(areas[0].id);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const [kpiRes, reportsRes, trendRes] = await Promise.allSettled([
        fetchDinkesKpi(),
        fetchEmergencyReports(),
        fetchSatisfactionTrend(),
      ]);

      if (!active) return;

      const failures: string[] = [];

      if (kpiRes.status === 'fulfilled') {
        setKpi(kpiRes.value as DinkesKpi);
      } else {
        setKpi(null);
        failures.push('KPI Dinkes');
        console.warn('[dinkes-dashboard] gagal memuat KPI', kpiRes.reason);
      }

      if (reportsRes.status === 'fulfilled') {
        setReports(reportsRes.value as EmergencyReport[]);
      } else {
        setReports([]);
        failures.push('laporan darurat');
        console.warn('[dinkes-dashboard] gagal memuat laporan', reportsRes.reason);
      }

      if (trendRes.status === 'fulfilled') {
        setTrend(trendRes.value as SatisfactionTrend);
      } else {
        setTrend(null);
        failures.push('tren kepuasan');
        console.warn('[dinkes-dashboard] gagal memuat tren', trendRes.reason);
      }

      setError(failures.length ? `Sebagian data gagal dimuat (${failures.join(', ')}).` : null);
      setLoading(false);
    })().catch((err) => {
      console.error('[dinkes-dashboard] fetch error', err);
      if (!active) return;
      setKpi(null);
      setReports([]);
      setTrend(null);
      setError('Terjadi kesalahan saat memuat data dashboard.');
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [selectedArea]);

  if (user?.role !== 'admin_dinkes' && user?.role !== 'super_admin') return <Redirect href="/" />;

  const openReports = useMemo(() => reports.filter((r) => r.status !== 'selesai'), [reports]);
  const waitingCount = useMemo(() => reports.filter((r) => r.status === 'menunggu').length, [reports]);
  const processingCount = useMemo(() => reports.filter((r) => r.status === 'proses').length, [reports]);
  const resolvedCount = useMemo(() => reports.filter((r) => r.status === 'selesai').length, [reports]);

  const topSchools = useMemo(() => {
    const summary = new Map<string, { name: string; address?: string | null; count: number }>();
    openReports.forEach((report) => {
      const key = report.schoolId ?? report.schoolName;
      const current = summary.get(key) ?? {
        name: report.schoolName,
        address: report.schoolAddress ?? null,
        count: 0,
      };
      current.count += 1;
      if (!current.address && report.schoolAddress) current.address = report.schoolAddress;
      summary.set(key, current);
    });
    return Array.from(summary.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }, [openReports]);

  const recentReports = useMemo(
    () => [...reports].sort((a, b) => +new Date(b.date) - +new Date(a.date)).slice(0, 3),
    [reports],
  );

  const trendPoints = trend?.data ?? [];
  const ratingDisplay = typeof kpi?.rata_rata_rating_global === 'number'
    ? `${formatDecimal(kpi.rata_rata_rating_global)} / 5`
    : '—';

  if (loading && !kpi && !trend && reports.length === 0) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#1976D2" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#f5f7fb]">
      <ScrollView className="flex-1 bg-neutral-gray">
        <View className="p-6">
          <View className="mb-6">
            <Text className="text-2xl font-bold text-gray-900 mb-1">Dashboard Dinas Kesehatan</Text>
            <Text className="text-gray-600">Monitoring kesehatan &amp; keamanan pangan sekolah</Text>
          </View>

          {/* Super Admin Selector */}
          {user?.role === 'super_admin' && (
            <View className="mb-6">
              <Text className="text-base font-semibold text-gray-800 mb-3">Pilih Wilayah</Text>
              <ChipGroup
                scrollable
                options={areas.map((area) => ({ label: area.name, value: area.id }))}
                value={selectedArea}
                onChange={(value) => setSelectedArea(value)}
              />
            </View>
          )}

          {error && (
            <Card className="mb-4 border border-accent-red bg-red-50">
              <Text className="text-accent-red">{error}</Text>
            </Card>
          )}

          <Card className="mb-6 border-2 border-accent-red bg-red-50">
            <View className="items-center py-6">
              <View className="w-20 h-20 rounded-full bg-accent-red items-center justify-center mb-4">
                <Ionicons name="warning" size={48} color="#FFFFFF" />
              </View>
              <Text className="text-sm text-gray-700 mb-2">Laporan darurat aktif</Text>
              <Text className="text-6xl font-extrabold text-accent-red mb-3">
                {loading && reports.length === 0 ? '…' : formatInteger(openReports.length)}
              </Text>
              <Text className="text-gray-800 font-semibold mb-1 text-center">
                {loading && reports.length === 0
                  ? 'Memuat detail kasus…'
                  : `${formatInteger(waitingCount)} menunggu • ${formatInteger(processingCount)} diproses`}
              </Text>
              <Text className="text-xs text-gray-700 text-center px-4">
                Tuntas minggu ini: {formatInteger(resolvedCount)} laporan
              </Text>
            </View>
          </Card>

          <View className="flex-row flex-wrap gap-4 mb-6">
            <KPICard
              icon="school"
              iconColor="#1976D2"
              title="Sekolah terpantau"
              value={loading && !kpi ? '…' : formatInteger(kpi?.total_sekolah_terpantau)}
              subtitle="Dalam pemantauan aktif"
            />
            <KPICard
              icon="people"
              iconColor="#4CAF50"
              title="Laporan diproses"
              value={loading && !kpi ? '…' : formatInteger(kpi?.total_laporan_diproses)}
              subtitle="30 hari terakhir"
            />
            <KPICard
              icon="happy"
              iconColor="#FBC02D"
              title="Rating global"
              value={loading && !kpi ? '…' : ratingDisplay}
              subtitle="Rata-rata kepuasan siswa"
            />
          </View>

          <Card className="mb-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-gray-900">Sekolah dengan Kasus Aktif</Text>
              <Button
                title="Lihat Semua"
                variant="outline"
                size="sm"
                onPress={() => router.push('/(app)/dinkes-emergency')}
              />
            </View>

            {loading && reports.length === 0 ? (
              <View className="gap-3">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <Skeleton key={idx} height={56} rounded={12} />
                ))}
              </View>
            ) : topSchools.length === 0 ? (
              <Text className="text-gray-600">Tidak ada sekolah dengan kasus aktif.</Text>
            ) : (
              <View className="gap-4">
                {topSchools.map((school, idx) => (
                  <View key={`${school.name}-${idx}`} className="flex-row items-center justify-between">
                    <View className="flex-1 pr-4">
                      <Text className="font-semibold text-gray-900">{school.name}</Text>
                      {school.address && <Text className="text-xs text-gray-600">{school.address}</Text>}
                    </View>
                    <View className="items-end">
                      <Text className="text-2xl font-bold text-accent-red">{formatInteger(school.count)}</Text>
                      <Text className="text-xs text-gray-600">laporan aktif</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </Card>

          <Card className="mb-6">
            <Text className="text-lg font-bold text-gray-900 mb-4">Laporan Terbaru</Text>
            {loading && reports.length === 0 ? (
              <View className="gap-3">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <Skeleton key={idx} height={64} rounded={12} />
                ))}
              </View>
            ) : recentReports.length === 0 ? (
              <Text className="text-gray-600">Belum ada laporan darurat yang tercatat.</Text>
            ) : (
              <View className="gap-3">
                {recentReports.map((report) => (
                  <View key={report.id} className="border-b border-gray-200 pb-3">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-sm text-gray-600">
                        {new Date(report.date).toLocaleString('id-ID')}
                      </Text>
                      <StatusPill
                        label={report.status === 'menunggu' ? 'Menunggu' : report.status === 'proses' ? 'Diproses' : 'Selesai'}
                        tone={report.status === 'selesai' ? 'success' : report.status === 'proses' ? 'warning' : 'danger'}
                      />
                    </View>
                    <Text className="text-sm font-semibold text-gray-900 mt-1">{report.schoolName}</Text>
                    <Text className="text-sm text-gray-800">{report.title}</Text>
                  </View>
                ))}
              </View>
            )}
          </Card>

          <Card>
            <Text className="text-lg font-bold text-gray-900 mb-4">Tren Kepuasan Siswa</Text>
            {loading && trendPoints.length === 0 ? (
              <Text className="text-gray-600">Memuat tren kepuasan…</Text>
            ) : trendPoints.length === 0 ? (
              <Text className="text-gray-500">Belum ada data tren kepuasan.</Text>
            ) : (
              <View className="gap-2">
                {trendPoints.slice(-6).map((point) => (
                  <View key={point.label} className="flex-row items-center justify-between border-b border-gray-100 pb-2">
                    <Text className="text-sm text-gray-600">{point.label}</Text>
                    <Text className="text-sm font-semibold text-gray-900">{formatDecimal(point.value)}</Text>
                  </View>
                ))}
              </View>
            )}
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}