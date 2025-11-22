import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import Card from '../../components/ui/Card';
import { ChipGroup } from '../../components/ui/Chip';
import Skeleton from '../../components/ui/Skeleton';
import { useAuth } from '../../hooks/useAuth';
import {
    fetchDinkesKpi,
    fetchGlobalKpi,
    fetchSatisfactionTrend,
    type DinkesKpi,
    type GlobalKpi,
    type SatisfactionTrend,
} from '../../services/analytics';

const integerFormatter = new Intl.NumberFormat('id-ID');
const decimalFormatter = new Intl.NumberFormat('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 2 });

function formatInteger(value?: number | null) {
  return typeof value === 'number' ? integerFormatter.format(value) : '—';
}

function formatDecimal(value?: number | null) {
  return typeof value === 'number' ? decimalFormatter.format(value) : '—';
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between py-1">
      <Text className="text-sm text-gray-600">{label}</Text>
      <Text className="text-sm font-semibold text-gray-900">{value}</Text>
    </View>
  );
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  const isDinkes = user?.role === 'admin_dinkes';

  const [globalKpi, setGlobalKpi] = useState<GlobalKpi | null>(null);
  const [dinkesKpi, setDinkesKpi] = useState<DinkesKpi | null>(null);
  const [trend, setTrend] = useState<SatisfactionTrend | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trendRange, setTrendRange] = useState<'7' | '30' | '90'>('30');

  useEffect(() => {
    let active = true;

    if (!isSuperAdmin && !isDinkes) {
      setGlobalKpi(null);
      setDinkesKpi(null);
      setTrend(null);
      setLoading(false);
      setError(null);
      return () => {
        active = false;
      };
    }

    setLoading(true);
    setError(null);

    (async () => {
      const [globalRes, dinkesRes, trendRes] = await Promise.allSettled([
        isSuperAdmin ? fetchGlobalKpi() : Promise.resolve(null),
        (isSuperAdmin || isDinkes) ? fetchDinkesKpi() : Promise.resolve(null),
        (isSuperAdmin || isDinkes) ? fetchSatisfactionTrend() : Promise.resolve(null),
      ]);

      if (!active) return;

      const failures: string[] = [];

      if (globalRes.status === 'fulfilled') {
        setGlobalKpi(globalRes.value as GlobalKpi | null);
      } else {
        setGlobalKpi(null);
        if (isSuperAdmin) failures.push('ringkasan global');
        console.warn('[analytics] gagal memuat KPI global', globalRes.reason);
      }

      if (dinkesRes.status === 'fulfilled') {
        setDinkesKpi(dinkesRes.value as DinkesKpi | null);
      } else {
        setDinkesKpi(null);
        if (isSuperAdmin || isDinkes) failures.push('KPI Dinkes');
        console.warn('[analytics] gagal memuat KPI Dinkes', dinkesRes.reason);
      }

      if (trendRes.status === 'fulfilled') {
        setTrend(trendRes.value as SatisfactionTrend | null);
      } else {
        setTrend(null);
        if (isSuperAdmin || isDinkes) failures.push('tren kepuasan');
        console.warn('[analytics] gagal memuat tren kepuasan', trendRes.reason);
      }

      setError(failures.length ? `Sebagian data gagal dimuat (${failures.join(', ')}).` : null);
      setLoading(false);
    })().catch((err) => {
      console.error('[analytics] fetch error', err);
      if (!active) return;
      setGlobalKpi(null);
      setDinkesKpi(null);
      setTrend(null);
      setError('Terjadi kesalahan saat memuat data analitik.');
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [isSuperAdmin, isDinkes]);

  const visibleTrend = useMemo(() => {
    if (!trend?.data) return [];
    const count = Number(trendRange);
    return trend.data.slice(-count);
  }, [trend?.data, trendRange]);

  if (!isSuperAdmin && !isDinkes) {
    return (
      <SafeAreaView className="flex-1 bg-[#f5f7fb]">
        <ScrollView className="flex-1 bg-neutral-gray" contentContainerClassName="p-6">
          <Card>
            <Text className="text-lg font-semibold text-gray-900 mb-2">Akses Terbatas</Text>
            <Text className="text-gray-600">
              Fitur analitik global hanya tersedia untuk Super Admin dan Admin Dinas Kesehatan.
            </Text>
          </Card>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#f5f7fb]">
      <ScrollView className="flex-1 bg-neutral-gray">
        <View className="p-6">
          <Text className="text-2xl font-bold text-gray-900 mb-1">Analitik &amp; Laporan</Text>
          <Text className="text-gray-700 mb-4">Data terbaru dari sistem MBG</Text>

          {error && (
            <Card className="mb-4 border border-accent-red bg-red-50">
              <Text className="text-accent-red">{error}</Text>
            </Card>
          )}

          {isSuperAdmin && (
            <Card className="mb-4">
              <Text className="text-lg font-semibold text-gray-900 mb-3">Ringkasan Global</Text>
              {loading && !globalKpi ? (
                <View className="gap-3">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <Skeleton key={idx} height={18} rounded={8} />
                  ))}
                </View>
              ) : (
                <View className="gap-2">
                  <MetricRow label="Total sekolah" value={formatInteger(globalKpi?.total_sekolah)} />
                  <MetricRow label="Total mitra katering" value={formatInteger(globalKpi?.total_katering)} />
                  <MetricRow label="Total siswa" value={formatInteger(globalKpi?.total_siswa)} />
                  <MetricRow label="Laporan darurat aktif" value={formatInteger(globalKpi?.total_laporan_darurat_aktif)} />
                </View>
              )}
            </Card>
          )}

          {(isSuperAdmin || isDinkes) && (
            <Card className="mb-4">
              <Text className="text-lg font-semibold text-gray-900 mb-3">KPI Dinas Kesehatan</Text>
              {loading && !dinkesKpi ? (
                <Text className="text-gray-600">Memuat KPI Dinkes…</Text>
              ) : dinkesKpi ? (
                <View className="gap-1">
                  <MetricRow label="Laporan diproses" value={formatInteger(dinkesKpi.total_laporan_diproses)} />
                  <MetricRow label="Sekolah terpantau" value={formatInteger(dinkesKpi.total_sekolah_terpantau)} />
                  <MetricRow
                    label="Rata-rata rating global"
                    value={typeof dinkesKpi.rata_rata_rating_global === 'number'
                      ? `${formatDecimal(dinkesKpi.rata_rata_rating_global)} / 5`
                      : '—'}
                  />
                </View>
              ) : (
                <Text className="text-gray-500">Data KPI tidak tersedia.</Text>
              )}
            </Card>
          )}

          {(isSuperAdmin || isDinkes) && (
            <Card className="mb-6">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-lg font-semibold text-gray-900">Tren Kepuasan Siswa</Text>
                <ChipGroup
                  options={[
                    { label: '7 hari', value: '7' },
                    { label: '30 hari', value: '30' },
                    { label: '90 hari', value: '90' },
                  ]}
                  value={trendRange}
                  onChange={(val) => setTrendRange(val as '7' | '30' | '90')}
                />
              </View>
              {loading && !trend ? (
                <View className="gap-2">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <Skeleton key={idx} height={20} rounded={6} />
                  ))}
                </View>
              ) : visibleTrend.length > 0 ? (
                <View className="gap-3">
                  {visibleTrend.map((point) => (
                    <View key={point.label} className="flex-row items-center justify-between border-b border-gray-100 pb-2">
                      <Text className="text-sm text-gray-700">{point.label}</Text>
                      <Text className="text-sm font-semibold text-gray-900">{formatDecimal(point.value)}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text className="text-gray-600">Belum ada data tren kepuasan.</Text>
              )}
            </Card>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
