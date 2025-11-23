import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Redirect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
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
  const [reports, setReports] = useState<EmergencyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | ReportStatus>('all');
  const canView = user?.role === 'admin_sekolah' || user?.role === 'super_admin';

  const loadReports = useCallback(async (isRefresh = false) => {
    if (!canView) {
      setLoading(false);
      setReports([]);
      return;
    }

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
    } catch (err) {
      console.warn('[emergency-report] gagal memuat', err);
      setReports([]);
      setError('Gagal memuat daftar laporan darurat.');
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, [canView]);

  // Initial load
  useEffect(() => {
    loadReports();
  }, [loadReports]);

  // Auto-refresh when user returns to this screen
  useFocusEffect(
    useCallback(() => {
      // Only refresh if not already loading
      if (!loading && !refreshing) {
        loadReports(true);
      }
    }, [loading, refreshing, loadReports])
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
      <ScrollView
        className="flex-1 bg-neutral-gray"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2563EB']}
            tintColor="#2563EB"
          />
        }
      >
        <View className="p-6">
          <View className="mb-4">
            <Text className="text-2xl font-bold text-gray-900">Laporan Darurat Sekolah</Text>
            <Text className="text-gray-600">Pantau dan tindak lanjuti laporan darurat yang dibuat oleh sekolah Anda</Text>
          </View>

          <Card className="mb-4">
            <View className="flex-row">
              <View className="flex-1">
                <Button
                  title="+ Buat Laporan Baru"
                  className="w-full"
                  style={{ backgroundColor: '#E53935' }}
                  onPress={() => {
                    router.push('/(app)/emergency-report/new');
                  }}
                />
              </View>
            </View>
            <View className="absolute left-4 top-4">
              <Ionicons name="add-circle" size={20} color="#FFFFFF" />
            </View>
          </Card>

          <View className="flex-row gap-2 mb-4">
            {FILTERS.map((item) => {
              const active = filter === item.value;
              return (
                <TouchableOpacity
                  key={item.value}
                  className={`px-3 py-1 rounded-full border ${active ? 'bg-primary border-primary' : 'border-gray-200 bg-white'}`}
                  onPress={() => setFilter(item.value)}
                >
                  <Text className={`text-xs font-semibold ${active ? 'text-white' : 'text-gray-600'}`}>{item.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {loading ? (
            <Card>
              <Text className="text-gray-600">Memuat laporan darurat…</Text>
            </Card>
          ) : error ? (
            <Card className="border border-accent-red bg-red-50">
              <Text className="text-accent-red">{error}</Text>
            </Card>
          ) : filteredReports.length === 0 ? (
            <View className="items-center justify-center py-12">
              <Ionicons name="medkit-outline" size={40} color="#9CA3AF" />
              <Text className="text-gray-500 mt-2 text-center">
                Tidak ada laporan dengan kriteria ini. Gunakan tombol di atas untuk membuat laporan baru.
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
                    <Card className="p-4">
                      <View className="flex-row items-start justify-between">
                        <View className="flex-1 pr-3">
                          <Text className="text-xs text-gray-500 mb-1">{fmtDate(report.date)}</Text>
                          <Text className="font-semibold text-gray-900 mb-1">{report.title}</Text>
                          {report.description && (
                            <Text className="text-sm text-gray-700 mb-2" numberOfLines={2}>{report.description}</Text>
                          )}
                          <View
                            className="self-start px-3 py-1 rounded-full"
                            style={{ backgroundColor: meta.bg }}
                          >
                            <Text style={{ color: meta.text, fontSize: 12, fontWeight: '700' }}>{meta.label}</Text>
                          </View>
                          {lastFollowUp && (
                            <Text className="text-xs text-gray-500 mt-2" numberOfLines={2}>
                              Terakhir update ({new Date(lastFollowUp.at).toLocaleString('id-ID')}): {lastFollowUp.note}
                            </Text>
                          )}
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
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
