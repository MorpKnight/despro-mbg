import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import EmojiRating from '../../components/features/feedback/EmojiRating';
import UploadImage from '../../components/ui/UploadImage'; // [BARU] Import komponen
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
  
  // [UBAH] State sekarang menyimpan string URL, bukan object asset
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  
  const [submitting, setSubmitting] = useState(false);
  const { showSnackbar } = useSnackbar();

  const { mutate: sendFeedback } = useOfflineMutation<SubmitFeedbackPayload, FeedbackItem>({
    mutationFn: (variables) => submitFeedback(variables),
    endpoint: 'feedback/',
    method: 'POST',
    serializeBody: (payload) => {
      const body: Record<string, any> = { rating: payload.rating };
      if (payload.comment) body.comment = payload.comment;
      if (payload.menuId) body.menu_id = payload.menuId;
      if (payload.photoUrl) body.photo_url = payload.photoUrl;
      return body;
    },
    onSuccess: () => showSnackbar({ message: 'Masukan berhasil dikirim.', variant: 'success' }),
    onError: (error) => showSnackbar({
      message: error instanceof Error ? error.message : 'Tidak dapat mengirim masukan',
      variant: 'error',
    }),
    onQueuedMessage: 'Masukan tersimpan offline dan akan terkirim otomatis ketika online.',
  });

  // Proteksi akses - hanya siswa yang bisa mengakses
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
      // Optimistic reset
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
    return (
      <View className="flex-1 bg-gray-100 justify-center items-center">
        <Text className="text-gray-600">Memuat...</Text>
      </View>
    );
  }

  const handleDownload = () => {
    Alert.alert('Download', 'Mengunduh semua masukan...');
  };

  // Data dummy (tidak berubah)
  const allMasukan = [
    { id: '#001', title: 'Kualitas Makanan', category: 'Makanan', time: '2 hari yang lalu', description: 'Perlu peningkatan kualitas makanan terutama nasi' },
    { id: '#002', title: 'Jadwal Pengiriman', category: 'Transportasi', time: '3 hari yang lalu', description: 'Mohon diperbaiki jadwal bus yang sering terlambat...' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-[#f5f7fb]">
      <ScrollView className="flex-1 bg-gray-100">
        <View className="max-w-sm mx-auto p-5">
          {/* Form Kirim Masukan */}
          <View className="bg-white rounded-xl p-6 mb-6 shadow-sm border border-gray-200">
            <Text className="text-xl font-semibold mb-5 text-gray-800">Kirim Masukan</Text>

            {/* Kategori */}
            <View className="mb-5">
              <Text className="block mb-3 font-medium text-gray-600">Kategori Masukan</Text>
              <View className="flex-col gap-3">
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    className="flex-row items-center gap-2"
                    onPress={() => setSelectedCategory(category.id)}
                  >
                    <View
                      className={`w-4 h-4 rounded-full border-2 ${
                        selectedCategory === category.id ? 'bg-gray-800 border-gray-800' : 'border-gray-300'
                      }`}
                    >
                      {selectedCategory === category.id && (
                        <View className="w-2 h-2 bg-white rounded-full m-0.5" />
                      )}
                    </View>
                    <Text className="text-gray-800">{category.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Judul */}
            <View className="mb-5">
              <Text className="block mb-3 font-medium text-gray-600">Judul Masukan</Text>
              <TextInput
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base bg-gray-50 focus:border-gray-800 focus:bg-white"
                placeholder="Masukkan judul singkat..."
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* Rating */}
            <View className="mb-5">
              <Text className="block mb-3 font-medium text-gray-600">Rating</Text>
              <EmojiRating value={rating} onChange={setRating} />
            </View>

            {/* Deskripsi */}
            <View className="mb-5">
              <Text className="block mb-3 font-medium text-gray-600">Deskripsi</Text>
              <TextInput
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base bg-gray-50 min-h-24 focus:border-gray-800 focus:bg-white"
                placeholder="Tuliskan masukan Anda secara detail..."
                multiline
                value={description}
                onChangeText={setDescription}
              />
            </View>

            {/* [UBAH] Upload Photo menggunakan UploadImage */}
            <View className="mb-8">
              <UploadImage 
                label="Lampirkan Foto (opsional)" 
                onUploaded={(url) => setPhotoUrl(url)}
                disabled={submitting}
              />
              {/* Jika URL sudah ada (misal ingin reset manual, bisa ditambahkan logic reset, 
                  tapi UploadImage bawaan sudah menampilkan preview) */}
            </View>

            <TouchableOpacity
              className={`w-full py-4 rounded-lg ${submitting ? 'opacity-70' : ''}`}
              style={{ backgroundColor: '#000000' }}
              onPress={handleSubmit}
              disabled={submitting}
            >
              <Text className="text-white text-base font-semibold text-center">
                {submitting ? 'Mengirim…' : 'Kirim Masukan'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* List Masukan (Static) */}
          <View className="bg-white rounded-xl p-6 mb-6 shadow-sm border border-gray-200">
            <View className="flex-row justify-between items-center mb-5">
              <Text className="text-xl font-semibold text-gray-800">Semua Masukan</Text>
              <TouchableOpacity
                className="px-4 py-2 rounded-md flex-row items-center gap-1.5"
                style={{ backgroundColor: '#000000' }}
                onPress={handleDownload}
              >
                <Text className="text-white text-sm">⬇</Text>
                <Text className="text-white text-sm">Unduh Semua</Text>
              </TouchableOpacity>
            </View>

            {allMasukan.map((item) => (
              <View
                key={item.id}
                className="bg-white rounded-lg p-4 mb-3 border border-gray-200 relative shadow-sm"
              >
                <Text className="absolute top-4 right-4 text-xs text-gray-400 font-medium bg-gray-100 px-2 py-1 rounded">
                  {item.id}
                </Text>
                <View className="flex-row items-start gap-3 mb-2">
                  <View className="w-6 h-6 bg-gray-600 rounded flex-shrink-0 mt-0.5" />
                  <View className="flex-1">
                    <Text className="font-semibold text-base text-gray-800 mb-1">
                      {item.title}
                    </Text>
                    <Text className="text-sm text-gray-600 mb-2">
                      {item.category} • {item.time}
                    </Text>
                    <Text className="text-sm text-gray-600 leading-5">
                      {item.description}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}