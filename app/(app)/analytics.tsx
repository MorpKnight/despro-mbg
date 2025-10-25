import React from 'react';
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import Card from '../../components/ui/Card';

const dummyMenus = [
  { name: 'Sop Ayam', score: 4.8 },
  { name: 'Nasi Putih', score: 3.2 },
  { name: 'Buah Semangka', score: 4.5 },
];

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = React.useState('Oktober 2025');
  const [region, setRegion] = React.useState('Semua');
  const [catering, setCatering] = React.useState('Semua');
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const FilterRow = ({ title, options, selected, onSelect }: {
    title: string;
    options: string[];
    selected: string;
    onSelect: (value: string) => void;
  }) => (
    <SafeAreaView className="mb-2">
      <Text className="font-semibold text-gray-700 mb-1">{title}</Text>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
        {options.map((opt) => (
          <TouchableOpacity key={opt} onPress={() => onSelect(opt)}>
            <Text
              className={`px-3 py-1 rounded-full mr-2 ${
                selected === opt
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {opt}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );

  return (
    <ScrollView className="flex-1 bg-[#f5f7fb]">
      <View className="p-4">
        <Text className="text-2xl font-bold mb-6 text-gray-800">
          Analitik & Laporan Global
        </Text>

        {/* Filter Section */}
        <Card className="mb-4 p-4">
          <FilterRow
            title="Periode"
            options={['September 2025', 'Oktober 2025']}
            selected={dateRange}
            onSelect={setDateRange}
          />
          <FilterRow
            title="Wilayah"
            options={['Semua', 'Kota A', 'Kota B']}
            selected={region}
            onSelect={setRegion}
          />
          <FilterRow
            title="Katering"
            options={['Semua', 'Catering Sehat', 'Catering Lezat']}
            selected={catering}
            onSelect={setCatering}
          />
        </Card>

        {/* Chart 1 */}
        <Card className="mb-4 p-4">
          <Text className="font-semibold mb-2 text-gray-800">
            Tren Kepuasan Siswa
          </Text>
          <View className="h-40 bg-gray-100 rounded-xl items-center justify-center">
            <Text className="text-blue-600">[Line Chart Dummy]</Text>
          </View>
        </Card>

        {/* Chart 2 */}
        <Card className="mb-4 p-4">
          <Text className="font-semibold mb-2 text-gray-800">
            Sekolah dengan Skor Tertinggi & Terendah
          </Text>
          <View className="h-40 bg-gray-100 rounded-xl items-center justify-center">
            <Text className="text-blue-600">[Bar Chart Dummy]</Text>
          </View>
        </Card>

        {/* Menu Ranking */}
        <Card className="p-4">
          <Text className="font-semibold mb-3 text-gray-800">
            Menu Paling Disukai & Tidak Disukai
          </Text>
          <View className="flex-row justify-between mb-2">
            <Text className="font-semibold flex-1">Menu Favorit</Text>
            <Text className="font-semibold flex-1">Menu Kurang Favorit</Text>
          </View>
          <View className="flex-row">
            <Text className="flex-1 text-gray-700">
              {dummyMenus[0].name} ({dummyMenus[0].score})
            </Text>
            <Text className="flex-1 text-gray-700">
              {dummyMenus[1].name} ({dummyMenus[1].score})
            </Text>
          </View>
        </Card>
      </View>
    </ScrollView>
  );
}
