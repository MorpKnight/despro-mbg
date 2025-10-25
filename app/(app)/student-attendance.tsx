import { Ionicons } from '@expo/vector-icons';
import { Link, Redirect } from 'expo-router';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import Button from '../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';
export default function StudentAttendancePage() {
  const { user } = useAuth();
  const [date, setDate] = React.useState(new Date('2025-10-18'));
  if (user?.role !== 'admin sekolah' && user?.role !== 'super admin') return <Redirect href="/" />;

  // Dummy data for 3 days
  const allData: Record<string, { id: string; name: string; kelas: string; status: 'HADIR' | 'BELUM_HADIR'; time?: string }[]> = {
    '2025-10-18': [
      { id: '1', name: 'Ahmad Rizki', kelas: '5A', status: 'HADIR', time: '09:12 WIB' },
      { id: '2', name: 'Siti Nurhaliza', kelas: '4B', status: 'BELUM_HADIR' },
      { id: '3', name: 'Budi Santoso', kelas: '6C', status: 'HADIR', time: '09:25 WIB' },
      { id: '4', name: 'Lina Puspa', kelas: '6C', status: 'HADIR', time: '09:18 WIB' },
      { id: '5', name: 'Rangga', kelas: '3A', status: 'BELUM_HADIR' },
      { id: '6', name: 'Dafa', kelas: '3C', status: 'HADIR', time: '09:30 WIB' },
      { id: '7', name: 'Tia', kelas: '5A', status: 'BELUM_HADIR' },
    ],
    '2025-10-17': [
      { id: '8', name: 'Arga', kelas: '4C', status: 'HADIR', time: '09:10 WIB' },
      { id: '9', name: 'Riska', kelas: '5B', status: 'HADIR', time: '09:15 WIB' },
      { id: '10', name: 'Bimo', kelas: '4A', status: 'BELUM_HADIR' },
    ],
    '2025-10-16': [], // Empty state
  };

  const fmt = (d: Date) => d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const key = date.toISOString().slice(0, 10);
  const data = allData[key] || [];
  const hadirCount = data.filter((d) => d.status === 'HADIR').length;
  const belumCount = data.filter((d) => d.status === 'BELUM_HADIR').length;
  const prevDay = () => setDate((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1));
  const nextDay = () => setDate((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1));

  return (
    <SafeAreaView className="flex-1 bg-[#f5f7fb]">
    <ScrollView className="flex-1 bg-neutral-gray">
      <View className="p-6">
        <View className="mb-4">
          <Text className="text-2xl font-bold text-gray-900">Absensi Makan Harian</Text>
        </View>
        <View className="mb-4 flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <View className="w-9 h-9 rounded-full items-center justify-center" style={{ backgroundColor: '#1976D220' }}>
              <Ionicons name="calendar-outline" size={18} color="#1976D2" />
            </View>
            <Text className="text-gray-900 font-semibold">{fmt(date)}</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Ionicons name="chevron-back" size={22} color="#374151" onPress={prevDay} />
            <Ionicons name="chevron-forward" size={22} color="#374151" onPress={nextDay} />
          </View>
        </View>
        <View className="mb-4">
          <Link href="/(app)/attendance-scan" asChild>
            <Button title="Buka Pemindaian" />
          </Link>
        </View>
        <View className="flex-row gap-4 mb-4">
          <View className="flex-1 bg-primary/10 rounded-xl p-4">
            <Text className="text-sm text-gray-700">Hadir</Text>
            <Text className="text-4xl font-extrabold text-primary">{hadirCount}</Text>
          </View>
          <View className="flex-1 bg-accent-red/10 rounded-xl p-4">
            <Text className="text-sm text-gray-700">Belum Hadir</Text>
            <Text className="text-4xl font-extrabold text-accent-red">{belumCount}</Text>
          </View>
        </View>
        {data.length === 0 ? (
          <View className="items-center justify-center py-12">
            <Ionicons name="calendar-outline" size={40} color="#9CA3AF" />
            <Text className="text-gray-500 mt-2">Belum ada data absensi untuk tanggal ini.</Text>
          </View>
        ) : (
          <View className="gap-3">
            {data.map((s) => (
              <View key={s.id} className="bg-white rounded-xl p-4 shadow-sm">
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="font-bold text-gray-900">{s.name}</Text>
                    <Text className="text-sm text-gray-500">Kelas {s.kelas}</Text>
                  </View>
                  <View className={`rounded-full px-3 py-1 ${s.status === 'HADIR' ? 'bg-primary' : 'bg-accent-red'}`}>
                    <Text className="text-neutral-white text-xs font-semibold">{s.status === 'HADIR' ? 'Hadir' : 'Belum Hadir'}</Text>
                  </View>
                </View>
                {s.status === 'HADIR' && (
                  <Text className="text-xs text-gray-500 mt-2">Pukul {s.time}</Text>
                )}
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
    </SafeAreaView>
  );
}
