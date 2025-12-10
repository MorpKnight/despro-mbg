import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import EmojiRating from '../../components/features/feedback/EmojiRating';
import UploadImage from '../../components/ui/UploadImage';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { Chip } from '../../components/ui/Chip';
import LoadingState from '../../components/ui/LoadingState';
import PageHeader from '../../components/ui/PageHeader';
import TextInput from '../../components/ui/TextInput';
import { useAuthContext } from '../../context/AuthContext';
import { useOfflineMutation } from '../../hooks/useOfflineMutation';
import { useSnackbar } from '../../hooks/useSnackbar';
import { submitFeedback, type FeedbackItem, type FeedbackRating, type SubmitFeedbackPayload } from '../../services/feedback';

export default function PortalFeedback() {
  const { user } = useAuthContext();
  const [selectedCategory, setSelectedCategory] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [rating, setRating] = useState<number>(0);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { showSnackbar } = useSnackbar();

 const { mutate: sendFeedback } = useOfflineMutation({
  mutationFn: (variables) => submitFeedback(variables),
  endpoint: "feedback/",
  method: "POST",
  serializeBody: (payload) => {
    const form = new FormData();

    form.append("rating", String(payload.rating));

    if (payload.comment) form.append("comment", payload.comment);
    if (payload.menuId) form.append("menu_id", String(payload.menuId));
    if (payload.photoUrl) form.append("photo_url", payload.photoUrl);

    return form;
  },
    onSuccess: () => showSnackbar({ message: 'Masukan berhasil dikirim.', variant: 'success' }),
    onError: (error) => showSnackbar({
      message: error instanceof Error ? error.message : 'Tidak dapat mengirim masukan',
      variant: 'error',
    }),
    onQueuedMessage: 'Masukan tersimpan offline dan akan terkirim otomatis ketika online.',
  });

  useEffect(() => {
    if (user && user.role !== 'siswa') {
      Alert.alert(
        'Akses Ditolak',
        'Halaman ini hanya dapat diakses oleh siswa.',
        [
          { text: 'OK', onPress: () => router.back() },
        ]
      );
    }
  }, [user]);

  useEffect(() => {
  if (photoUrl !== null) {
    console.log("[STATE] photoUrl updated =", photoUrl);
  }
}, [photoUrl]);


  const categories = useMemo(
    () => [
      { id: 'makanan', label: 'Makanan' },
      { id: 'transportasi', label: 'Transportasi' },
      { id: 'kontainer', label: 'Kontainer' },
      { id: 'lainnya', label: 'Lainnya' },
    ],
    [],
  );

  const categoryLabel = useMemo(
    () => categories.find((category) => category.id === selectedCategory)?.label,
    [categories, selectedCategory],
  );

  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    if (!selectedCategory || !title || !description) {
      Alert.alert('Error', 'Mohon lengkapi semua field');
      return;
    }
    if (!rating || rating < 1) {
      Alert.alert('Error', 'Mohon pilih rating 1-5.');
      return;
    }

    const commentParts = [title, description];
    if (categoryLabel) commentParts.unshift(`Kategori: ${categoryLabel}`);
    const commentText = commentParts.filter(Boolean).join(' — ');

    setSubmitting(true);
    const payload: SubmitFeedbackPayload = {
      rating: Math.min(Math.max(rating, 1), 5) as FeedbackRating,
      comment: commentText,
      photoUrl: photoUrl || undefined,
    };
    try {
      const sendPromise = sendFeedback(payload);
      setTitle('');
      setDescription('');
      setSelectedCategory('');
      setRating(0);
      setPhotoUrl(null);
      await sendPromise;
      Alert.alert('Berhasil', 'Masukan Anda diterima.');
    } catch (err: any) {
      console.warn('[feedback] submit failed', err);
      const rawMessage = String(err?.message || '');
      Alert.alert('Gagal', rawMessage || 'Tidak dapat mengirim masukan saat ini.');
    } finally {
      setSubmitting(false);
    }
  }, [categoryLabel, description, photoUrl, rating, selectedCategory, sendFeedback, submitting, title]);

  if (!user || user.role !== 'siswa') {
    return <LoadingState message="Memuat..." />;
  }

  const handleDownload = () => {
    Alert.alert('Download', 'Mengunduh semua masukan...');
  };

  const allMasukan = [
    { id: '#001', title: 'Kualitas Makanan', category: 'Makanan', time: '2 hari yang lalu', description: 'Perlu peningkatan kualitas makanan terutama nasi' },
    { id: '#002', title: 'Jadwal Pengiriman', category: 'Transportasi', time: '3 hari yang lalu', description: 'Mohon diperbaiki jadwal bus yang sering terlambat...' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-[#f5f7fb]">
      <ScrollView className="flex-1">
        <View className="p-6">
          <PageHeader
            title="Kirim Masukan"
            subtitle="Sampaikan kritik dan saran Anda"
            showBackButton={true}
            className="mb-6"
          />

          <Card className="mb-6 p-6">
            <View className="mb-5">
              <Text className="block mb-3 font-medium text-gray-600">Kategori Masukan</Text>
              <View className="flex-row flex-wrap gap-2">
                {categories.map((category) => (
                  <Chip
                    key={category.id}
                    label={category.label}
                    active={selectedCategory === category.id}
                    onPress={() => setSelectedCategory(category.id)}
                  />
                ))}
              </View>
            </View>

            <View className="mb-5">
              <Text className="block mb-3 font-medium text-gray-600">Judul Masukan</Text>
              <TextInput
                placeholder="Masukkan judul singkat..."
                value={title}
                onChangeText={setTitle}
              />
            </View>

            <View className="mb-5">
              <Text className="block mb-3 font-medium text-gray-600">Rating</Text>
              <EmojiRating value={rating} onChange={setRating} />
            </View>

            <View className="mb-5">
              <Text className="block mb-3 font-medium text-gray-600">Deskripsi</Text>
              <TextInput
                placeholder="Tuliskan masukan Anda secara detail..."
                multiline
                value={description}
                onChangeText={setDescription}
                className="min-h-[100px] py-3"
                textAlignVertical="top"
              />
            </View>

            <View className="mb-8">
              <UploadImage
                label="Lampirkan Foto (opsional)"
                onUploaded={(url) => setPhotoUrl(url)}
                disabled={submitting}
              />
            </View>

            <Button
              title={submitting ? 'Mengirim…' : 'Kirim Masukan'}
              onPress={handleSubmit}
              loading={submitting}
              fullWidth
            />
          </Card>
          

          <Card className="mb-6 p-6">
            <View className="flex-row justify-between items-center mb-5">
              <Text className="text-xl font-semibold text-gray-800">Semua Masukan</Text>
              <Button
                title="Unduh Semua"
                onPress={handleDownload}
                size="sm"
                variant="secondary"
                icon={<Text className="text-gray-900 mr-1">⬇</Text>}
              />
            </View>

            {allMasukan.map((item) => (
              <View
                key={item.id}
                className="bg-gray-50 rounded-lg p-4 mb-3 border border-gray-200 relative"
              >
                <Text className="absolute top-4 right-4 text-xs text-gray-400 font-medium bg-white px-2 py-1 rounded border border-gray-100">
                  {item.id}
                </Text>
                <View className="flex-row items-start gap-3 mb-2">
                  <View className="w-8 h-8 bg-gray-200 rounded-full items-center justify-center flex-shrink-0 mt-0.5">
                    <Text className="text-gray-500 text-xs">IMG</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="font-semibold text-base text-gray-800 mb-1">
                      {item.title}
                    </Text>
                    <Text className="text-sm text-gray-500 mb-2">
                      {item.category} • {item.time}
                    </Text>
                    <Text className="text-sm text-gray-600 leading-5">
                      {item.description}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}