import { Stack } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, AppState, FlatList, Platform, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { useAuth } from '../../hooks/useAuth';
import { useElectronNfc } from '../../hooks/useElectronNfc';
import { startScan, stopScan, type NFCSource } from '../../lib/nfc';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useOfflineMutation } from '../../hooks/useOfflineMutation';
import { recordAttendanceViaNfc } from '../../services/attendance';
import { useSnackbar } from '../../hooks/useSnackbar';

type NFCScan = {
  uid: string;
};

function getJakartaDateKey() {
  // hasil format: YYYY-MM-DD
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(new Date());
}

export default function AttendanceNFCPage() {
  const { user } = useAuth();
  const [paused, setPaused] = useState(false);
  const [lastScan, setLastScan] = useState<NFCScan | null>(null);
  const [scans, setScans] = useState<NFCScan[]>([]);
  const [scanMode, setScanMode] = useState<NFCSource>(Platform.OS === 'web' ? 'reader' : 'device');
  const [appActive, setAppActive] = useState(true);

  // =========================
  // Electron NFC Hook (status/error/lastScan payload)
  // =========================
  const { available, status, error } = useElectronNfc({
    enabled: Platform.OS === 'web' && scanMode === 'reader' && appActive,
  });

  const readerName = status?.reader ?? null;
  const readerStatus = status?.status ?? null; // "connected" | "disconnected"

  // Popup hanya sekali ketika connected pertama kali
  const hasShownFirstConnectRef = useRef(false);

  // throttle popup error biar ga spam
  const lastErrorAtRef = useRef(0);

  const { showSnackbar } = useSnackbar();

  // Offline-aware mutation: coba kirim ke server, jika offline akan disimpan ke queue
  const { mutate: submitAttendance } = useOfflineMutation<{
    nfcTagId: string;
  }, import('../../services/attendance').RecordAttendanceResult>({
    mutationFn: ({ nfcTagId }) => recordAttendanceViaNfc(nfcTagId),
    endpoint: 'attendance/nfc',
    method: 'POST',
    serializeBody: ({ nfcTagId }) => ({ nfc_tag_id: nfcTagId }),
    onQueuedMessage: 'Disimpan ke antrian offline. Periksa tab Riwayat setelah koneksi aktif.',
  });

  const scannedTodayRef = useRef<Set<string>>(new Set());
  const inFlightRef = useRef<Set<string>>(new Set());
  const dateKeyRef = useRef<string>(getJakartaDateKey());
  const [scannedToday, setScannedToday] = useState<Set<string>>(new Set());

  // Pantau lifecycle app
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      setAppActive(state === 'active');
    });
    return () => sub.remove();
  }, []);

  // Reset flag popup connect ketika ganti mode atau app inactive
  useEffect(() => {
    if (scanMode !== 'reader' || !appActive) {
      hasShownFirstConnectRef.current = false;
    }
  }, [scanMode, appActive]);

  // Popup saat reader terhubung pertama kali
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (scanMode !== 'reader') return;
    if (!appActive) return;
    if (!readerStatus) return;

    if (readerStatus === 'connected' && !hasShownFirstConnectRef.current) {
      hasShownFirstConnectRef.current = true;
      Alert.alert(
        'NFC Reader Terhubung',
        readerName ? `Reader "${readerName}" siap digunakan.` : 'Reader siap digunakan.'
      );
    }
  }, [readerStatus, readerName, scanMode, appActive]);

  // Popup error dari Electron
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (scanMode !== 'reader') return;
    if (!appActive) return;
    if (!error) return;

    const now = Date.now();
    if (now - lastErrorAtRef.current < 2000) return; // 2s throttle
    lastErrorAtRef.current = now;

    Alert.alert('NFC Error', error.message || 'Terjadi error pada NFC reader.');
  }, [error, scanMode, appActive]);

  // =========================
  // Start/stop scanning (UID)
  // =========================
  useEffect(() => {
    if (!appActive) return;

    let active = true;

    const runScan = async () => {
      try {
        if (!paused) {
          await startScan(scanMode, async (uid) => {
            if (!active) return;

            // 1) lock cepat (anti spam)
            const ok = tryLockUidForToday(uid);
            if (!ok) {
              showSnackbar({ message: 'Siswa ini sudah/ sedang diproses untuk absensi hari ini.', variant: 'info' });
              return;
            }

            try {
              // 2) baru update UI history setelah lolos lock
              const scan: NFCScan = { uid };
              setLastScan(scan);
              setScans((prev) => [scan, ...prev].slice(0, 20));

              // 3) submit attendance
              const result = await submitAttendance({ nfcTagId: uid });

              // 4) tandai "sudah scan hari ini"
              markScannedToday(uid);

              if (result) {
                showSnackbar({ message: 'Kehadiran tercatat di server.', variant: 'success' });
              } else {
                showSnackbar({ message: 'Disimpan ke antrian offline.', variant: 'info' });
              }
            } catch (err: any) {
              console.warn('[attendance-nfc] gagal kirim absensi', err);

              const rawMessage = String(err?.message || '');
              const friendly = /409/.test(rawMessage)
                ? 'Siswa sudah tercatat hadir hari ini.'
                : rawMessage || 'Gagal memproses absensi.';

              showSnackbar({ message: friendly, variant: 'error' });
            } finally {
              releaseInFlight(uid);
            }
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

  // =========================
  // Role check
  // =========================
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

  // =========================
  // UI helpers
  // =========================
  const renderNfcStatusText = () => {
    if (paused) return 'Jeda';

    if (scanMode === 'device') {
      return 'Aktif (Device)';
    }

    // scanMode === 'reader'
    if (!available) return 'Reader mode';
    if (!readerStatus) return 'Menunggu reader...';
    return readerStatus === 'connected' ? 'Reader Terhubung' : 'Reader Terputus';
  };

  useEffect(() => {
    let mounted = true;

    const loadToday = async () => {
      const dateKey = getJakartaDateKey();
      dateKeyRef.current = dateKey;

      const storageKey = `mbg:nfc:scanned:${dateKey}`;
      const raw = await AsyncStorage.getItem(storageKey);
      const arr = raw ? (JSON.parse(raw) as string[]) : [];

      const set = new Set(arr);
      scannedTodayRef.current = set;

      if (mounted) {
        setScannedToday(new Set(set));
      }
    };

    loadToday().catch(() => {});

    return () => { mounted = false; };
  }, []);

  const markScannedToday = (uid: string) => {
    const dateKey = dateKeyRef.current || getJakartaDateKey();
    const storageKey = `mbg:nfc:scanned:${dateKey}`;

    scannedTodayRef.current.add(uid);
    setScannedToday(new Set(scannedTodayRef.current));

    AsyncStorage.setItem(storageKey, JSON.stringify([...scannedTodayRef.current]))
      .catch(() => {});
  };

  const tryLockUidForToday = (uid: string) => {
    const todayKey = getJakartaDateKey();

    // kalau hari ganti, reset cache
    if (todayKey !== dateKeyRef.current) {
      dateKeyRef.current = todayKey;
      scannedTodayRef.current = new Set();
      setScannedToday(new Set());
      inFlightRef.current = new Set();
    }

    // sudah pernah scan hari ini
    if (scannedTodayRef.current.has(uid)) return false;

    // sedang diproses (scan beruntun super cepat)
    if (inFlightRef.current.has(uid)) return false;

    // lock dulu sebelum async apapun
    inFlightRef.current.add(uid);
    return true;
  };

  const releaseInFlight = (uid: string) => {
    inFlightRef.current.delete(uid);
  };

  // =========================
  // Render
  // =========================
  return (
    <SafeAreaView className="flex-1 bg-[#f5f7fb]">
      <Stack.Screen options={{ title: 'Scan Kehadiran NFC' }} />
      <View className="p-4 gap-3">
        <Card>
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="font-semibold text-gray-900">Status NFC</Text>
              <Text className="text-gray-600">{renderNfcStatusText()}</Text>

              {/* tampilkan nama reader jika mode reader */}
              {scanMode === 'reader' && (
                <Text className="text-gray-500 text-xs mt-1">
                  {readerName ? `Reader: ${readerName}` : 'Reader: -'}
                </Text>
              )}
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
          </Card>
        ) : (
          <Text className="text-center text-gray-500 mt-4">
            Menunggu scan NFC...
          </Text>
        )}

        <Text className="font-semibold mt-4 mb-2">Riwayat Scan</Text>
        <FlatList
          data={scans}
          keyExtractor={(item, index) => `${item.uid}-${index}`}
          renderItem={({ item }) => (
            <Card className="mb-2">
              <Text className="text-gray-900">{item.uid}</Text>
            </Card>
          )}
        />
      </View>
    </SafeAreaView>
  );
}
