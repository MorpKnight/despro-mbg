import { Ionicons } from '@expo/vector-icons';
import { Redirect, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { Chip } from '../../components/ui/Chip';
import PageHeader from '../../components/ui/PageHeader';
import Skeleton from '../../components/ui/Skeleton';
import { StatusPill } from '../../components/ui/StatusPill';
import TextInput from '../../components/ui/TextInput';
import TrendChart from '../../components/ui/TrendChart';
import { useAuth } from '../../hooks/useAuth';
import {
  fetchDinkesAreas,
  fetchDinkesKpi,
  fetchSatisfactionTrend,
  type DinkesKpi,
  type SatisfactionTrend,
} from '../../services/analytics';
import { fetchEmergencyReports, type EmergencyReport, type ReportStatus } from '../../services/emergency';

const integerFormatter = new Intl.NumberFormat('id-ID');
const decimalFormatter = new Intl.NumberFormat('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 2 });

const ALL_AREAS = 'ALL_AREAS';
const DEFAULT_AREAS = ['Bogor Utara', 'Bogor Selatan', 'Bogor Timur', 'Bogor Barat', 'Bogor Tengah'];
const STATUS_FILTERS: { label: string; value: 'all' | ReportStatus }[] = [
  { label: 'Semua', value: 'all' },
  { label: 'Menunggu', value: 'menunggu' },
  { label: 'Diproses', value: 'proses' },
  { label: 'Selesai', value: 'selesai' },
];

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  caption?: string;
}

function StatCard({ icon, label, value, caption }: StatCardProps) {
  return (
    <View className="flex-1 min-w-[150px] rounded-2xl border border-gray-200 bg-white px-4 py-3">
      <View className="flex-row items-center gap-2 mb-2">
        <View className="w-9 h-9 rounded-full bg-blue-50 items-center justify-center">{icon}</View>
        <Text className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</Text>
      </View>
      <Text className="text-2xl font-bold text-gray-900 mb-1">{value}</Text>
      {caption ? <Text className="text-sm text-gray-500">{caption}</Text> : null}
    </View>
  );
}

function formatInteger(value?: number | null) {
  return typeof value === 'number' ? integerFormatter.format(value) : '—';
}

function formatDecimal(value?: number | null) {
  return typeof value === 'number' ? decimalFormatter.format(value) : '—';
}

interface DinkesDashboardProps {
  healthAreaId?: string; // Optional: If provided, uses this health area (from admin wrapper)
}

export default function DinkesDashboard({ healthAreaId: propHealthAreaId }: DinkesDashboardProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [kpi, setKpi] = useState<DinkesKpi | null>(null);
  const [reports, setReports] = useState<EmergencyReport[]>([]);
  const [trend, setTrend] = useState<SatisfactionTrend | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [areaError, setAreaError] = useState<string | null>(null);
  const [areaLoading, setAreaLoading] = useState(false);
  const [availableAreas, setAvailableAreas] = useState<string[]>([]);
  // If healthAreaId is provided via prop (from admin wrapper), use it as the initial selected area
  const [selectedArea, setSelectedArea] = useState<string>(propHealthAreaId ?? ALL_AREAS);
  const [reportSearchInput, setReportSearchInput] = useState('');
  const [debouncedReportSearch, setDebouncedReportSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ReportStatus>('all');
  const [trendError, setTrendError] = useState<string | null>(null);

  // Sync with prop when it changes
  useEffect(() => {
    if (propHealthAreaId) {
      setSelectedArea(propHealthAreaId);
    }
  }, [propHealthAreaId]);

  useEffect(() => {
    if (user?.role !== 'super_admin' && user?.role !== 'admin_dinkes') {
      setAvailableAreas([]);
      setAreaLoading(false);
      setAreaError(null);
      return;
    }

    if (user?.role === 'admin_dinkes') {
      setAreaLoading(false);
      setAreaError(null);
      setAvailableAreas(user.healthOfficeArea ? [user.healthOfficeArea] : DEFAULT_AREAS);
      return;
    }

    let active = true;
    setAreaLoading(true);
    setAreaError(null);

    fetchDinkesAreas()
      .then((areas) => {
        if (!active) return;
        const sanitized = Array.from(
          new Set(
            (areas ?? [])
              .map((area) => area.trim())
              .filter((area) => area.length > 0),
          ),
        );

        if (sanitized.length === 0) {
          if (user?.role === 'admin_dinkes' && user?.healthOfficeArea) {
            setAvailableAreas([user.healthOfficeArea]);
            setAreaError('Wilayah kerja Anda belum terdaftar di sistem.');
          } else {
            setAvailableAreas(DEFAULT_AREAS);
            setAreaError('Wilayah kerja belum tersedia, gunakan daftar bawaan.');
          }
        } else {
          setAvailableAreas(sanitized);
        }
      })
      .catch((err) => {
        if (!active) return;
        console.warn('[dinkes-dashboard] gagal memuat daftar wilayah', err);
        const fallback = user?.role === 'admin_dinkes' && user?.healthOfficeArea
          ? [user.healthOfficeArea]
          : DEFAULT_AREAS;
        setAvailableAreas(fallback);
        setAreaError('Wilayah kerja tidak dapat dimuat, gunakan daftar bawaan.');
      })
      .finally(() => {
        if (active) {
          setAreaLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [user?.role, user?.healthOfficeArea]);

  useEffect(() => {
    if (user?.role === 'admin_dinkes') {
      setSelectedArea(user.healthOfficeArea ?? ALL_AREAS);
    } else if (user?.role === 'super_admin') {
      setSelectedArea(ALL_AREAS);
    }
  }, [user?.role, user?.healthOfficeArea]);

  const areaOptions = useMemo(() => {
    const base = availableAreas.length ? availableAreas : DEFAULT_AREAS;
    const extras = user?.healthOfficeArea ? [user.healthOfficeArea] : [];
    return Array.from(new Set([...base, ...extras].filter((area) => area && area.trim().length > 0)));
  }, [availableAreas, user?.healthOfficeArea]);

  useEffect(() => {
    if (selectedArea === ALL_AREAS) return;
    if (areaOptions.includes(selectedArea)) return;
    setSelectedArea(areaOptions[0] ?? ALL_AREAS);
  }, [areaOptions, selectedArea]);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setTrendError(null);
      const [kpiRes, reportsRes, trendRes] = await Promise.allSettled([
        fetchDinkesKpi(),
        fetchEmergencyReports(),
        fetchSatisfactionTrend({
          health_office_area_name: selectedArea !== ALL_AREAS ? selectedArea : undefined,
        }),
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
        setTrendError('Gagal memuat data tren.');
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

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedReportSearch(reportSearchInput.trim().toLowerCase());
    }, 300);
    return () => clearTimeout(handler);
  }, [reportSearchInput]);

  const unauthorized = user?.role !== 'admin_dinkes' && user?.role !== 'super_admin';

  const filteredReports = useMemo(() => {
    const keyword = debouncedReportSearch;
    const normalizedArea = selectedArea === ALL_AREAS ? null : selectedArea.toLowerCase();
    return reports.filter((report) => {
      if (statusFilter !== 'all' && report.status !== statusFilter) return false;
      if (keyword) {
        const haystack = `${report.schoolName} ${report.title} ${report.description ?? ''}`.toLowerCase();
        if (!haystack.includes(keyword)) return false;
      }
      if (!normalizedArea) return true;
      const address = report.schoolAddress?.toLowerCase() ?? '';
      const schoolName = report.schoolName.toLowerCase();
      return address.includes(normalizedArea) || schoolName.includes(normalizedArea);
    });
  }, [reports, debouncedReportSearch, selectedArea, statusFilter]);

  const openReports = useMemo(() => filteredReports.filter((r) => r.status !== 'selesai'), [filteredReports]);
  const waitingCount = useMemo(() => filteredReports.filter((r) => r.status === 'menunggu').length, [filteredReports]);
  const processingCount = useMemo(() => filteredReports.filter((r) => r.status === 'proses').length, [filteredReports]);
  const resolvedCount = useMemo(() => filteredReports.filter((r) => r.status === 'selesai').length, [filteredReports]);
  const resolvedThisWeek = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return filteredReports.filter((report) => report.status === 'selesai' && +new Date(report.date) >= weekAgo).length;
  }, [filteredReports]);

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
    () => [...filteredReports].sort((a, b) => +new Date(b.date) - +new Date(a.date)).slice(0, 3),
    [filteredReports],
  );

  const trendPoints = trend?.data ?? [];
  const ratingDisplay = typeof kpi?.rata_rata_rating_global === 'number'
    ? `${formatDecimal(kpi.rata_rata_rating_global)} / 5`
    : '—';
  const selectedAreaLabel = selectedArea === ALL_AREAS ? 'Seluruh kota' : selectedArea;

  if (unauthorized) return <Redirect href="/" />;

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
          <PageHeader
            title="Dashboard Dinas Kesehatan"
            subtitle="Monitoring kesehatan & keamanan pangan sekolah"
            showBackButton={false}
            className="mb-6"
          />

          <Card className="mb-6">
            <View className="gap-4">
              {user?.role === 'super_admin' ? (
                <View>
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-base font-semibold text-gray-900">Filter Wilayah</Text>
                    <Text className="text-xs text-gray-500">
                      {selectedArea === ALL_AREAS ? 'Seluruh kota' : `Fokus ${selectedArea}`}
                    </Text>
                  </View>
                  <View className="flex-row flex-wrap gap-2">
                    {[ALL_AREAS, ...areaOptions].map((area) => (
                      <Chip
                        key={area}
                        label={area === ALL_AREAS ? 'Semua Wilayah' : area}
                        active={selectedArea === area}
                        onPress={() => setSelectedArea(area)}
                        disabled={areaLoading && area !== selectedArea}
                      />
                    ))}
                  </View>
                  {areaError ? <Text className="text-xs text-red-500 mt-2">{areaError}</Text> : null}
                </View>
              ) : (
                <View className="px-4 py-3 rounded-2xl bg-blue-50 border border-blue-100">
                  <Text className="text-xs font-semibold text-blue-600 uppercase mb-1">Wilayah kerja</Text>
                  <Text className="text-base font-semibold text-gray-900">{selectedAreaLabel}</Text>
                  <Text className="text-xs text-gray-600">Laporan difilter berdasarkan wilayah Anda</Text>
                </View>
              )}

              <View className="gap-3">
                <View>
                  <Text className="text-sm font-semibold text-gray-800 mb-2">Cari laporan</Text>
                  <TextInput
                    value={reportSearchInput}
                    onChangeText={setReportSearchInput}
                    placeholder="Cari sekolah atau kasus…"
                    autoCorrect={false}
                    autoCapitalize="none"
                  />
                </View>
                <View>
                  <Text className="text-sm font-semibold text-gray-800 mb-2">Status laporan</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {STATUS_FILTERS.map((status) => (
                      <Chip
                        key={status.value}
                        label={status.label}
                        active={statusFilter === status.value}
                        onPress={() => setStatusFilter(status.value)}
                      />
                    ))}
                  </View>
                </View>
                <Text className="text-xs text-gray-500">
                  Menampilkan {filteredReports.length} dari {reports.length} laporan darurat
                </Text>
              </View>
            </View>
          </Card>

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
                Tuntas minggu ini: {formatInteger(resolvedThisWeek)} laporan
              </Text>
            </View>
          </Card>

          <View className="flex-row flex-wrap gap-4 mb-6">
            <StatCard
              icon={<Ionicons name="alert-circle" size={18} color="#DC2626" />}
              label="Kasus aktif"
              value={loading && reports.length === 0 ? '…' : formatInteger(openReports.length)}
              caption={`${formatInteger(waitingCount)} menunggu • ${formatInteger(processingCount)} diproses`}
            />
            <StatCard
              icon={<Ionicons name="checkmark-done" size={18} color="#16A34A" />}
              label="Selesai (7 hari)"
              value={loading && reports.length === 0 ? '…' : formatInteger(resolvedThisWeek)}
              caption={`${formatInteger(resolvedCount)} tuntas total`}
            />
            <StatCard
              icon={<Ionicons name="school" size={18} color="#2563EB" />}
              label="Sekolah terpantau"
              value={loading && !kpi ? '…' : formatInteger(kpi?.total_sekolah_terpantau)}
              caption="Dalam pemantauan aktif"
            />
            <StatCard
              icon={<Ionicons name="happy" size={18} color="#F59E0B" />}
              label="Rating global"
              value={loading && !kpi ? '…' : ratingDisplay}
              caption="Rata-rata kepuasan siswa"
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
              <Text className="text-gray-600">Tidak ada sekolah dengan kasus aktif pada filter ini.</Text>
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
              <Text className="text-gray-600">Belum ada laporan darurat yang cocok dengan filter ini.</Text>
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

          <TrendChart
            data={trendPoints}
            loading={loading && trendPoints.length === 0}
            title="Tren Kepuasan Siswa"
            error={trendError}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}