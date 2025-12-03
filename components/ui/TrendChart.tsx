import React from 'react';
import { ActivityIndicator, Text, useWindowDimensions, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

interface TrendPoint {
  label: string;
  value: number;
}

interface TrendChartProps {
  data: TrendPoint[];
  loading?: boolean;
  error?: string | null;
  title?: string;
  color?: string; // Warna garis grafik
}

export default function TrendChart({ 
  data, 
  loading, 
  error,
  title = "Tren Kepuasan (30 Hari)", 
  color = '#1976D2' 
}: TrendChartProps) {
  const { width } = useWindowDimensions();
  
  // Transformasi data untuk Gifted Charts
  const chartData = data.map(item => ({
    value: item.value,
    label: item.label,
    dataPointText: item.value.toFixed(1),
    textColor: '#374151', // gray-700
    textShiftY: -10,
    textFontSize: 10,
  }));

  // State Loading
  if (loading) {
    return (
      <View className="bg-white rounded-2xl p-6 shadow-sm mb-6 min-h-[250px] items-center justify-center">
        <ActivityIndicator size="small" color={color} />
        <Text className="text-gray-400 text-xs mt-2">Memuat grafik...</Text>
      </View>
    );
  }

  // State Error
  if (error) {
    return (
      <View className="bg-white rounded-2xl p-6 shadow-sm mb-6 min-h-[100px] items-center justify-center">
        <Text className="text-red-500 text-sm">{error}</Text>
      </View>
    );
  }

  // State Kosong
  if (!data || data.length === 0) {
    return (
      <View className="bg-white rounded-2xl p-6 shadow-sm mb-6 min-h-[150px] items-center justify-center">
        <Text className="text-gray-400 text-sm">Belum ada data tren kepuasan.</Text>
      </View>
    );
  }

  return (
    <View className="bg-white rounded-2xl p-4 shadow-sm mb-6">
      <View className="mb-4 pl-2">
        <Text className="text-base font-bold text-gray-900">{title}</Text>
      </View>
      
      <View style={{ overflow: 'hidden', paddingBottom: 10 }}>
        <LineChart
          data={chartData}
          color={color}
          thickness={3}
          dataPointsColor={color}
          startFillColor={color}
          endFillColor={color}
          startOpacity={0.2}
          endOpacity={0.05}
          areaChart
          curved
          isAnimated
          animationDuration={1200}
          width={width - 80} // Responsive width
          height={180}
          rulesColor="#E5E7EB" // gray-200
          rulesType="solid"
          yAxisColor="transparent"
          xAxisColor="transparent"
          hideYAxisText={false}
          yAxisTextStyle={{ color: '#9CA3AF', fontSize: 10 }}
          xAxisLabelTextStyle={{ color: '#9CA3AF', fontSize: 10, width: 40 }}
          maxValue={5}
          noOfSections={5}
          initialSpacing={20}
          endSpacing={20}
          pointerConfig={{
            pointerStripUptoDataPoint: true,
            pointerStripColor: 'lightgray',
            pointerStripWidth: 2,
            strokeDashArray: [2, 5],
            pointerColor: color,
            radius: 4,
            pointerLabelWidth: 100,
            pointerLabelHeight: 120,
            activatePointersOnLongPress: true,
            autoAdjustPointerLabelPosition: false,
          }}
        />
      </View>
    </View>
  );
}