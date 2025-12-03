import { Ionicons } from '@expo/vector-icons';
import { Redirect, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { Chip } from '../../components/ui/Chip';
import TextInput from '../../components/ui/TextInput';
import TrendChart from '../../components/ui/TrendChart';
import { useAuth } from '../../hooks/useAuth';
import { fetchCateringKpi, fetchSatisfactionTrend, type CateringKpi, type SatisfactionTrend } from '../../services/analytics';
import { fetchCaterings, type CateringListItem } from '../../services/caterings';

const ALL_LOCATIONS = 'ALL_LOCATIONS';
const CATERING_PAGE_SIZE = 6;

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
  const [trendData, setTrendData] = useState<SatisfactionTrend['data']>([]);
  const [trendLoading, setTrendLoading] = useState(false);
  const [loadingCaterings, setLoadingCaterings] = useState(false);
  const [loadingKpi, setLoadingKpi] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectorError, setSelectorError] = useState<string | null>(null);
  const [cateringSearchInput, setCateringSearchInput] = useState('');
  const [debouncedCateringSearch, setDebouncedCateringSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState<string>(ALL_LOCATIONS);
  const [cateringPage, setCateringPage] = useState(0);

  const isSuperAdmin = user?.role === 'super_admin';
  const isCateringAdmin = user?.role === 'admin_catering';

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedCateringSearch(cateringSearchInput.trim());
    }, 350);
    return () => clearTimeout(handle);
  }, [cateringSearchInput]);

  useEffect(() => {
    let active = true;

    if (isSuperAdmin) {
      setLoadingCaterings(true);
      fetchCaterings({ limit: 100, search: debouncedCateringSearch || undefined })
        .then((list) => {
          if (!active) return;
          setCaterings(list);
          setSelectorError(null);
          if (list.length > 0) {
            setSelectedCateringId((previous) => previous ?? list[0].id);
          }
        })
        .catch((err) => {
          console.warn('[catering-dashboard] gagal memuat daftar katering', err);
          if (!active) return;
          setSelectorError('Tidak dapat memuat daftar katering.');
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
  }, [debouncedCateringSearch, isSuperAdmin, isCateringAdmin, user?.cateringId]);

  useEffect(() => {
    setCateringPage(0);
  }, [locationFilter, debouncedCateringSearch]);

  const locationOptions = useMemo(() => {
    const uniques = Array.from(
      new Set(
        caterings
          .map((catering) => (catering.kotaKabupaten || catering.provinsi || catering.kecamatan || '')?.trim())
          .filter((value) => Boolean(value))
      )
    ) as string[];
    return uniques.sort((a, b) => a.localeCompare(b));
  }, [caterings]);

  const filteredCaterings = useMemo(() => {
    if (locationFilter === ALL_LOCATIONS) return caterings;
    return caterings.filter((catering) => {
      const location = catering.kotaKabupaten || catering.provinsi || catering.kecamatan || '';
      return location.trim() === locationFilter;
    });
  }, [caterings, locationFilter]);

  useEffect(() => {
    if (!isSuperAdmin) return;
    if (filteredCaterings.length === 0) {
      setSelectedCateringId(null);
      return;
    }
    if (!selectedCateringId || !filteredCaterings.some((item) => item.id === selectedCateringId)) {
      setSelectedCateringId(filteredCaterings[0].id);
    }
  }, [filteredCaterings, isSuperAdmin, selectedCateringId]);

  const totalCateringPages = Math.ceil(filteredCaterings.length / CATERING_PAGE_SIZE) || 0;
  const paginatedCaterings = useMemo(() => {
    if (filteredCaterings.length === 0) return [];
    const start = cateringPage * CATERING_PAGE_SIZE;
    return filteredCaterings.slice(start, start + CATERING_PAGE_SIZE);
  }, [filteredCaterings, cateringPage]);

  useEffect(() => {
    if (totalCateringPages === 0) {
      setCateringPage(0);
      return;
    }
    setCateringPage((prev) => {
      if (prev >= totalCateringPages) {
        return Math.max(totalCateringPages - 1, 0);
      }
      return prev;
    });
  }, [totalCateringPages]);

  useEffect(() => {
    let active = true;
    if (!selectedCateringId) {
      setKpi(null);
      setTrendData([]);
      setTrendLoading(false);
      return () => {
        active = false;
      };
    }

    setLoadingKpi(true);
    setTrendLoading(true);
    setError(null);
    Promise.all([
      fetchCateringKpi(selectedCateringId),
      fetchSatisfactionTrend({ catering_id: selectedCateringId }),
    ])
      .then(([kpiData, trendRes]) => {
        if (!active) return;
        setKpi(kpiData);
        setTrendData(trendRes?.data ?? []);
      })
      .catch((err) => {
        console.warn('[catering-dashboard] error loading data', err);
        if (!active) return;
        setKpi(null);
        setTrendData([]);
        setError('Gagal memuat data analitik.');
      })
      .finally(() => {
        if (!active) return;
        setLoadingKpi(false);
        setTrendLoading(false);
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
              <View className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
                <View className="gap-2">
                  <Text className="text-xs font-semibold uppercase text-gray-500">Pencarian Katering</Text>
                  <TextInput
                    placeholder="Cari nama atau lokasi katering"
                    value={cateringSearchInput}
                    autoCorrect={false}
                    autoCapitalize="none"
                    onChangeText={setCateringSearchInput}
                  />
                </View>

                {locationOptions.length > 0 && (
                  <View className="space-y-2">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-sm font-semibold text-gray-700">Filter Lokasi</Text>
                      <Pressable onPress={() => setLocationFilter(ALL_LOCATIONS)}>
                        <Text className="text-xs font-semibold text-primary">Reset</Text>
                      </Pressable>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                      {[{ label: 'Semua lokasi', value: ALL_LOCATIONS }, ...locationOptions.map((city) => ({ label: city, value: city }))].map((option) => (
                        <Chip
                          key={option.value}
                          label={option.label}
                          active={option.value === locationFilter}
                          onPress={() => setLocationFilter(option.value)}
                          className="mr-2 mb-2"
                        />
                      ))}
                    </ScrollView>
                  </View>
                )}

                <View className="gap-3">
                  <Text className="text-sm font-semibold text-gray-700">Daftar Katering</Text>
                  {loadingCaterings ? (
                    <View className="py-3 items-center">
                      <ActivityIndicator color="#1976D2" />
                    </View>
                  ) : selectorError ? (
                    <Text className="text-sm text-red-600">{selectorError}</Text>
                  ) : filteredCaterings.length === 0 ? (
                    <Text className="text-sm text-gray-500">
                      Tidak ada katering yang cocok dengan kata kunci atau lokasi yang dipilih.
                    </Text>
                  ) : (
                    <View className="space-y-2">
                      {paginatedCaterings.map((catering) => (
                        <Pressable
                          key={catering.id}
                          onPress={() => setSelectedCateringId(catering.id)}
                          className={`rounded-xl border px-4 py-3 ${
                            catering.id === selectedCateringId ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50'
                          }`}
                        >
                          <Text className="text-base font-semibold text-gray-800">{catering.name}</Text>
                          <Text className="text-xs text-gray-500">
                            {catering.kotaKabupaten || catering.provinsi || 'Lokasi tidak tersedia'}
                          </Text>
                        </Pressable>
                      ))}
                      {filteredCaterings.length > CATERING_PAGE_SIZE && (
                        <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
                          <Text className="text-xs text-gray-500">
                            Menampilkan {filteredCaterings.length === 0 ? 0 : cateringPage * CATERING_PAGE_SIZE + 1}–
                            {Math.min((cateringPage + 1) * CATERING_PAGE_SIZE, filteredCaterings.length)} dari {filteredCaterings.length}
                          </Text>
                          <View className="flex-row gap-2">
                            <Pressable
                              disabled={cateringPage === 0}
                              onPress={() => setCateringPage((prev) => Math.max(prev - 1, 0))}
                              className={`px-3 py-2 rounded-lg border ${
                                cateringPage === 0 ? 'border-gray-200 bg-gray-100' : 'border-gray-300 bg-white'
                              }`}
                            >
                              <Text className={`text-sm font-semibold ${cateringPage === 0 ? 'text-gray-400' : 'text-gray-700'}`}>Prev</Text>
                            </Pressable>
                            <Pressable
                              disabled={cateringPage >= totalCateringPages - 1}
                              onPress={() => setCateringPage((prev) => Math.min(prev + 1, totalCateringPages - 1))}
                              className={`px-3 py-2 rounded-lg border ${
                                cateringPage >= totalCateringPages - 1 ? 'border-gray-200 bg-gray-100' : 'border-gray-300 bg-white'
                              }`}
                            >
                              <Text
                                className={`text-sm font-semibold ${
                                  cateringPage >= totalCateringPages - 1 ? 'text-gray-400' : 'text-gray-700'
                                }`}
                              >
                                Next
                              </Text>
                            </Pressable>
                          </View>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              </View>
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

          {/* Grafik Tren Kepuasan */}
          <Card className="mb-6">
            <TrendChart
              data={trendData}
              loading={trendLoading}
              color="#059669"
              title="Tren Rating Menu (30 Hari)"
            />
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