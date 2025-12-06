import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Stack, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

import { Card } from '../../../components/ui/Card';
import { Chip } from '../../../components/ui/Chip';
import EmptyState from '../../../components/ui/EmptyState';
import LoadingState from '../../../components/ui/LoadingState';
import { fetchMenuDetails, fetchMenuReviews } from '../../../services/foodHistory';
import { formatDate } from '../../../lib/utils'; // Make sure this utils exist or use local helper

export default function MenuDetailsPage() {
    const { id } = useLocalSearchParams<{ id: string }>();

    const { data: menu, isLoading: loadingMenu } = useQuery({
        queryKey: ['menu-details', id],
        queryFn: () => fetchMenuDetails(id!),
        enabled: !!id,
    });

    const { data: reviews, isLoading: loadingReviews } = useQuery({
        queryKey: ['menu-reviews', id],
        queryFn: () => fetchMenuReviews(id!),
        enabled: !!id,
    });

    if (loadingMenu) return <LoadingState />;
    if (!menu) return <EmptyState title="Menu tidak ditemukan" description="Data menu tidak tersedia." />;

    return (
        <SafeAreaView edges={['bottom']} className="flex-1 bg-[#f5f7fb]">
            <Stack.Screen
                options={{
                    title: 'Detail Menu',
                    headerTitleStyle: { fontWeight: '700' },
                    headerBackTitle: 'Kembali',
                }}
            />
            <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
                {/* Menu Info */}
                <Card>
                    <Text className="text-xl font-bold text-gray-900 mb-1">{menu.namaMenu}</Text>
                    <Text className="text-sm text-gray-500 mb-3">{formatDate(new Date(menu.tanggal))}</Text>

                    {menu.notes && (
                        <View className="bg-yellow-50 p-3 rounded-lg mb-3">
                            <Text className="text-sm text-yellow-800 italic">"{menu.notes}"</Text>
                        </View>
                    )}

                    {/* Photos */}
                    {menu.photoUrls && menu.photoUrls.length > 0 && (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3 -mx-1">
                            {menu.photoUrls.map((url, idx) => (
                                <Image
                                    key={idx}
                                    source={{ uri: url }}
                                    style={{ width: 120, height: 120, borderRadius: 8, marginRight: 8, backgroundColor: '#e5e7eb' }}
                                    contentFit="cover"
                                />
                            ))}
                        </ScrollView>
                    )}

                    {/* Ingredients */}
                    <Text className="font-semibold text-gray-800 mb-2">Bahan Baku:</Text>
                    <View className="flex-row flex-wrap gap-2">
                        {Array.isArray(menu.ingredients) && menu.ingredients.map((ing: any, idx: number) => (
                            <Chip key={idx} label={`${ing.name} ${ing.quantity} ${ing.unit}`} active={false} onPress={() => { }} />
                        ))}
                    </View>
                </Card>

                {/* Distribution / Schools */}
                <Card>
                    <View className="flex-row items-center gap-2 mb-3">
                        <Ionicons name="school" size={20} color="#4F46E5" />
                        <Text className="text-lg font-bold text-gray-900">Distribusi Sekolah</Text>
                    </View>
                    {menu.schools && menu.schools.length > 0 ? (
                        <View className="flex-row flex-wrap gap-2">
                            {menu.schools.map(school => (
                                <View key={school.id} className="bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                                    <Text className="text-indigo-700 text-sm font-medium">{school.name}</Text>
                                </View>
                            ))}
                        </View>
                    ) : (
                        <Text className="text-gray-500 italic">Tidak ada data sekolah terhubung.</Text>
                    )}
                </Card>

                {/* Reviews */}
                <View>
                    <Text className="text-lg font-bold text-gray-900 mb-3">Ulasan & Masukan</Text>
                    {loadingReviews ? (
                        <Text className="text-gray-500">Memuat ulasan...</Text>
                    ) : !reviews || reviews.length === 0 ? (
                        <Text className="text-gray-500 italic">Belum ada ulasan untuk menu ini.</Text>
                    ) : (
                        reviews.map((review: any) => (
                            <Card key={review.id} className="mb-3">
                                <View className="flex-row justify-between items-start mb-2">
                                    <View>
                                        <Text className="font-semibold text-gray-900">{review.student_name}</Text>
                                        <Text className="text-xs text-gray-500">{new Date(review.created_at).toLocaleDateString()}</Text>
                                    </View>
                                    <View className="flex-row">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <Ionicons
                                                key={star}
                                                name={star <= review.rating ? "star" : "star-outline"}
                                                size={14}
                                                color="#F59E0B"
                                            />
                                        ))}
                                    </View>
                                </View>
                                {review.comment && (
                                    <Text className="text-gray-700 text-sm mb-2">{review.comment}</Text>
                                )}
                                {review.photo_url && (
                                    <Image
                                        source={{ uri: review.photo_url }}
                                        style={{ width: '100%', height: 160, borderRadius: 8, marginTop: 4 }}
                                        contentFit="cover"
                                    />
                                )}
                            </Card>
                        ))
                    )}
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}
