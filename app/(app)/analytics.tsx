import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Card from '../../components/ui/Card';

// const dummySchools = [
//   { name: 'SDN 1', region: 'Kota A', catering: 'Catering Sehat', score: 4.7 },
//   { name: 'SMPN 2', region: 'Kota B', catering: 'Catering Lezat', score: 3.9 },
//   { name: 'SMA 3', region: 'Kota A', catering: 'Catering Sehat', score: 4.2 },
// ];
const dummyMenus = [
  { name: 'Sop Ayam', score: 4.8 },
  { name: 'Nasi Putih', score: 3.2 },
  { name: 'Buah Semangka', score: 4.5 },
];

export default function AnalyticsPage() {
  // Filter state
  const [dateRange, setDateRange] = React.useState('Oktober 2025');
  const [region, setRegion] = React.useState('Semua');
  const [catering, setCatering] = React.useState('Semua');

  // Dummy chart data
  // For real chart, use react-native-chart-kit or similar
  // const chartData = [4.2, 4.5, 4.7, 4.3, 4.6, 4.8, 4.7];

  return (
    <ScrollView className="flex-1 bg-neutral-gray">
      <View className="p-6">
        <Text className="text-2xl font-bold mb-6">Analitik & Laporan Global</Text>
        {/* Filter Global */}
        <Card className="mb-4">
          <View className="flex-row gap-2 mb-2">
            <TouchableOpacity onPress={() => setDateRange('September 2025')}><Text className={`px-3 py-1 rounded-full ${dateRange === 'September 2025' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'}`}>September 2025</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setDateRange('Oktober 2025')}><Text className={`px-3 py-1 rounded-full ${dateRange === 'Oktober 2025' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'}`}>Oktober 2025</Text></TouchableOpacity>
          </View>
          <View className="flex-row gap-2 mb-2">
            <TouchableOpacity onPress={() => setRegion('Semua')}><Text className={`px-3 py-1 rounded-full ${region === 'Semua' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'}`}>Semua Wilayah</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setRegion('Kota A')}><Text className={`px-3 py-1 rounded-full ${region === 'Kota A' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'}`}>Kota A</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setRegion('Kota B')}><Text className={`px-3 py-1 rounded-full ${region === 'Kota B' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'}`}>Kota B</Text></TouchableOpacity>
          </View>
          <View className="flex-row gap-2">
            <TouchableOpacity onPress={() => setCatering('Semua')}><Text className={`px-3 py-1 rounded-full ${catering === 'Semua' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'}`}>Semua Katering</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setCatering('Catering Sehat')}><Text className={`px-3 py-1 rounded-full ${catering === 'Catering Sehat' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'}`}>Catering Sehat</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setCatering('Catering Lezat')}><Text className={`px-3 py-1 rounded-full ${catering === 'Catering Lezat' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'}`}>Catering Lezat</Text></TouchableOpacity>
          </View>
        </Card>
        {/* Grafik 1: Tren Kepuasan Siswa */}
        <Card className="mb-4">
          <Text className="font-semibold mb-2">Tren Kepuasan Siswa</Text>
          {/* Dummy Line Chart */}
          <View className="h-32 bg-gray-100 rounded-xl items-center justify-center">
            <Text className="text-primary">[Line Chart Dummy]</Text>
          </View>
        </Card>
        {/* Grafik 2: Bar Chart Perbandingan */}
        <Card className="mb-4">
          <Text className="font-semibold mb-2">Sekolah dengan Skor Tertinggi & Terendah</Text>
          {/* Dummy Bar Chart */}
          <View className="h-32 bg-gray-100 rounded-xl items-center justify-center">
            <Text className="text-primary">[Bar Chart Dummy]</Text>
          </View>
        </Card>
        {/* Tabel Peringkat Makanan */}
        <Card>
          <Text className="font-semibold mb-2">Menu Paling Disukai & Tidak Disukai</Text>
          <View className="flex-row font-bold mb-2">
            <Text className="flex-1">Menu Favorit</Text>
            <Text className="flex-1">Menu Kurang Favorit</Text>
          </View>
          <View className="flex-row mb-2">
            <Text className="flex-1">{dummyMenus[0].name} ({dummyMenus[0].score})</Text>
            <Text className="flex-1">{dummyMenus[1].name} ({dummyMenus[1].score})</Text>
          </View>
        </Card>
      </View>
    </ScrollView>
  );
}
