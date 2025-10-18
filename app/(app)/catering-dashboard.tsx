import { Ionicons } from '@expo/vector-icons';
import { Redirect, useRouter } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { useAuth } from '../../hooks/useAuth';
export default function CateringDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  
  if (user?.role !== 'admin catering' && user?.role !== 'super admin') return <Redirect href="/" />;
  
  return (
    <ScrollView className="flex-1 bg-neutral-gray">
      <View className="p-6">
        {/* Page Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-900 mb-1">Dashboard Catering</Text>
          <Text className="text-gray-600">Operasional Menu & Kualitas Layanan</Text>
        </View>

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
            onPress={() => router.push('/(app)/page5')}
          />
        </Card>

        {/* Quality Score */}
        <Card className="mb-6">
          <Text className="text-lg font-bold text-gray-900 mb-3">Skor Kepuasan Rata-Rata (Minggu Ini)</Text>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-baseline">
              <Text className="text-6xl font-extrabold text-gray-900 mr-2">4.5</Text>
              <Text className="text-xl text-gray-600">/ 5.0</Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="star" size={28} color="#FBC02D" />
              <Ionicons name="star" size={28} color="#FBC02D" />
              <Ionicons name="star" size={28} color="#FBC02D" />
              <Ionicons name="star" size={28} color="#FBC02D" />
              <Ionicons name="star-half" size={28} color="#FBC02D" />
            </View>
          </View>
          <Text className="text-xs text-gray-500 mt-2">Berdasarkan 342 ulasan minggu ini</Text>
        </Card>

        {/* Student Feedback Highlights */}
        <Card>
          <Text className="text-lg font-bold text-gray-900 mb-4">Apa Kata Siswa?</Text>
          <View className="flex-row gap-4">
            {/* Positive Column */}
            <View className="flex-1">
              <View className="flex-row items-center mb-3">
                <View className="w-9 h-9 rounded-full items-center justify-center mr-2" style={{ backgroundColor: '#4CAF5020' }}>
                  <Ionicons name="thumbs-up" size={20} color="#4CAF50" />
                </View>
                <Text className="font-semibold text-gray-900">Komentar Terbaik</Text>
              </View>
              <View className="mb-3">
                <Text className="text-gray-700">Rasanya mantap, porsinya pas!</Text>
                <Text className="text-xs text-gray-500 mt-1">— Riska, Kelas 5B</Text>
              </View>
              <View className="mb-3">
                <Text className="text-gray-700">Buahnya segar 👍</Text>
                <Text className="text-xs text-gray-500 mt-1">— Bimo, Kelas 4A</Text>
              </View>
              <View>
                <Text className="text-gray-700">Sop ayamnya favoritku</Text>
                <Text className="text-xs text-gray-500 mt-1">— Lina, Kelas 6C</Text>
              </View>
            </View>

            {/* Needs Improvement Column */}
            <View className="flex-1">
              <View className="flex-row items-center mb-3">
                <View className="w-9 h-9 rounded-full items-center justify-center mr-2" style={{ backgroundColor: '#FBC02D20' }}>
                  <Ionicons name="alert-circle" size={20} color="#FBC02D" />
                </View>
                <Text className="font-semibold text-gray-900">Yang Perlu Diperbaiki</Text>
              </View>
              <View className="mb-3">
                <Text className="text-gray-700">Nasi agak keras</Text>
                <Text className="text-xs text-gray-500 mt-1">— Dafa, Kelas 3C</Text>
              </View>
              <View className="mb-3">
                <Text className="text-gray-700">Sup sedikit terlalu asin</Text>
                <Text className="text-xs text-gray-500 mt-1">— Tia, Kelas 5A</Text>
              </View>
              <View>
                <Text className="text-gray-700">Tolong tambahkan opsi sayur</Text>
                <Text className="text-xs text-gray-500 mt-1">— Arga, Kelas 4C</Text>
              </View>
            </View>
          </View>
        </Card>
      </View>
    </ScrollView>
  );
}