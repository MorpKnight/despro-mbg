import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Alert, Platform, AppState } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { useAuth } from '../../hooks/useAuth';
import { startScan, stopScan, NFCSource } from '../(app)/nfc-handler/index';

type NFCScan = {
  uid: string;
};

export default function AttendanceNFCPage() {
  const { user } = useAuth();
  const [paused, setPaused] = useState(false);
  const [lastScan, setLastScan] = useState<NFCScan | null>(null);
  const [scans, setScans] = useState<NFCScan[]>([]);
  const [scanMode, setScanMode] = useState<NFCSource>(Platform.OS === 'web' ? 'reader' : 'device');
  const [appActive, setAppActive] = useState(true);

  // Pantau lifecycle app
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      setAppActive(state === 'active');
    });
    return () => sub.remove();
  }, []);

  // Start/stop scanning
  useEffect(() => {
    if (!appActive) return;

    let active = true;

    const runScan = async () => {
      try {
        if (!paused) {
          await startScan(scanMode, (uid) => {
            if (!active) return;
            const scan: NFCScan = { uid };
            setLastScan(scan);
            setScans((prev) => [scan, ...prev].slice(0, 20));
          });
        } else {
          await stopScan();
        }
      } catch (err) {
        console.error('NFC scan error', err);
        Alert.alert('Error', 'Terjadi masalah saat pemindaian NFC.');
      }
    };

    runScan();

    // Cleanup
    return () => {
      active = false;
      stopScan().catch(() => {}); 
    };
  }, [paused, scanMode, appActive]);

  // Cek role
  if (user?.role !== 'admin_sekolah' && user?.role !== 'super_admin') {
    return (
      <SafeAreaView className="flex-1 bg-[#f5f7fb]">
        <Stack.Screen options={{ title: 'Scan Kehadiran NFC' }} />
        <View className="p-6">
          <Card>
            <Text>Akses ditolak.</Text>
          </Card>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#f5f7fb]">
      <Stack.Screen options={{ title: 'Scan Kehadiran NFC' }} />
      <View className="p-4 gap-3">
        <Card>
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="font-semibold text-gray-900">Status NFC</Text>
              <Text className="text-gray-600">{paused ? 'Jeda' : 'Aktif'}</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Button
                title="Device"
                variant={scanMode === 'device' ? 'primary' : 'outline'}
                size="sm"
                onPress={() => setScanMode('device')}
              />
              <Button
                title="Reader"
                variant={scanMode === 'reader' ? 'primary' : 'outline'}
                size="sm"
                onPress={() => setScanMode('reader')}
              />
              <Button
                title={paused ? 'Lanjutkan' : 'Jeda'}
                variant={paused ? 'primary' : 'secondary'}
                onPress={() => setPaused((p) => !p)}
              />
            </View>
          </View>
        </Card>

        {lastScan ? (
          <Card>
            <Text className="font-semibold text-gray-900">Scan Terakhir</Text>
            <Text className="text-lg mt-1">{lastScan.uid}</Text>
            {/* {lastScan.name && <Text className="text-gray-700">{lastScan.name}</Text>} */}
            {/* <Text className="text-gray-500 text-sm">{lastScan.timestamp}</Text> */}
          </Card>
        ) : (
          <Text className="text-center text-gray-500 mt-4">Menunggu scan NFC...</Text>
        )}

        <Text className="font-semibold mt-4 mb-2">Riwayat Scan</Text>
        <FlatList
          data={scans}
          keyExtractor={(item) => item.uid}
          renderItem={({ item }) => (
            <Card className="mb-2">
              <Text className="text-gray-900">{item.uid}</Text>
              {/* {item.name && <Text className="text-gray-700">{item.name}</Text>} */}
              {/* <Text className="text-gray-500 text-sm">{item.timestamp}</Text> */}
            </Card>
          )}
        />
      </View>
    </SafeAreaView>
  );
}