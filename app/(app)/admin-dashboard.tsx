import { Ionicons } from '@expo/vector-icons';
import { Redirect, useRouter } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import KPICard from '../../components/ui/KPICard';
import { useAuth } from '../../hooks/useAuth';

export default function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  
  if (user?.role !== 'super admin') return <Redirect href="/" />;
  
  return (
    <ScrollView className="flex-1 bg-neutral-gray">
      <View className="p-6">
        {/* Page Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-900 mb-1">Dashboard Super Admin</Text>
          <Text className="text-gray-600">Selamat datang kembali, {user?.username}</Text>
        </View>

        {/* KPI Cards Row */}
        <View className="flex-row gap-4 mb-6">
          <KPICard
            icon="people"
            iconColor="#1976D2"
            title="Pengguna Terdaftar"
            value="2,847"
            subtitle="Total pengguna aktif"
            trend="up"
          />
          <KPICard
            icon="business"
            iconColor="#4CAF50"
            title="Sekolah Aktif"
            value="156"
            subtitle="Terintegrasi sistem"
          />
          <KPICard
            icon="chatbubbles"
            iconColor="#FBC02D"
            title="Umpan Balik"
            value="12,493"
            subtitle="Total terkumpul"
            trend="up"
          />
        </View>

        {/* System Status Card */}
        <Card className="mb-6">
          <Text className="text-lg font-bold text-gray-900 mb-4">Status Sistem</Text>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="w-3 h-3 rounded-full bg-primary mr-3" />
              <View>
                <Text className="font-semibold text-gray-900">Sinkronisasi Data</Text>
                <Text className="text-sm text-gray-600">Normal - Terakhir sync 5 menit lalu</Text>
              </View>
            </View>
            <Ionicons name="checkmark-circle" size={32} color="#4CAF50" />
          </View>
          <View className="h-px bg-gray-200 my-4" />
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="w-3 h-3 rounded-full bg-primary mr-3" />
              <View>
                <Text className="font-semibold text-gray-900">Server Status</Text>
                <Text className="text-sm text-gray-600">Online - Uptime 99.8%</Text>
              </View>
            </View>
            <Ionicons name="checkmark-circle" size={32} color="#4CAF50" />
          </View>
        </Card>

        {/* Quick Actions Card */}
        <Card>
          <Text className="text-lg font-bold text-gray-900 mb-4">Aksi Cepat</Text>
          <View className="gap-3">
            <Button
              title="Kelola Pengguna"
              variant="primary"
              onPress={() => router.push('/(app)/user-management')}
            />
            <Button
              title="Buka Laporan Lengkap"
              variant="secondary"
              onPress={() => router.push('/(app)/analytics')}
            />
            <Button
              title="Lihat Kesehatan Sistem"
              variant="secondary"
              onPress={() => router.push('/(app)/system-health')}
            />
          </View>
        </Card>
      </View>
    </ScrollView>
  );
}