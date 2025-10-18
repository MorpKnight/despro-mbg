import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Redirect } from 'expo-router';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import Card from '../../components/ui/Card';
import { useAuth } from '../../hooks/useAuth';

type Sentiment = 'positive' | 'neutral' | 'negative';

interface FeedbackItem {
  id: string;
  date: string; // ISO
  sentiment: Sentiment;
  menu: string;
  comment?: string;
  photoUrl?: string;
  emoji: string; // e.g., 😊, 🙁, 😍
}

export default function FeedbackListPage() {
  const { user } = useAuth();
  const [onlyNegative, setOnlyNegative] = React.useState(false);
  const [start, setStart] = React.useState<Date>(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000));
  const [end, setEnd] = React.useState<Date>(new Date());
  if (user?.role !== 'admin sekolah' && user?.role !== 'super admin') return <Redirect href="/" />;

  const all: FeedbackItem[] = [
    { id: 'f1', date: new Date().toISOString(), sentiment: 'positive', menu: 'Sop Ayam', comment: 'Mantap!', emoji: '😊' },
    { id: 'f2', date: new Date().toISOString(), sentiment: 'negative', menu: 'Nasi Putih', comment: 'Agak keras', emoji: '🙁' },
    { id: 'f3', date: new Date().toISOString(), sentiment: 'neutral', menu: 'Buah Semangka', emoji: '😐', photoUrl: 'https://picsum.photos/seed/mbg/120/80' },
  ];

  const inRange = (iso: string) => {
    const d = new Date(iso).getTime();
    return d >= start.getTime() && d <= end.getTime();
  };

  const list = all.filter((f) => inRange(f.date) && (!onlyNegative || f.sentiment === 'negative'));

  const fmt = (iso: string) => new Date(iso).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const shift = (which: 'start' | 'end', days: number) => {
    if (which === 'start') setStart((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + days));
    else setEnd((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + days));
  };

  return (
    <ScrollView className="flex-1 bg-neutral-gray">
      <View className="p-6">
        <View className="mb-4">
          <Text className="text-2xl font-bold text-gray-900">Umpan Balik Siswa</Text>
        </View>

        {/* Filters */}
        <Card className="mb-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-sm text-gray-600 mb-1">Rentang Tanggal</Text>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <Ionicons name="calendar-outline" size={16} color="#1976D2" />
                  <Text className="font-semibold text-gray-900">{start.toLocaleDateString('id-ID')}</Text>
                  <Ionicons name="chevron-back" size={18} color="#374151" onPress={() => shift('start', -1)} />
                  <Ionicons name="chevron-forward" size={18} color="#374151" onPress={() => shift('start', 1)} />
                </View>
                <Text className="text-gray-400">—</Text>
                <View className="flex-row items-center gap-2">
                  <Ionicons name="calendar-outline" size={16} color="#1976D2" />
                  <Text className="font-semibold text-gray-900">{end.toLocaleDateString('id-ID')}</Text>
                  <Ionicons name="chevron-back" size={18} color="#374151" onPress={() => shift('end', -1)} />
                  <Ionicons name="chevron-forward" size={18} color="#374151" onPress={() => shift('end', 1)} />
                </View>
              </View>
            </View>
            <View className="flex-row items-center gap-2">
              <Ionicons name={onlyNegative ? 'filter' : 'filter-outline'} size={18} color={onlyNegative ? '#1976D2' : '#6B7280'} />
              <Text
                className="text-[13px] font-semibold"
                style={{ color: onlyNegative ? '#1976D2' : '#6B7280' }}
                onPress={() => setOnlyNegative((v) => !v)}
              >
                Tampilkan Hanya Negatif
              </Text>
            </View>
          </View>
        </Card>

        {/* List */}
        {list.length === 0 ? (
          <View className="items-center justify-center py-12">
            <Ionicons name="chatbubble-ellipses-outline" size={40} color="#9CA3AF" />
            <Text className="text-gray-500 mt-2 text-center">Tidak ada umpan balik yang ditemukan untuk kriteria ini.</Text>
          </View>
        ) : (
          <View className="gap-3">
            {list.map((f) => (
              <Card key={f.id} className="p-4">
                <View className="flex-row items-start gap-3">
                  <Text className="text-2xl leading-none">{f.emoji}</Text>
                  <View className="flex-1">
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="font-semibold text-gray-900">{f.menu}</Text>
                      <Text className="text-xs text-gray-500">{fmt(f.date)}</Text>
                    </View>
                    {f.comment && <Text className="italic text-gray-700">{f.comment}</Text>}
                    {f.photoUrl && (
                      <View className="mt-2">
                        <Image source={{ uri: f.photoUrl }} style={{ width: 120, height: 80, borderRadius: 8 }} contentFit="cover" />
                      </View>
                    )}
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
