import { Ionicons } from '@expo/vector-icons';
import { Redirect } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import Card from '../../components/ui/Card';
import KPICard from '../../components/ui/KPICard';
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
  const [kpi, setKpi] = useState<DinkesKpi | null>(null);
  const [reports, setReports] = useState<EmergencyReport[]>([]);
  const [trend, setTrend] = useState<SatisfactionTrend | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
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
  }, []);

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

  return (
    <SafeAreaView className="flex-1 bg-[#f5f7fb]">
      <ScrollView className="flex-1 bg-neutral-gray">
        <View className="p-6">
          <View className="mb-6">
            <Text className="text-2xl font-bold text-gray-900 mb-1">Dashboard Dinas Kesehatan</Text>
            <Text className="text-gray-600">Monitoring kesehatan &amp; keamanan pangan sekolah</Text>
          </View>

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
              <Text className="text-sm text-gray-600 mb-2">Laporan darurat aktif</Text>
              <Text className="text-6xl font-extrabold text-accent-red mb-3">
                {loading && reports.length === 0 ? '…' : formatInteger(openReports.length)}
              </Text>
              <Text className="text-gray-700 font-semibold mb-1">
                {loading && reports.length === 0
                  ? 'Memuat detail kasus…'
                  : `${formatInteger(waitingCount)} menunggu • ${formatInteger(processingCount)} diproses`}
              </Text>
              <Text className="text-xs text-gray-600 text-center px-4">
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
            <Text className="text-lg font-bold text-gray-900 mb-4">Sekolah dengan Kasus Aktif Terbanyak</Text>
            {loading && reports.length === 0 ? (
              <Text className="text-gray-600">Memuat data sekolah…</Text>
            ) : topSchools.length === 0 ? (
              <Text className="text-gray-500">Tidak ada sekolah dengan kasus aktif.</Text>
            ) : (
              <View className="gap-4">
                {topSchools.map((school, idx) => (
                  <View key={`${school.name}-${idx}`} className="flex-row items-center justify-between">
                    <View className="flex-1 pr-4">
                      <Text className="font-semibold text-gray-900">{school.name}</Text>
                      {school.address && <Text className="text-xs text-gray-500">{school.address}</Text>}
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
              <Text className="text-gray-600">Mengambil daftar laporan…</Text>
            ) : recentReports.length === 0 ? (
              <Text className="text-gray-500">Belum ada laporan darurat yang tercatat.</Text>
            ) : (
              <View className="gap-3">
                {recentReports.map((report) => (
                  <View key={report.id} className="border-b border-gray-200 pb-3">
                    <Text className="text-sm text-gray-500">
                      {new Date(report.date).toLocaleString('id-ID')}
                    </Text>
                    <Text className="text-sm font-semibold text-gray-900">{report.schoolName}</Text>
                    <Text className="text-sm text-gray-700">{report.title}</Text>
                    <Text className="text-xs uppercase tracking-wide text-primary mt-1">
                      {report.status === 'menunggu'
                        ? 'MENUNGGU'
                        : report.status === 'proses'
                        ? 'DIPROSES'
                        : 'SELESAI'}
                    </Text>
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