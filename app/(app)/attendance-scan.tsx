import { useIsFocused } from '@react-navigation/native';
import { Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, AppState, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { QRScanner } from '../../components/features/attendance';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { useAuth } from '../../hooks/useAuth';
import { useNetworkMode } from '../../hooks/useNetworkMode';
import { useOffline } from '../../hooks/useOffline';
import { useOfflineMutation } from '../../hooks/useOfflineMutation';
import { useSnackbar } from '../../hooks/useSnackbar';
import { recordAttendance, type RecordAttendanceResult } from '../../services/attendance';
// No backend yet: we'll only parse and show the QR contents for now

type ParsedQR = {
  raw: string;
  id: string;
  name?: string;
  source: 'json' | 'url' | 'plain';
};

function parseQrPayload(input: string): ParsedQR {
  const raw = String(input ?? '');
  // 1) JSON format: { id: string, name?: string }
  try {
    const obj = JSON.parse(raw);
    if (obj && typeof obj === 'object' && typeof obj.id === 'string') {
      return { raw, id: obj.id.trim(), name: typeof obj.name === 'string' ? obj.name.trim() : undefined, source: 'json' };
    }
  } catch {}
  // 2) URL format: https://.../?studentId=... or ?id=...
  try {
    const u = new URL(raw);
    const sid = u.searchParams.get('studentId') || u.searchParams.get('id') || '';
    if (sid) return { raw, id: sid.trim(), source: 'url' };
    // fallback: last path segment if present
    const segs = u.pathname.split('/').filter(Boolean);
    if (segs.length > 0) return { raw, id: segs[segs.length - 1].trim(), source: 'url' };
  } catch {}
  // 3) Plain string: use as ID if valid-ish
  const plain = raw.trim();
  // Simple validation: 1-64 chars, alphanum/_/-
  if (/^[A-Za-z0-9_-]{1,64}$/.test(plain)) return { raw, id: plain, source: 'plain' };
  // If not valid, still return first 64 chars as id fallback
  return { raw, id: plain.slice(0, 64) || 'UNKNOWN', source: 'plain' };
}

export default function AttendanceScanPage() {
  const { user } = useAuth();
  const { isOnline } = useOffline();
  const { currentMode } = useNetworkMode();
  const { showSnackbar } = useSnackbar();
  const isFocused = useIsFocused();
  const [paused, setPaused] = useState(false); // auto-pause after success
  const [cameraOn, setCameraOn] = useState(true); // user toggles camera hardware
  const [appActive, setAppActive] = useState(true);

  const { mutate: submitAttendance } = useOfflineMutation<{ studentId: string; method: 'qr' }, RecordAttendanceResult>({
    mutationFn: ({ studentId, method }) => recordAttendance(studentId, method),
    endpoint: 'attendance/',
    method: 'POST',
    serializeBody: ({ studentId, method }) => ({ student_id: studentId, method }),
    onQueuedMessage: 'Disimpan ke antrian offline. Periksa tab Riwayat setelah koneksi aktif.',
  });

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      setAppActive(state === 'active');
    });
    return () => sub.remove();
  }, []);

  if (user?.role !== 'admin_sekolah' && user?.role !== 'super_admin') {
    return (
      <SafeAreaView className="flex-1 bg-[#f5f7fb]">
        <Stack.Screen options={{ title: 'Scan Kehadiran' }} />
        <View className="p-6">
          <Card>
            <Text>Akses ditolak.</Text>
          </Card>
        </View>
      </SafeAreaView>
    );
  }

  async function handleSuccess(data: string) {
    setPaused(true);
    try {
      const parsed = parseQrPayload(data);
      if (!parsed.id || parsed.id === 'UNKNOWN') {
        throw new Error('Data QR tidak valid');
      }
      const result = await submitAttendance({ studentId: parsed.id, method: 'qr' });
      const displayName = parsed.name ? `${parsed.name} (${parsed.id})` : parsed.id;

      if (result) {
        const timestamp = result.record?.createdAt ?? new Date().toISOString();
        const timeLabel = new Date(timestamp).toLocaleString('id-ID', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
        showSnackbar({
          message: 'Kehadiran tercatat di server.',
          variant: 'success',
        });
        Alert.alert('Kehadiran Tercatat', `${displayName} tercatat pada ${timeLabel}.`, [
          { text: 'Scan lagi', onPress: () => setPaused(false) },
          { text: 'Tutup', style: 'cancel' },
        ]);
        return;
      }

      Alert.alert(
        'Disimpan Offline',
        `${displayName} akan dikirim otomatis saat koneksi kembali tersedia.`,
        [
          { text: 'Scan lagi', onPress: () => setPaused(false) },
          { text: 'Tutup', style: 'cancel' },
        ],
      );
    } catch (err: any) {
      console.warn('[attendance-scan] gagal mencatat', err);
      const rawMessage = String(err?.message || '');
      const friendly = /409/.test(rawMessage)
        ? 'Siswa sudah tercatat hadir hari ini.'
        : rawMessage || 'QR tidak dapat diproses.';
      Alert.alert('Gagal Memproses', friendly);
      setPaused(false);
    }
  }

  function handleError(err: Error) {
    Alert.alert('Gagal Memindai', err.message || 'Terjadi kesalahan saat memindai.');
  }

  return (
    <SafeAreaView className="flex-1 bg-[#f5f7fb]">
      <Stack.Screen options={{ title: 'Scan Kehadiran' }} />
      <View className="p-4 gap-3">
        <Card>
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="font-semibold text-gray-900">Status Pemindaian</Text>
              <Text className="text-gray-600">
                {(cameraOn && isFocused && appActive) ? (paused ? 'Jeda' : 'Aktif') : 'Kamera Off'} • {isOnline ? 'Online' : 'Offline'} • {currentMode === 'LOCAL' ? 'Server Lokal' : 'Server Cloud'}
              </Text>
            </View>
            <Button
              title={cameraOn ? 'Matikan Kamera' : 'Nyalakan Kamera'}
              variant={cameraOn ? 'secondary' : 'primary'}
              onPress={() => {
                setCameraOn((on) => !on);
                if (!cameraOn) setPaused(false);
              }}
            />
          </View>
        </Card>

        <QRScanner onScanSuccess={handleSuccess} onScanError={handleError} paused={paused} cameraEnabled={cameraOn && isFocused && appActive} />
      </View>
    </SafeAreaView>
  );
}
