import { Ionicons } from '@expo/vector-icons';
import { Redirect } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import Card from '../../components/ui/Card';
import KPICard from '../../components/ui/KPICard';
import { useAuth } from '../../hooks/useAuth';

export default function DinkesDashboard() {
  const { user } = useAuth();
  if (user?.role !== 'admin dinkes' && user?.role !== 'super admin') return <Redirect href="/" />;
  
  return (
    <ScrollView className="flex-1 bg-neutral-gray">
      <View className="p-6">
        {/* Page Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-900 mb-1">Dashboard Dinas Kesehatan</Text>
          <Text className="text-gray-600">Monitoring Kesehatan & Keamanan Pangan</Text>
        </View>

        {/* Active Alerts Card - Most Prominent */}
        <Card className="mb-6 border-2 border-accent-red bg-red-50">
          <View className="items-center py-6">
            <View className="w-20 h-20 rounded-full bg-accent-red items-center justify-center mb-4">
              <Ionicons name="warning" size={48} color="#FFFFFF" />
            </View>
            <Text className="text-sm text-gray-600 mb-2">Laporan Darurat Aktif</Text>
            <Text className="text-6xl font-extrabold text-accent-red mb-3">3</Text>
            <Text className="text-gray-700 font-semibold mb-1">Kasus memerlukan perhatian segera</Text>
            <Text className="text-xs text-gray-600 text-center px-4">2 kasus keracunan ringan, 1 alergi makanan</Text>
          </View>
        </Card>

        {/* KPI Cards */}
        <View className="flex-row gap-4 mb-6">
          <KPICard
            icon="school"
            iconColor="#1976D2"
            title="Sekolah Dipantau"
            value="156"
            subtitle="Aktif hari ini"
          />
          <KPICard
            icon="people"
            iconColor="#4CAF50"
            title="Siswa Terlayani"
            value="18,542"
            subtitle="Makan bergizi"
            trend="up"
          />
        </View>

        {/* Negative Feedback Trends */}
        <Card className="mb-6">
          <Text className="text-lg font-bold text-gray-900 mb-4">Sekolah dengan Umpan Balik Negatif Terbanyak (7 Hari Terakhir)</Text>
          
          {/* School Item 1 */}
          <View className="flex-row items-center justify-between mb-4 pb-4 border-b border-gray-200">
            <View className="flex-1">
              <Text className="font-semibold text-gray-900 mb-1">SDN Melati 03</Text>
              <Text className="text-sm text-gray-600">Kec. Tanah Sareal, Bogor</Text>
            </View>
            <View className="items-end">
              <Text className="text-2xl font-bold text-accent-red">28</Text>
              <Text className="text-xs text-gray-600">laporan</Text>
            </View>
          </View>

          {/* School Item 2 */}
          <View className="flex-row items-center justify-between mb-4 pb-4 border-b border-gray-200">
            <View className="flex-1">
              <Text className="font-semibold text-gray-900 mb-1">SDN Cibuluh 01</Text>
              <Text className="text-sm text-gray-600">Kec. Bogor Utara, Bogor</Text>
            </View>
            <View className="items-end">
              <Text className="text-2xl font-bold text-accent-red">21</Text>
              <Text className="text-xs text-gray-600">laporan</Text>
            </View>
          </View>

          {/* School Item 3 */}
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="font-semibold text-gray-900 mb-1">SDN Cipaku 02</Text>
              <Text className="text-sm text-gray-600">Kec. Bogor Selatan, Bogor</Text>
            </View>
            <View className="items-end">
              <Text className="text-2xl font-bold text-accent-red">19</Text>
              <Text className="text-xs text-gray-600">laporan</Text>
            </View>
          </View>
        </Card>

        {/* Sentiment Overview */}
        <Card>
          <Text className="text-lg font-bold text-gray-900 mb-4">Sentimen Umpan Balik Umum</Text>
          
          <View className="mb-6">
            {/* Positive Bar */}
            <View className="flex-row items-center mb-3">
              <View className="flex-1 mr-3">
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-sm font-semibold text-gray-900">Positif</Text>
                  <Text className="text-sm font-bold text-primary">80%</Text>
                </View>
                <View className="h-6 bg-gray-200 rounded-full overflow-hidden">
                  <View className="h-full bg-primary rounded-full" style={{ width: '80%' }} />
                </View>
              </View>
              <Ionicons name="happy" size={32} color="#4CAF50" />
            </View>

            {/* Neutral Bar */}
            <View className="flex-row items-center mb-3">
              <View className="flex-1 mr-3">
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-sm font-semibold text-gray-900">Netral</Text>
                  <Text className="text-sm font-bold text-gray-600">12%</Text>
                </View>
                <View className="h-6 bg-gray-200 rounded-full overflow-hidden">
                  <View className="h-full bg-gray-400 rounded-full" style={{ width: '12%' }} />
                </View>
              </View>
              <Ionicons name="remove-circle" size={32} color="#9CA3AF" />
            </View>

            {/* Negative Bar */}
            <View className="flex-row items-center">
              <View className="flex-1 mr-3">
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-sm font-semibold text-gray-900">Negatif</Text>
                  <Text className="text-sm font-bold text-accent-red">8%</Text>
                </View>
                <View className="h-6 bg-gray-200 rounded-full overflow-hidden">
                  <View className="h-full bg-accent-red rounded-full" style={{ width: '8%' }} />
                </View>
              </View>
              <Ionicons name="sad" size={32} color="#E53935" />
            </View>
          </View>

          <Text className="text-xs text-gray-500 italic text-center">Data dari 12,493 umpan balik di 156 sekolah</Text>
        </Card>
      </View>
    </ScrollView>
  );
}