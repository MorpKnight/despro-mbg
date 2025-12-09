import { Ionicons } from '@expo/vector-icons';
import PageHeader from '../../components/ui/PageHeader';

// ... (existing imports)
import { FlashList, type ListRenderItemInfo } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { Redirect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import Card from '../../components/ui/Card';
import Skeleton from '../../components/ui/Skeleton';
import { useAuth } from '../../hooks/useAuth';
import { fetchFeedbackList, type FeedbackItem as ApiFeedbackItem } from '../../services/feedback';

function formatDisplayDate(iso: string) {
  return new Date(iso).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDateParam(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export default function FeedbackListPage() {
  const { user } = useAuth();
  const { returnTo } = useLocalSearchParams<{ returnTo: string }>();
  const allowed = user?.role === 'admin_sekolah' || user?.role === 'super_admin';

  const [onlyNegative, setOnlyNegative] = useState(false);
  const [start, setStart] = useState<Date>(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000));
  const [end, setEnd] = useState<Date>(new Date());
  const [feedback, setFeedback] = useState<ApiFeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const shift = useCallback((which: 'start' | 'end', days: number) => {
    if (which === 'start') {
      setStart((previous) => {
        const next = new Date(previous.getFullYear(), previous.getMonth(), previous.getDate() + days);
        setEnd((currentEnd) => (next.getTime() > currentEnd.getTime() ? new Date(next) : currentEnd));
        return next;
      });
    } else {
      setEnd((previous) => {
        const next = new Date(previous.getFullYear(), previous.getMonth(), previous.getDate() + days);
        setStart((currentStart) => (next.getTime() < currentStart.getTime() ? new Date(next) : currentStart));
        return next;
      });
    }
  }, []);

  const loadFeedback = useCallback(async (opts?: { silent?: boolean }) => {
    if (!allowed) return;
    const silent = opts?.silent ?? false;
    if (!silent) setLoading(true);
    setError(null);
    try {
      const data = await fetchFeedbackList({
        dateFrom: formatDateParam(start),
        dateTo: formatDateParam(end),
      });
      setFeedback(data);
    } catch (err: any) {
      console.warn('[feedback-list] failed to load', err);
      setFeedback([]);
      setError('Gagal memuat daftar umpan balik.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [allowed, start, end]);

  useEffect(() => {
    loadFeedback();
  }, [loadFeedback]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadFeedback({ silent: true });
    } finally {
      setRefreshing(false);
    }
  }, [loadFeedback]);

  const visibleFeedback = useMemo(() => {
    const startTimestamp = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
    const endTimestamp = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999).getTime();
    return feedback.filter((item) => {
      const created = new Date(item.createdAt).getTime();
      if (Number.isNaN(created)) return !onlyNegative || item.rating <= 2;
      if (created < startTimestamp || created > endTimestamp) return false;
      if (onlyNegative && item.rating > 2) return false;
      return true;
    });
  }, [feedback, onlyNegative, start, end]);

  const listData = loading ? [] : visibleFeedback;

  const renderFeedbackItem = useCallback(
    ({ item }: ListRenderItemInfo<ApiFeedbackItem>) => (
      <Card className="p-4">
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-3">
            <Text className="font-semibold text-gray-900">
              {item.student.fullName || item.student.username}
            </Text>
            <Text className="text-xs text-gray-500">ID: {item.student.username}</Text>
          </View>
          <Text className="text-xs text-gray-500">{formatDisplayDate(item.createdAt)}</Text>
        </View>

        <View className="flex-row items-center gap-1 mt-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Ionicons
              key={index}
              name={index < item.rating ? 'star' : 'star-outline'}
              size={16}
              color="#F59E0B"
            />
          ))}
          <Text className="text-xs text-gray-500 ml-1">{item.rating}/5</Text>
        </View>

        {item.comment && (
          <Text className="text-sm text-gray-700 mt-2">{item.comment}</Text>
        )}

        {item.menuId && (
          <Text className="text-xs text-gray-500 mt-1">Menu ID: {item.menuId}</Text>
        )}

        {item.photoUrl && (
          <View className="mt-3">
            <Image
              source={{ uri: item.photoUrl }}
              style={{ width: 140, height: 90, borderRadius: 10 }}
              contentFit="cover"
            />
          </View>
        )}
      </Card>
    ),
    [],
  );

  const renderEmptyComponent = useCallback(() => {
    if (loading) return null;
    return (
      <View className="items-center justify-center py-12">
        <Ionicons name="chatbubble-ellipses-outline" size={40} color="#9CA3AF" />
        <Text className="text-gray-500 mt-2 text-center">
          Tidak ada umpan balik yang ditemukan untuk kriteria ini.
        </Text>
      </View>
    );
  }, [loading]);

  if (!allowed) {
    return <Redirect href="/" />;
  }

  return (
    <SafeAreaView className="flex-1 bg-[#f5f7fb]">
      <FlashList<ApiFeedbackItem>
        data={listData}
        renderItem={renderFeedbackItem}
        keyExtractor={(item) => item.id}
        // @ts-ignore
        estimatedItemSize={150}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={renderEmptyComponent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#1976D2" />}
        ListHeaderComponent={
          <View className="pt-6">
            <PageHeader
              title="Umpan Balik Siswa"
              showBackButton={false}
              onRefresh={handleRefresh}
              isRefreshing={refreshing}
              className="mb-4"
            />

            <Card className="mb-4">
              <View className="flex-col gap-3">
                <View>
                  <Text className="text-sm text-gray-600 mb-1">Rentang Tanggal</Text>
                  <View className="flex-row flex-wrap items-center justify-between gap-y-2">
                    <View className="flex-row items-center gap-2 flex-shrink">
                      <Ionicons name="calendar-outline" size={16} color="#1976D2" />
                      <Text className="font-semibold text-gray-900">{start.toLocaleDateString('id-ID')}</Text>
                      <View className="flex-row items-center">
                        <TouchableOpacity onPress={() => shift('start', -1)}>
                          <Ionicons name="chevron-back" size={18} color="#374151" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => shift('start', 1)}>
                          <Ionicons name="chevron-forward" size={18} color="#374151" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <Text className="text-gray-400">—</Text>

                    <View className="flex-row items-center gap-2 flex-shrink">
                      <Ionicons name="calendar-outline" size={16} color="#1976D2" />
                      <Text className="font-semibold text-gray-900">{end.toLocaleDateString('id-ID')}</Text>
                      <View className="flex-row items-center">
                        <TouchableOpacity onPress={() => shift('end', -1)}>
                          <Ionicons name="chevron-back" size={18} color="#374151" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => shift('end', 1)}>
                          <Ionicons name="chevron-forward" size={18} color="#374151" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>

                <View className="flex-row items-center justify-start gap-2 mt-2">
                  <TouchableOpacity onPress={() => setOnlyNegative((previous) => !previous)} className="flex-row items-center gap-1">
                    <Ionicons
                      name={onlyNegative ? 'filter' : 'filter-outline'}
                      size={18}
                      color={onlyNegative ? '#1976D2' : '#6B7280'}
                    />
                    <Text className="text-[13px] font-semibold" style={{ color: onlyNegative ? '#1976D2' : '#6B7280' }}>
                      Hanya Tampilkan Feedback Negatif
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Card>

            {error && (
              <Card className="mb-4 border border-accent-red bg-red-50">
                <Text className="text-accent-red">{error}</Text>
              </Card>
            )}

            {loading && (
              <View className="gap-3">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <Skeleton key={idx} height={120} rounded={16} />
                ))}
              </View>
            )}

            <View className="h-4" />
          </View>
        }
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40, backgroundColor: '#f5f7fb' }}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
