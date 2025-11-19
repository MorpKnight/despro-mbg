import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import Card from '../../components/ui/Card';
import { fetchHealthStatus, type HealthStatus } from '../../services/health';

const syncStatus = [
  { school: 'SDN 1', lastSync: '5 menit yang lalu', status: 'success' },
  { school: 'SMPN 2', lastSync: 'Gagal pada 18 Okt 2025 10:00', status: 'failed' },
  { school: 'SMA 3', lastSync: '2 jam yang lalu', status: 'success' },
];
const errorLogs = [
  { time: '18 Okt 2025 10:00', message: 'Gagal sinkronisasi data dari SMPN 2: koneksi timeout' },
  { time: '18 Okt 2025 09:45', message: 'Gagal login admin sekolah: password salah' },
  { time: '18 Okt 2025 09:30', message: 'Gagal update data siswa: server error' },
];

export default function SystemHealthPage() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const status = await fetchHealthStatus();
        if (mounted) {
          setHealth(status);
          setError(null);
        }
      } catch (err) {
        console.warn('[system-health] failed to load', err);
        if (mounted) {
          setError('Tidak dapat terhubung ke server kesehatan.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const systemStatus = health?.status === 'ok' ? 'OPERASIONAL' : 'MENGALAMI GANGGUAN';
  const dbStatus = health?.db_status === 'connected' ? 'Basis data terhubung' : 'Basis data terganggu';

  return (
    <SafeAreaView className="flex-1 bg-[#f5f7fb]">
    <ScrollView className="flex-1 bg-neutral-gray">
      <View className="p-6">
        <Text className="text-2xl font-bold mb-6">Kesehatan Sistem & Log</Text>
        {/* Status Global */}
        <Card className="mb-4">
          <Text className="text-lg font-semibold mb-2">Status Sistem Keseluruhan</Text>
          {loading ? (
            <Text className="text-gray-600">Memeriksa status sistem…</Text>
          ) : error ? (
            <Text className="text-accent-red">{error}</Text>
          ) : (
            <>
              <Text className={`text-3xl font-bold ${systemStatus === 'OPERASIONAL' ? 'text-primary' : 'text-accent-red'}`}>{systemStatus}</Text>
              <Text className="text-sm text-gray-600 mt-1">{dbStatus}</Text>
            </>
          )}
        </Card>
        {/* Sinkronisasi per sekolah */}
        <Text className="text-lg font-semibold mb-2">Status Sinkronisasi Terakhir</Text>
        <View className="gap-2 mb-4">
          {syncStatus.map((s, i) => (
            <Card key={i} className="flex-row items-center p-3">
              <View className="flex-1">
                <Text className="font-bold">{s.school}</Text>
                <Text className="text-xs text-gray-500">{s.lastSync}</Text>
              </View>
              <View className={`w-3 h-3 rounded-full ${s.status === 'success' ? 'bg-primary' : 'bg-accent-red'}`} />
            </Card>
          ))}
        </View>
        {/* Error logs */}
        <Text className="text-lg font-semibold mb-2">Log Error Terbaru</Text>
        <Card>
          {errorLogs.length === 0 ? (
            <Text className="text-gray-500 py-8 text-center">Tidak ada error log.</Text>
          ) : (
            errorLogs.map((log, i) => (
              <View key={i} className="border-b border-gray-200 py-2">
                <Text className="text-xs text-gray-500 mb-1">{log.time}</Text>
                <Text className="text-sm text-accent-red">{log.message}</Text>
              </View>
            ))
          )}
        </Card>
      </View>
    </ScrollView>
    </SafeAreaView>
  );
}
