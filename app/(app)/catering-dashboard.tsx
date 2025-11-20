import { Ionicons } from '@expo/vector-icons';
import { Redirect, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { ChipGroup } from '../../components/ui/Chip';
import { useAuth } from '../../hooks/useAuth';
import { fetchCateringKpi, type CateringKpi } from '../../services/analytics';
import { fetchCaterings, type CateringListItem } from '../../services/caterings';

function formatRating(value: number | null | undefined) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—';
  return value.toFixed(1);
}

function RatingStars({ rating }: { rating: number }) {
  const rounded = Math.round(rating * 2) / 2;
  return (
    <View className="flex-row items-center">
      {Array.from({ length: 5 }).map((_, index) => {
        const diff = rounded - index;
        const icon = diff >= 1 ? 'star' : diff === 0.5 ? 'star-half' : 'star-outline';
        return <Ionicons key={index} name={icon as any} size={24} color="#FBC02D" />;
      })}
    </View>
  );
}

export default function CateringDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [caterings, setCaterings] = useState<CateringListItem[]>([]);
  const [selectedCateringId, setSelectedCateringId] = useState<string | null>(null);
  const [kpi, setKpi] = useState<CateringKpi | null>(null);
  const [loadingCaterings, setLoadingCaterings] = useState(false);
  const [loadingKpi, setLoadingKpi] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSuperAdmin = user?.role === 'super_admin';
  const isCateringAdmin = user?.role === 'admin_catering';

  useEffect(() => {
    let active = true;

    if (isSuperAdmin) {
      setLoadingCaterings(true);
      fetchCaterings({ limit: 50 })
        .then((list) => {
          if (!active) return;
          setCaterings(list);
          if (list.length > 0) {
            setSelectedCateringId((previous) => previous ?? list[0].id);
          }
        })
        .catch((err) => {
          console.warn('[catering-dashboard] gagal memuat daftar katering', err);
          if (!active) return;
          setError('Tidak dapat memuat daftar katering.');
        })
        .finally(() => {
          if (active) setLoadingCaterings(false);
        });
    } else if (isCateringAdmin) {
      setSelectedCateringId(user?.cateringId ?? null);
    } else {
      setSelectedCateringId(null);
    }

    return () => {
      active = false;
    };
  }, [isSuperAdmin, isCateringAdmin, user?.cateringId]);

  useEffect(() => {
    let active = true;
    if (!selectedCateringId) {
      setKpi(null);
      return () => {
        active = false;
      };
    }

    setLoadingKpi(true);
    setError(null);
    fetchCateringKpi(selectedCateringId)
      .then((data) => {
        if (!active) return;
        setKpi(data);
      })
      .catch((err) => {
        console.warn('[catering-dashboard] gagal memuat KPI katering', err);
        if (!active) return;
        setKpi(null);
        setError('Tidak dapat memuat KPI katering untuk pilihan ini.');
      })
      .finally(() => {
        if (active) setLoadingKpi(false);
      });

    return () => {
      active = false;
    };
  }, [selectedCateringId]);

  const selectedCatering = useMemo(() => {
    if (!selectedCateringId) return null;
    return caterings.find((item) => item.id === selectedCateringId) ?? null;
  }, [caterings, selectedCateringId]);

  if (!isCateringAdmin && !isSuperAdmin) return <Redirect href="/" />;

  if (isCateringAdmin && !user?.cateringId) {
    return (
      <SafeAreaView className="flex-1 bg-[#f5f7fb]">
        <ScrollView className="flex-1 bg-neutral-gray">
          <View className="p-6">
            <Card>
              <Text className="text-lg font-semibold text-gray-900 mb-2">Profil belum lengkap</Text>
              <Text className="text-gray-600">
                Akun Anda belum terasosiasi dengan katering mana pun. Hubungi super admin untuk memperbarui profil.
              </Text>
            </Card>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#f5f7fb]">
      <ScrollView className="flex-1 bg-neutral-gray">
        <View className="p-6">
          {/* Page Header */}
          <View className="mb-6">
            <Text className="text-2xl font-bold text-gray-900 mb-1">Dashboard Catering</Text>
            <Text className="text-gray-600">Operasional Menu & Kualitas Layanan</Text>
          </View>

          {/* Super Admin Selector */}
          {isSuperAdmin && (
            <View className="mb-6">
              <Text className="text-base font-semibold text-gray-800 mb-3">Pilih Catering</Text>
              {loadingCaterings ? (
                <View className="py-3">
                  <ActivityIndicator color="#1976D2" />
                </View>
              ) : (
                <ChipGroup
                  scrollable
                  options={caterings.map((c) => ({ label: c.name, value: c.id }))}
                  value={selectedCateringId ?? ''}
                  onChange={(value) => setSelectedCateringId(value)}
                />
              )}
            </View>
          )}

          {selectedCatering && (
            <Card className="mb-6">
              <Text className="text-sm text-gray-500 uppercase">Katering aktif</Text>
              <Text className="text-xl font-semibold text-gray-900 mt-1">{selectedCatering.name}</Text>
              {selectedCatering.alamat ? (
                <Text className="text-xs text-gray-500 mt-1">{selectedCatering.alamat}</Text>
              ) : null}
            </Card>
          )}

          {/* Daily Menu CTA */}
          <Card className="mb-6">
            <View className="flex-row items-center mb-4">
              <View className="w-12 h-12 rounded-full items-center justify-center mr-3" style={{ backgroundColor: '#1976D220' }}>
                <Ionicons name="restaurant" size={28} color="#1976D2" />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-bold text-gray-900">Menu Hari Ini Sudah Diisi?</Text>
                <Text className="text-sm text-gray-600">Pastikan menu dan alergi sudah diinput sebelum 09:00</Text>
              </View>
            </View>
            <Button
              title="Isi Menu Hari Ini"
              variant="primary"
              onPress={() => router.push('/(app)/catering-menu-qc')}
            />
          </Card>

          {/* Quality Score */}
          <Card className="mb-6">
            <Text className="text-lg font-bold text-gray-900 mb-3">Skor Kepuasan Rata-Rata (Minggu Ini)</Text>
            {loadingKpi ? (
              <View className="py-4">
                <ActivityIndicator color="#1976D2" />
              </View>
            ) : (
              <>
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-baseline">
                    <Text className="text-6xl font-extrabold text-gray-900 mr-2">{formatRating(kpi?.rata_rata_rating_katering)}</Text>
                    <Text className="text-xl text-gray-600">/ 5.0</Text>
                  </View>
                  {typeof kpi?.rata_rata_rating_katering === 'number' ? (
                    <RatingStars rating={kpi.rata_rata_rating_katering} />
                  ) : (
                    <Ionicons name="star-outline" size={24} color="#9CA3AF" />
                  )}
                </View>
                <Text className="text-xs text-gray-500 mt-2">
                  {kpi?.total_feedback_diterima ? `Berdasarkan ${kpi.total_feedback_diterima} ulasan` : 'Belum ada ulasan yang masuk'}
                </Text>
              </>
            )}
          </Card>

          {/* Menu Highlights */}
          <Card>
            <Text className="text-lg font-bold text-gray-900 mb-4">Sorotan Menu</Text>
            {loadingKpi ? (
              <View className="py-3">
                <ActivityIndicator color="#1976D2" />
              </View>
            ) : (
              <View className="flex-row gap-4">
                <View className="flex-1">
                  <View className="flex-row items-center mb-3">
                    <View className="w-9 h-9 rounded-full items-center justify-center mr-2" style={{ backgroundColor: '#4CAF5020' }}>
                      <Ionicons name="thumbs-up" size={20} color="#4CAF50" />
                    </View>
                    <Text className="font-semibold text-gray-900">Menu Terbaik</Text>
                  </View>
                  {kpi?.menu_rating_terbaik ? (
                    <>
                      <Text className="text-gray-800 text-base font-semibold">{kpi.menu_rating_terbaik.nama_menu ?? 'Tanpa nama'}</Text>
                      <Text className="text-sm text-gray-600 mt-1">
                        Rating rata-rata {formatRating(kpi.menu_rating_terbaik.rata_rata_rating)} / 5
                      </Text>
                    </>
                  ) : (
                    <Text className="text-sm text-gray-500">Belum ada menu dengan rating tinggi.</Text>
                  )}
                </View>

                <View className="flex-1">
                  <View className="flex-row items-center mb-3">
                    <View className="w-9 h-9 rounded-full items-center justify-center mr-2" style={{ backgroundColor: '#FBC02D20' }}>
                      <Ionicons name="alert-circle" size={20} color="#FBC02D" />
                    </View>
                    <Text className="font-semibold text-gray-900">Perlu Perhatian</Text>
                  </View>
                  {kpi?.menu_rating_terburuk ? (
                    <>
                      <Text className="text-gray-800 text-base font-semibold">{kpi.menu_rating_terburuk.nama_menu ?? 'Tanpa nama'}</Text>
                      <Text className="text-sm text-gray-600 mt-1">
                        Rating rata-rata {formatRating(kpi.menu_rating_terburuk.rata_rata_rating)} / 5
                      </Text>
                    </>
                  ) : (
                    <Text className="text-sm text-gray-500">Belum ada menu yang perlu diinvestigasi.</Text>
                  )}
                </View>
              </View>
            )}
          </Card>

          {error && (
            <Card className="mt-6 border border-accent-red bg-red-50">
              <Text className="text-accent-red">{error}</Text>
            </Card>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}