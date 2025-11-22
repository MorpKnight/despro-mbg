import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Grid from '../../../components/layout/Grid';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Skeleton from '../../../components/ui/Skeleton';
import { useResponsive } from '../../../hooks/useResponsive';
import { fetchDinkesKpi, fetchSatisfactionTrend, type DinkesKpi, type SatisfactionTrend } from '../../../services/analytics';

interface Props {
  username?: string | null;
  healthOfficeArea?: string | null;
}

export function DinkesAdminHome({ username, healthOfficeArea }: Props) {
  const { isMobile } = useResponsive();
  const router = useRouter();
  const [kpi, setKpi] = useState<DinkesKpi | null>(null);
  const [trend, setTrend] = useState<SatisfactionTrend | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const [kpiData, trendData] = await Promise.all([
          fetchDinkesKpi(),
          fetchSatisfactionTrend(),
        ]);
        if (!active) return;
        setKpi(kpiData);
        setTrend(trendData);
        setError(null);
      } catch (err) {
        console.error('[dinkes-admin-home] failed to load analytics', err);
        if (!active) return;
        setError('Gagal memuat analitik Dinkes.');
      } finally {
        if (!active) return;
        setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  return (
    <SafeAreaView
      className="flex-1 bg-gray-50"
      edges={['top', 'bottom', 'left', 'right']}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: isMobile ? 16 : 32, paddingBottom: isMobile ? 24 : 48 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className={isMobile ? 'mb-6' : 'mb-8'}>
          <Text className={`${isMobile ? 'text-3xl' : 'text-4xl'} font-bold text-gray-900 mb-1`}>
            Dashboard Admin Dinkes
          </Text>
          <Text className={`${isMobile ? 'text-sm' : 'text-base'} text-gray-600`}>
            Selamat datang{username ? `, ${username}` : ''}
            {healthOfficeArea ? ` — wilayah ${healthOfficeArea}` : ''}.
          </Text>
        </View>

        {/* KPI */}
        <Grid
          mobileColumns={1}
          tabletColumns={3}
          desktopColumns={3}
          gap={isMobile ? 3 : 4}
          className={isMobile ? 'mb-6' : 'mb-8'}
        >
          <Card className="p-4 flex-row items-center justify-between">
            <View>
              <Text className="text-sm text-gray-600 mb-1">Laporan Diproses</Text>
              {loading ? (
                <Skeleton height={24} width={80} rounded={8} />
              ) : (
                <Text className="text-2xl font-bold text-gray-900">
                  {kpi ? kpi.total_laporan_diproses : 0}
                </Text>
              )}
            </View>
            <Ionicons name="document-text" size={28} color="#3B82F6" />
          </Card>
          <Card className="p-4 flex-row items-center justify-between">
            <View>
              <Text className="text-sm text-gray-600 mb-1">Rata-rata Kepuasan Global</Text>
              {loading ? (
                <Skeleton height={24} width={80} rounded={8} />
              ) : (
                <Text className="text-2xl font-bold text-gray-900">
                  {kpi ? kpi.rata_rata_rating_global.toFixed(2) : '—'}
                </Text>
              )}
            </View>
            <Ionicons name="happy" size={28} color="#10B981" />
          </Card>
          <Card className="p-4 flex-row items-center justify-between">
            <View>
              <Text className="text-sm text-gray-600 mb-1">Sekolah Terpantau</Text>
              {loading ? (
                <Skeleton height={24} width={80} rounded={8} />
              ) : (
                <Text className="text-2xl font-bold text-gray-900">
                  {kpi ? kpi.total_sekolah_terpantau : 0}
                </Text>
              )}
            </View>
            <Ionicons name="school" size={28} color="#F59E0B" />
          </Card>
        </Grid>

        {error && (
          <Text className="text-xs text-red-600 mb-4">{error}</Text>
        )}

        {/* Trend placeholder */}
        <Card className={isMobile ? 'mb-6 p-4' : 'mb-8 p-6'}>
          <Text className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-gray-900 mb-3`}>
            Tren Kepuasan
          </Text>
          {loading || !trend ? (
            <Skeleton height={120} rounded={12} />
          ) : trend.data.length === 0 ? (
            <Text className="text-sm text-gray-600">
              Belum ada data tren kepuasan.
            </Text>
          ) : (
            <View className="gap-2">
              {trend.data.slice(0, 6).map((point) => (
                <View key={point.label} className="flex-row items-center justify-between">
                  <Text className="text-xs text-gray-600">{point.label}</Text>
                  <Text className="text-xs font-semibold text-gray-900">{point.value.toFixed(2)}</Text>
                </View>
              ))}
            </View>
          )}
        </Card>

        {/* Quick actions */}
        <Card>
          <Text className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-gray-900 mb-4`}>
            Aksi Cepat
          </Text>
          <View className="gap-3">
            <Button
              title="Tinjau Laporan Darurat"
              variant="primary"
              icon={<Ionicons name="warning" size={20} color="white" />}
              fullWidth
              onPress={() => router.push('/dinkes-emergency')}
            />
            <Button
              title="Kelola Sekolah Wilayah"
              variant="outline"
              icon={<Ionicons name="school" size={20} color="#2563EB" />}
              fullWidth
              onPress={() => router.push('/(app)/association-management')}
            />
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
