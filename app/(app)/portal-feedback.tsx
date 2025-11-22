import { Image } from 'expo-image';
import { launchImageLibraryAsync, MediaTypeOptions, requestMediaLibraryPermissionsAsync } from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import EmojiRating from '../../components/features/feedback/EmojiRating';
import { useAuthContext } from '../../context/AuthContext';
import { submitFeedback, type FeedbackRating } from '../../services/feedback';

export default function PortalFeedback() {
  const { user } = useAuthContext();
  const [selectedCategory, setSelectedCategory] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [rating, setRating] = useState<number>(0);
  const [photo, setPhoto] = useState<{ uri: string; name?: string; type?: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Proteksi akses - hanya siswa yang bisa mengakses
  useEffect(() => {
    if (user && user.role !== 'siswa') {
      Alert.alert(
        'Akses Ditolak',
        'Halaman ini hanya dapat diakses oleh siswa.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
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
    const comment = commentParts.filter(Boolean).join(' — ');

    setSubmitting(true);
    try {
      await submitFeedback({
        rating: Math.min(Math.max(rating, 1), 5) as FeedbackRating,
        comment,
        photo: photo || undefined,
      });
      Alert.alert('Berhasil', 'Masukan berhasil dikirim!');
      setTitle('');
      setDescription('');
      setSelectedCategory('');
      setRating(0);
      setPhoto(null);
    } catch (err: any) {
      console.warn('[feedback] submit failed', err);
      const rawMessage = String(err?.message || '');
      Alert.alert('Gagal', rawMessage || 'Tidak dapat mengirim masukan saat ini.');
    } finally {
      setSubmitting(false);
    }
  }, [categoryLabel, description, photo, rating, selectedCategory, submitting, title]);

  // Jika bukan siswa, jangan render konten
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

  async function handlePickImage() {
    // Request permission (mostly for native)
    const perm = await requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted' && perm.canAskAgain === false) {
      Alert.alert('Izin diperlukan', 'Akses galeri dibutuhkan untuk memilih foto.');
      return;
    }
    try {
      const result = await launchImageLibraryAsync({
        mediaTypes: MediaTypeOptions.Images,
        allowsMultipleSelection: false,
        quality: 0.7,
        selectionLimit: 1,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setPhoto({
          uri: asset.uri,
          name: asset.fileName ?? asset.uri.split('/').pop() ?? `feedback-${Date.now()}.jpg`,
          type: asset.mimeType ?? 'image/jpeg',
        });
      }
    } catch (e) {
      console.log('[feedback] image pick error', e);
    }
  }

  // Data dummy untuk semua masukan
  const allMasukan = [
    {
      id: '#001',
      title: 'Kualitas Makanan',
      category: 'Makanan',
      time: '2 hari yang lalu',
      description: 'Perlu peningkatan kualitas makanan terutama nasi'
    },
    {
      id: '#002',
      title: 'Jadwal Pengiriman',
      category: 'Transportasi',
      time: '3 hari yang lalu',
      description: 'Mohon diperbaiki jadwal bus yang sering terlambat...'
    },
    {
      id: '#003',
      title: 'Lorem Ipsum',
      category: 'Kontainer',
      time: '1 minggu yang lalu',
      description: 'Lorem ipsum dolor sit amet'
    },
    {
      id: '#004',
      title: 'Lorem Ipsum',
      category: 'Lainnya',
      time: '1 minggu yang lalu',
      description: 'Lorem ipsum dolor sit amet'
    },
    {
      id: '#005',
      title: 'Lorem Ipsum',
      category: 'Transportasi',
      time: '2 minggu yang lalu',
      description: 'Lorem ipsum dolor sit amet'
    }
  ];

  return (
    <SafeAreaView className="flex-1 bg-[#f5f7fb]">
    <ScrollView className="flex-1 bg-gray-100">
      <View className="max-w-sm mx-auto p-5">
        {/* Form Kirim Masukan */}
        <View className="bg-white rounded-xl p-6 mb-6 shadow-sm border border-gray-200">
          <Text className="text-xl font-semibold mb-5 text-gray-800">Kirim Masukan</Text>

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
                      selectedCategory === category.id
                        ? 'bg-gray-800 border-gray-800'
                        : 'border-gray-300'
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

          {/* Upload Photo */}
          <View className="mb-5">
            <Text className="block mb-3 font-medium text-gray-600">Lampirkan Foto (opsional)</Text>
            <View className="flex-row items-center gap-3">
              <TouchableOpacity
                className="px-4 py-2 rounded-md"
                style={{ backgroundColor: '#000000' }}
                onPress={handlePickImage}
              >
                <Text className="text-white">Tambah Foto</Text>
              </TouchableOpacity>
              {photo && (
                <TouchableOpacity
                  className="px-3 py-2 border border-gray-300 rounded-md"
                  onPress={() => setPhoto(null)}
                >
                  <Text className="text-gray-700">Hapus Gambar</Text>
                </TouchableOpacity>
              )}
            </View>
            {photo && (
              <View className="mt-3">
                <Image
                  source={{ uri: photo.uri }}
                  contentFit="cover"
                  className="w-24 h-24 rounded-md border border-gray-200"
                />
              </View>
            )}
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

        {/* Semua Masukan */}
        <View className="bg-white rounded-xl p-6 mb-6 shadow-sm border border-gray-200">
          <View className="flex-row justify-between items-center mb-5">
            <Text className="text-xl font-semibold text-gray-800">
              Semua Masukan
            </Text>
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

        {/* Paginasi */}
        <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <View className="flex-row justify-center items-center gap-2">
            <TouchableOpacity className="px-3 py-2 border border-gray-300 rounded">
              <Text className="text-gray-600">{'<'}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              className="px-3 py-2 rounded"
              style={{ backgroundColor: '#000000' }}
            >
              <Text className="text-white font-semibold">1</Text>
            </TouchableOpacity>
            <TouchableOpacity className="px-3 py-2 border border-gray-300 rounded">
              <Text className="text-gray-600">2</Text>
            </TouchableOpacity>
            <TouchableOpacity className="px-3 py-2 border border-gray-300 rounded">
              <Text className="text-gray-600">3</Text>
            </TouchableOpacity>
            <Text className="text-gray-600 px-2">...</Text>
            <TouchableOpacity className="px-3 py-2 border border-gray-300 rounded">
              <Text className="text-gray-600">10</Text>
            </TouchableOpacity>
            <TouchableOpacity className="px-3 py-2 border border-gray-300 rounded">
              <Text className="text-gray-600">{'>'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View className="mt-8 mb-4">
          <Text className="text-center text-gray-500 text-sm">
            © 2025 Portal Masukan Kampus
          </Text>
        </View>
      </View>
    </ScrollView>
    </SafeAreaView>
  );
}
