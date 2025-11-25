import { Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { AppState, Text, View, FlatList, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { useAuth } from '../../hooks/useAuth';

// Tipe data hasil scan
type NFCScan = {
  uid: string;
  name?: string; // nama opsional
  timestamp: string;
};

export default function AttendanceNFCPage() {
  const { user } = useAuth();
  const [paused, setPaused] = useState(false);
  const [nfcConnected, setNfcConnected] = useState(false);
  const [lastScan, setLastScan] = useState<NFCScan | null>(null);
  const [scans, setScans] = useState<NFCScan[]>([]);
  const [appActive, setAppActive] = useState(true);
  const [nfcSupported, setNfcSupported] = useState<boolean | null>(null);
  const [nfcScanning, setNfcScanning] = useState(false);

  // Pantau lifecycle app
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      setAppActive(state === 'active');
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const ws = new WebSocket('/'); // websocket backend (belum diatur)

    ws.onopen = () => setNfcConnected(true);
    ws.onclose = () => setNfcConnected(false);
    ws.onerror = (err) => console.error('WebSocket error', err);

    ws.onmessage = (event) => {
      try {
        const dataFromWS = JSON.parse(event.data);
        const scan: NFCScan = {
          uid: dataFromWS.id,
          name: dataFromWS.name,
          timestamp: dataFromWS.timestamp,
        };

        setLastScan(scan);
        setScans((prev) => [scan, ...prev].slice(0, 20));
        setPaused(true); // jeda otomatis setelah scan
      } catch (e) {
        console.error('Invalid NFC data', e);
      }
    };

    return () => ws.close();
  }, []);

  // Mobile: cek dukungan NFC
  useEffect(() => {
    if (Platform.OS === 'web') return;

    let mounted = true;

    async function checkSupport() {
      try {
        const mod = await import('react-native-nfc-manager');
        const NfcManager = mod.default ?? mod;
        await NfcManager.start();
        const supported = await NfcManager.isSupported();
        if (!mounted) return;
        setNfcSupported(Boolean(supported));
        if (!supported) {
          Alert.alert('NFC tidak didukung', 'Perangkat ini tidak mendukung NFC.');
        }
      } catch (err) {
        // library tidak terpasang atau gagal inisialisasi
        if (!mounted) return;
        setNfcSupported(false);
        Alert.alert('NFC tidak tersedia', 'Library NFC tidak terpasang atau tidak dapat diinisialisasi.');
      }
    }

    checkSupport();

    return () => {
      mounted = false;
    };
  }, []);

  // Mobile: start/stop scanning saat paused berubah
  useEffect(() => {
    if (Platform.OS === 'web') return;
    if (!nfcSupported) return;

    let active = true;

    async function startNativeScan() {
      try {
        const mod = await import('react-native-nfc-manager');
        const NfcManager = mod.default ?? mod;
        await NfcManager.start();

        // Daftarkan event tag NFC
        await (NfcManager as any).registerTagEvent((tag: any) => {
          if (!active) return;
          const uid = tag.id ?? (tag.ndefMessage?.[0]?.payload ?? 'unknown');
          const scan: NFCScan = {
            uid: String(uid),
            name: tag.techTypes ? tag.techTypes.join(',') : undefined,
            timestamp: new Date().toISOString(),
          };
          setLastScan(scan);
          setScans((prev) => [scan, ...prev].slice(0, 20));
          setPaused(true);
        });
        setNfcScanning(true);
      } catch (err) {
        console.error('Gagal memulai pemindaian NFC native', err);
        Alert.alert('Gagal pemindaian NFC', 'Tidak dapat memulai pemindaian NFC pada perangkat ini.');
        setNfcScanning(false);
      }
    }

    async function stopNativeScan() {
      try {
        const mod = await import('react-native-nfc-manager');
        const NfcManager = mod.default ?? mod;
        await NfcManager.unregisterTagEvent();
        setNfcScanning(false);
      } catch (err) {
        // ignore
      }
    }

    if (!paused) {
      startNativeScan();
    } else {
      stopNativeScan();
    }

    return () => {
      active = false;
      (async () => {
        try {
          const mod = await import('react-native-nfc-manager');
          const NfcManager = mod.default ?? mod;
          await NfcManager.unregisterTagEvent();
        } catch (e) {
          // ignore
        }
      })();
    };
  }, [paused, nfcSupported]);

  // Hanya admin sekolah atau super admin yang bisa akses
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
              <Text className="text-gray-600">
                {paused ? 'Jeda' : nfcConnected && appActive ? 'Aktif' : 'Terputus'}
              </Text>
            </View>
            {/* Tombol untuk jeda/lanjutkan pemindaian */}
            <Button
              title={paused ? 'Lanjutkan NFC' : 'Jeda NFC'}
              variant={paused ? 'primary' : 'secondary'}
              onPress={() => setPaused((p) => !p)}
            />
          </View>
        </Card>

        {/* Tampilkan scan terakhir (jika ada) */}
        {lastScan ? (
          <Card>
            <Text className="font-semibold text-gray-900">Scan Terakhir</Text>
            <Text className="text-lg mt-1">{lastScan.uid}</Text>
            {lastScan.name && <Text className="text-gray-700">{lastScan.name}</Text>}
            <Text className="text-gray-500 text-sm">{lastScan.timestamp}</Text>
          </Card>
        ) : (
          <Text className="text-center text-gray-500 mt-4">Menunggu scan NFC...</Text>
        )}

        <Text className="font-semibold mt-4 mb-2">Riwayat Scan</Text>
        {/* Riwayat scan */}
        <FlatList
          data={scans}
          keyExtractor={(item) => item.uid + item.timestamp}
          renderItem={({ item }) => (
            <Card className="mb-2">
              <Text className="text-gray-900">{item.uid}</Text>
              {item.name && <Text className="text-gray-700">{item.name}</Text>}
              <Text className="text-gray-500 text-sm">{item.timestamp}</Text>
            </Card>
          )}
        />
      </View>
    </SafeAreaView>
  );
}
