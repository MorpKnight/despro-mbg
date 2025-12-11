import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, Text, View, Image } from 'react-native';
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
import { submitFeedback, fetchFeedbackList, type FeedbackItem, type FeedbackRating, type SubmitFeedbackPayload } from '../../services/feedback';

export default function PortalFeedback() {
  const { user } = useAuthContext();
  const [selectedCategory, setSelectedCategory] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [rating, setRating] = useState<number>(0);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [allMasukan, setAllMasukan] = useState<FeedbackItem[]>([]);
  const [loadingMasukan, setLoadingMasukan] = useState(true);
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

  // Fungsi untuk memuat semua masukan
  const loadAllMasukan = useCallback(async () => {
    if (!user || user.role !== 'siswa') return;
    
    setLoadingMasukan(true);
    try {
      // Untuk student, backend otomatis filter berdasarkan current_user.id
      // Tidak perlu kirim schoolId karena backend akan mengabaikannya
      const data = await fetchFeedbackList({});
      setAllMasukan(data);
    } catch (err: any) {
      console.warn('[portal-feedback] failed to load masukan', err);
      setAllMasukan([]);
    } finally {
      setLoadingMasukan(false);
    }
  }, [user]);

  // Load masukan saat component mount
  useEffect(() => {
    loadAllMasukan();
  }, [loadAllMasukan]);

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
    
    // Simpan data untuk optimistik update
    const tempId = `temp-${Date.now()}`;
    const tempMasukan: FeedbackItem = {
      id: tempId,
      rating: payload.rating,
      comment: commentText,
      menuId: null,
      photoUrl: photoUrl || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      student: {
        id: user?.id || '',
        fullName: user?.fullName || null,
        username: user?.username || '',
      },
    };
    
    try {
      // Clear form terlebih dahulu
      setTitle('');
      setDescription('');
      setSelectedCategory('');
      setRating(0);
      setPhotoUrl(null);
      
      // Tambahkan masukan secara optimistik ke list
      setAllMasukan((prev) => [tempMasukan, ...prev]);
      
      const result = await sendFeedback(payload);
      
      // Jika submit berhasil dan mengembalikan hasil, ganti temp item dengan hasil real
      if (result) {
        setAllMasukan((prev) => {
          const filtered = prev.filter((item) => item.id !== tempId);
          return [result, ...filtered];
        });
      }
      
      // Refresh data masukan setelah submit berhasil (dengan delay untuk memastikan backend sudah commit)
      // Delay lebih panjang jika offline untuk memastikan sync selesai
      const refreshDelay = result ? 500 : 1500;
      setTimeout(async () => {
        await loadAllMasukan();
      }, refreshDelay);
      
      Alert.alert('Berhasil', 'Masukan Anda diterima.');
    } catch (err: any) {
      // Hapus temp item jika gagal
      setAllMasukan((prev) => prev.filter((item) => item.id !== tempId));
      
      console.warn('[feedback] submit failed', err);
      const rawMessage = String(err?.message || '');
      Alert.alert('Gagal', rawMessage || 'Tidak dapat mengirim masukan saat ini.');
    } finally {
      setSubmitting(false);
    }
  }, [categoryLabel, description, photoUrl, rating, selectedCategory, sendFeedback, submitting, title, loadAllMasukan, user]);

  if (!user || user.role !== 'siswa') {
    return <LoadingState message="Memuat..." />;
  }

  const handleDownload = () => {
    Alert.alert('Download', 'Mengunduh semua masukan...');
  };

  // Helper function untuk format tanggal
  const formatTime = useCallback((isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hari ini';
    if (diffDays === 1) return 'Kemarin';
    if (diffDays < 7) return `${diffDays} hari yang lalu`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} minggu yang lalu`;
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  }, []);

  // Helper function untuk extract kategori dari comment
  const extractCategory = useCallback((comment: string | null): string => {
    if (!comment) return 'Lainnya';
    const match = comment.match(/Kategori:\s*(\w+)/);
    if (match) return match[1];
    return 'Lainnya';
  }, []);

  // Helper function untuk extract title dan description dari comment
  const parseComment = useCallback((comment: string | null) => {
    if (!comment) return { title: 'Masukan', description: '' };
    
    // Format: "Kategori: X — Title — Description"
    const parts = comment.split(' — ');
    if (parts.length >= 3) {
      return { title: parts[1], description: parts.slice(2).join(' — ') };
    }
    if (parts.length === 2) {
      return { title: parts[0].replace(/^Kategori:\s*\w+\s*/, ''), description: parts[1] };
    }
    return { title: comment.substring(0, 50), description: comment };
  }, []);

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

            {loadingMasukan ? (
              <View className="py-4 items-center">
                <Text className="text-gray-500">Memuat masukan...</Text>
              </View>
            ) : allMasukan.length === 0 ? (
              <View className="py-4 items-center">
                <Text className="text-gray-500">Belum ada masukan</Text>
              </View>
            ) : (
              allMasukan.map((item) => {
                const { title: itemTitle, description: itemDescription } = parseComment(item.comment);
                const category = extractCategory(item.comment);
                const timeText = formatTime(item.createdAt);
                
                return (
                  <View
                    key={item.id}
                    className="bg-gray-50 rounded-lg p-4 mb-3 border border-gray-200 relative"
                  >
                    <Text className="absolute top-4 right-4 text-xs text-gray-400 font-medium bg-white px-2 py-1 rounded border border-gray-100">
                      {item.id.substring(0, 8)}...
                    </Text>
                    <View className="flex-row items-start gap-3 mb-2">
                      {item.photoUrl ? (
                        <Image
                          source={{ uri: item.photoUrl }}
                          className="w-8 h-8 rounded-full"
                          resizeMode="cover"
                        />
                      ) : (
                        <View className="w-8 h-8 bg-gray-200 rounded-full items-center justify-center flex-shrink-0 mt-0.5">
                          <Text className="text-gray-500 text-xs">IMG</Text>
                        </View>
                      )}
                      <View className="flex-1">
                        <Text className="font-semibold text-base text-gray-800 mb-1">
                          {itemTitle}
                        </Text>
                        <Text className="text-sm text-gray-500 mb-2">
                          {category} • {timeText}
                        </Text>
                        <Text className="text-sm text-gray-600 leading-5">
                          {itemDescription}
                        </Text>
                        {/* Tampilkan rating */}
                        <View className="flex-row items-center gap-1 mt-2">
                          {Array.from({ length: 5 }).map((_, index) => (
                            <Text key={index} className="text-yellow-500">
                              {index < item.rating ? '★' : '☆'}
                            </Text>
                          ))}
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}