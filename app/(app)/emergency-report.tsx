import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import PageHeader from '../../components/ui/PageHeader';
import { useAuth } from '../../hooks/useAuth';
import { fetchEmergencyReports, type EmergencyReport, type ReportStatus } from '../../services/emergency';

const STATUS_META: Record<ReportStatus, { label: string; bg: string; text: string }> = {
  menunggu: { label: 'Menunggu', bg: '#FBC02D', text: '#000000' },
  proses: { label: 'Diproses', bg: '#1976D2', text: '#FFFFFF' },
  selesai: { label: 'Selesai', bg: '#4CAF50', text: '#FFFFFF' },
};

const FILTERS: { value: 'all' | ReportStatus; label: string }[] = [
  { value: 'all', label: 'Semua' },
  { value: 'menunggu', label: 'Menunggu' },
  { value: 'proses', label: 'Diproses' },
  { value: 'selesai', label: 'Selesai' },
];

export default function EmergencyReportPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo: string }>();
  const [reports, setReports] = useState<EmergencyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | ReportStatus>('all');
  const canView = user?.role === 'admin_sekolah' || user?.role === 'super_admin';
  const isLoadingRef = useRef(false);
  const hasLoadedRef = useRef(false);

  const loadReports = useCallback(async (isRefresh = false) => {
    if (!canView) {
      setLoading(false);
      setReports([]);
      return;
    }

    // Prevent multiple simultaneous calls
    if (isLoadingRef.current) {
      return;
    }

    isLoadingRef.current = true;

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await fetchEmergencyReports();
      setReports(data);
      setError(null);
      hasLoadedRef.current = true;
    } catch (err) {
      console.warn('[emergency-report] gagal memuat', err);
      setReports([]);
      setError('Gagal memuat daftar laporan darurat.');
    } finally {
      isLoadingRef.current = false;
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, [canView]);

  // Initial load - only once on mount
  useEffect(() => {
    if (canView && !hasLoadedRef.current) {
      loadReports();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canView]); // Only depend on canView

  // Auto-refresh when user returns to this screen
  useFocusEffect(
    useCallback(() => {
      // Only refresh if already loaded once and not currently loading
      if (canView && hasLoadedRef.current && !isLoadingRef.current && !loading && !refreshing) {
        loadReports(true);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canView]) // Only depend on canView
  );

  const onRefresh = useCallback(() => {
    loadReports(true);
  }, [loadReports]);

  const sortedReports = useMemo(
    () => [...reports].sort((a, b) => +new Date(b.date) - +new Date(a.date)),
    [reports],
  );

  const filteredReports = useMemo(() => {
    if (filter === 'all') return sortedReports;
    return sortedReports.filter((report) => report.status === filter);
  }, [sortedReports, filter]);

  if (user?.role !== 'admin_sekolah' && user?.role !== 'super_admin') return <Redirect href="/" />;

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <SafeAreaView className="flex-1 bg-[#f5f7fb]">
      <PageHeader
        title="Laporan Darurat"
        subtitle="Pantau dan tindak lanjuti laporan"
        backPath={returnTo}
        onRefresh={onRefresh}
        isRefreshing={refreshing}
        className="mx-6 mt-6 mb-4"
      />

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2563EB']}
            tintColor="#2563EB"
          />
        }
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <View className="px-6">
          <Card className="mb-4 bg-white p-4">
            <View className="flex-row items-center justify-between mb-4" accessible={false}>
              <View className="flex-1 mr-4" accessible={false}>
                <Text className="text-base font-semibold text-gray-900">Buat Laporan Baru</Text>
                <Text className="text-xs text-gray-500 mt-1">Laporkan kejadian darurat segera</Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push({ pathname: '/(app)/emergency-report/new', params: { returnTo: '/(app)/emergency-report' } })}
                className="w-10 h-10 rounded-full bg-red-500 items-center justify-center shadow-sm active:bg-red-600"
                accessibilityRole="button"
                accessibilityLabel="Buat laporan darurat baru"
                accessible={true}
              >
                <Ionicons name="add" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </Card>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4 flex-row" contentContainerStyle={{ paddingRight: 20 }}>
            {FILTERS.map((item) => {
              const active = filter === item.value;
              return (
                <TouchableOpacity
                  key={item.value}
                  className={`px-4 py-2 rounded-full border mr-2 ${active ? 'bg-blue-600 border-blue-600' : 'border-gray-200 bg-white'}`}
                  onPress={() => setFilter(item.value)}
                >
                  <Text className={`text-xs font-semibold ${active ? 'text-white' : 'text-gray-600'}`}>{item.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {loading ? (
            <View className="gap-3">
              <Card className="p-4"><Text>Memuat...</Text></Card>
            </View>
          ) : error ? (
            <Card className="border border-red-200 bg-red-50 p-4">
              <Text className="text-red-600">{error}</Text>
            </Card>
          ) : filteredReports.length === 0 ? (
            <View className="items-center justify-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
              <Ionicons name="medkit-outline" size={48} color="#9CA3AF" />
              <Text className="text-gray-500 mt-3 text-center px-6">
                Tidak ada laporan dengan filter ini.
              </Text>
            </View>
          ) : (
            <View className="gap-3">
              {filteredReports.map((report) => {
                const meta = STATUS_META[report.status];
                const lastFollowUp = report.followUps[report.followUps.length - 1];
                return (
                  <Pressable
                    key={report.id}
                    onPress={() => router.push(`/dinkes-emergency/${report.id}` as never)}
                  >
                    <Card className="p-4 border border-gray-100 shadow-sm">
                      <View className="flex-row items-start justify-between">
                        <View className="flex-1 pr-3">
                          <View className="flex-row items-center gap-2 mb-1">
                            <View
                              className="px-2 py-0.5 rounded text-[10px]"
                              style={{ backgroundColor: meta.bg }}
                            >
                              <Text style={{ color: meta.text, fontSize: 10, fontWeight: '700' }}>{meta.label}</Text>
                            </View>
                            <Text className="text-xs text-gray-400">• {fmtDate(report.date)}</Text>
                          </View>

                          <Text className="font-bold text-gray-900 text-sm mb-1">{report.title}</Text>

                          {report.description && (
                            <Text className="text-xs text-gray-600 mb-2 leading-relaxed" numberOfLines={2}>{report.description}</Text>
                          )}

                          {lastFollowUp && (
                            <View className="mt-2 pt-2 border-t border-gray-50">
                              <Text className="text-[10px] text-gray-400 italic" numberOfLines={1}>
                                Update: {lastFollowUp.note}
                              </Text>
                            </View>
                          )}
                        </View>
                        <Ionicons name="chevron-forward" size={16} color="#9CA3AF" className="mt-1" />
                      </View>
                    </Card>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
