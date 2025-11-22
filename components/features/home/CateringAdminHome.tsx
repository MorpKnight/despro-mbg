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
import { fetchCateringKpi, type CateringKpi } from '../../../services/analytics';

interface Props {
  username?: string | null;
  cateringId?: string | null;
}

export function CateringAdminHome({ username, cateringId }: Props) {
  const { isMobile } = useResponsive();
  const router = useRouter();
  const [kpi, setKpi] = useState<CateringKpi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    if (!cateringId) {
      setLoading(false);
      setError('Data catering tidak ditemukan pada profil admin.');
      return;
    }

    (async () => {
      try {
        const data = await fetchCateringKpi(cateringId);
        if (!active) return;
        setKpi(data);
        setError(null);
      } catch (err) {
        console.error('[catering-admin-home] failed to load KPI', err);
        if (!active) return;
        setError('Gagal memuat KPI katering.');
      } finally {
        if (!active) return;
        setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [cateringId]);

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
            Dashboard Admin Katering
          </Text>
          <Text className={`${isMobile ? 'text-sm' : 'text-base'} text-gray-600`}>
            Selamat datang{username ? `, ${username}` : ''} — pantau performa menu dan feedback.
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
              <Text className="text-sm text-gray-600 mb-1">Rata-rata Rating Katering</Text>
              {loading ? (
                <Skeleton height={24} width={80} rounded={8} />
              ) : (
                <Text className="text-2xl font-bold text-gray-900">
                  {kpi ? kpi.rata_rata_rating_katering.toFixed(2) : '—'}
                </Text>
              )}
            </View>
            <Ionicons name="star" size={28} color="#F59E0B" />
          </Card>
          <Card className="p-4 flex-row items-center justify-between">
            <View>
              <Text className="text-sm text-gray-600 mb-1">Total Feedback</Text>
              {loading ? (
                <Skeleton height={24} width={80} rounded={8} />
              ) : (
                <Text className="text-2xl font-bold text-gray-900">
                  {kpi ? kpi.total_feedback_diterima : 0}
                </Text>
              )}
            </View>
            <Ionicons name="chatbubbles" size={28} color="#3B82F6" />
          </Card>
          <Card className="p-4 flex-row items-center justify-between">
            <View>
              <Text className="text-sm text-gray-600 mb-1">Menu Terpantau</Text>
              {loading ? (
                <Skeleton height={24} width={80} rounded={8} />
              ) : (
                <Text className="text-2xl font-bold text-gray-900">
                  {kpi && kpi.menu_rating_terbaik?.nama_menu ? 1 : 0}
                </Text>
              )}
            </View>
            <Ionicons name="restaurant" size={28} color="#10B981" />
          </Card>
        </Grid>

        {error && (
          <Text className="text-xs text-red-600 mb-4">{error}</Text>
        )}

        {/* Quick Actions */}
        <Card className={isMobile ? 'mb-6 p-4' : 'mb-8 p-6'}>
          <Text className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-gray-900 mb-4`}>
            Aksi Cepat
          </Text>
          <View className="gap-3">
            <Button
              title="Kelola Katering"
              variant="primary"
              icon={<Ionicons name="restaurant" size={20} color="white" />}
              fullWidth
              onPress={() => router.push('/catering-dashboard')}
            />
            <Button
              title="Lihat Feedback"
              variant="outline"
              icon={<Ionicons name="chatbubbles" size={20} color="#2563EB" />}
              fullWidth
              onPress={() => router.push('/feedback-list')}
            />
          </View>
        </Card>

        {/* Best / worst menu placeholder */}
        <Card>
          <Text className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-gray-900 mb-3`}>
            Menu Terbaik & Perlu Perhatian
          </Text>
          {loading || !kpi ? (
            <Skeleton height={64} rounded={12} />
          ) : (
            <View className="gap-3">
              <View className="p-3 rounded-xl bg-emerald-50 flex-row items-center justify-between">
                <View className="flex-1 pr-3">
                  <Text className="text-xs font-semibold text-emerald-700 mb-1">Menu Terbaik</Text>
                  <Text className="text-sm font-semibold text-gray-900">
                    {kpi.menu_rating_terbaik?.nama_menu ?? 'Belum ada data'}
                  </Text>
                </View>
                <Ionicons name="thumbs-up" size={22} color="#059669" />
              </View>
              <View className="p-3 rounded-xl bg-rose-50 flex-row items-center justify-between">
                <View className="flex-1 pr-3">
                  <Text className="text-xs font-semibold text-rose-700 mb-1">Menu Perlu Perhatian</Text>
                  <Text className="text-sm font-semibold text-gray-900">
                    {kpi.menu_rating_terburuk?.nama_menu ?? 'Belum ada data'}
                  </Text>
                </View>
                <Ionicons name="thumbs-down" size={22} color="#DC2626" />
              </View>
            </View>
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
