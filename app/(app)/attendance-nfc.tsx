import { Stack } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, FlatList, Platform, Text, View, Modal, Pressable } from 'react-native';
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
import PageHeader from '@/components/ui/PageHeader';
import { useIsFocused } from '@react-navigation/native';


type NFCScan = {
  uid: string;
  username?: string | null;
  fullName?: string | null;
};

function getJakartaDateKey() {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return fmt.format(new Date());
}

export default function AttendanceNFCPage() {
  const { user } = useAuth();
  const { showSnackbar } = useSnackbar();

  const [paused, setPaused] = useState(false);
  const [lastScan, setLastScan] = useState<NFCScan | null>(null);
  const [scans, setScans] = useState<NFCScan[]>([]);
  // detect whether the Electron preload exposed `nfcAPI`
  const isNfcApiAvailable = typeof globalThis !== 'undefined' && !!(globalThis as any).nfcAPI;

  const [scanMode, setScanMode] = useState<NFCSource>(
    isNfcApiAvailable ? 'reader' : Platform.OS === 'web' ? 'reader' : 'device'
  );
  const [appActive, setAppActive] = useState(true);
  const isFocused = useIsFocused();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  // =========================
  // Electron NFC Hook (status/error)
  // =========================
  const { available, status, error } = useElectronNfc({
    enabled: isNfcApiAvailable && scanMode === 'reader' && appActive,
  });

  const readerName = status?.reader ?? null;
  const readerStatus = status?.status ?? null; // "connected" | "disconnected"

  // show connect once
  const hasShownFirstConnectRef = useRef(false);
  // throttle error
  const lastErrorAtRef = useRef(0);

  useEffect(() => {
    if (scanMode === 'reader') return;
    if (Platform.OS !== 'web') return;

    let mounted = true;

    const checkAndSwitch = () => {
      if (!mounted) return;
      if ((globalThis as any).nfcAPI) {
        setScanMode('reader');
      }
    };

    // run once immediately then poll
    checkAndSwitch();
    const id = setInterval(checkAndSwitch, 500);

    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [scanMode]);

  // =========================
  // Offline-aware mutation
  // =========================
  const { mutate: submitAttendance } = useOfflineMutation<{
    nfcTagId: string;
  }, import('../../services/attendance').RecordAttendanceResult>({
    mutationFn: ({ nfcTagId }) => recordAttendanceViaNfc(nfcTagId),
    endpoint: 'attendance/nfc',
    method: 'POST',
    serializeBody: ({ nfcTagId }) => ({ nfc_tag_id: nfcTagId }),
    onQueuedMessage: 'Disimpan ke antrian offline. Periksa tab Riwayat setelah koneksi aktif.',
  });

  // =========================
  // Dedupe harian (refs + state untuk render)
  // =========================
  const scannedTodayRef = useRef<Set<string>>(new Set());
  const inFlightRef = useRef<Set<string>>(new Set());
  const dateKeyRef = useRef<string>(getJakartaDateKey());
  const [scannedToday, setScannedToday] = useState<Set<string>>(new Set());

  // =========================
  // Helpers dedupe
  // =========================
  const markScannedToday = (uid: string) => {
    const dateKey = dateKeyRef.current || getJakartaDateKey();
    const storageKey = `mbg:nfc:scanned:${dateKey}`;

    scannedTodayRef.current.add(uid);
    setScannedToday(new Set(scannedTodayRef.current));

    AsyncStorage.setItem(storageKey, JSON.stringify([...scannedTodayRef.current])).catch(() => {});
  };

  const tryLockUidForToday = (uid: string) => {
    const todayKey = getJakartaDateKey();

    if (todayKey !== dateKeyRef.current) {
      dateKeyRef.current = todayKey;
      scannedTodayRef.current = new Set();
      inFlightRef.current = new Set();
      setScannedToday(new Set());
    }

    if (scannedTodayRef.current.has(uid)) return false;
    if (inFlightRef.current.has(uid)) return false;

    inFlightRef.current.add(uid);
    return true;
  };

  const releaseInFlight = (uid: string) => {
    inFlightRef.current.delete(uid);
  };

  // =========================
  // Load scannedToday on mount
  // =========================
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
    return () => {
      mounted = false;
    };
  }, []);

  // =========================
  // App lifecycle
  // =========================
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      setAppActive(state === 'active');
    });
    return () => sub.remove();
  }, []);

  // Reset connect popup flag on mode change / inactive
  useEffect(() => {
    if (scanMode !== 'reader' || !appActive) {
      hasShownFirstConnectRef.current = false;
    }
  }, [scanMode, appActive]);

  // Snackbar when reader first connected
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (scanMode !== 'reader') return;
    if (!appActive) return;
    if (!isFocused) return;
    if (!readerStatus) return;

  let active = true;
    if (readerStatus === 'connected' && !hasShownFirstConnectRef.current) {
      hasShownFirstConnectRef.current = true;
      showSnackbar({
        message: readerName ? `Reader "${readerName}" siap digunakan.` : 'Reader siap digunakan.',
        variant: 'success',
      });
    }
  }, [paused, scanMode, appActive, isFocused, readerStatus]);

  // Snackbar for Electron errors
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (scanMode !== 'reader') return;
    if (!appActive) return;
    if (!error) return;

    const now = Date.now();
    if (now - lastErrorAtRef.current < 2000) return;
    lastErrorAtRef.current = now;

    showSnackbar({
      message: error.message || 'Terjadi error pada NFC reader.',
      variant: 'error',
    });
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

            const ok = tryLockUidForToday(uid);
            if (!ok) {
              showSnackbar({
                message: 'Siswa sudah diproses untuk absensi hari ini.',
                variant: 'info',
              });
              return;
            }

            try {
              // 1) submit
              const result = await submitAttendance({ nfcTagId: uid });

              const isQueued = !!(result as any)?.queued;
              const record = result?.record;

              if (!record) {
                if (isQueued) {
                  showSnackbar({ message: 'Disimpan ke antrian offline.', variant: 'info' });
                } else {
                  showSnackbar({ message: 'Gagal memproses absensi.', variant: 'error' });
                }
                return;
              }

              // 2) mark daily lock
              markScannedToday(uid);

              // 3) build scan hasil sukses
              const student = record.student;
              const username = student?.username ? student.username : null;
              const fullName = student?.fullName ?? null;

              const scan: NFCScan = { uid, username, fullName };

              // 4) update UI hanya jika sukses
              setLastScan(scan);
              setScans((prev) => [scan, ...prev].slice(0, 20));

              console.log('NFC attendance recorded', result);

              // 5) feedback
              if (isQueued) {
                showSnackbar({ message: 'Disimpan ke antrian offline.', variant: 'info' });
              } else {
                showSnackbar({ message: 'Kehadiran tercatat.', variant: 'success' });
              }
            } catch (err: any) {
              console.warn('[attendance-nfc] gagal kirim absensi', err)

              showSnackbar({ message: "Siswa sudah diproses untuk absensi hari ini.", variant: 'error' });
            } finally {
              releaseInFlight(uid);
            }

          });
        } else {
          await stopScan();
        }
      } catch (err) {
        console.error('NFC scan error', err);
        showSnackbar({
          message: 'Terjadi masalah saat pemindaian NFC. Periksa perangkat pembaca atau koneksi, lalu coba lagi.',
          variant: 'error',
        });
      }
    };

    runScan();

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

    if (!available) return 'Reader mode';
    if (!readerStatus) return 'Menunggu reader...';
    return readerStatus === 'connected' ? 'Reader Terhubung' : 'Reader Terputus';
  };

  const renderPersonLine = (scan: NFCScan) => {
    const fullName = scan.fullName ?? '';
    const username = scan.username ?? '';

    if (fullName && username) return `${fullName} (@${username})`;
    if (fullName) return fullName;
    if (username) return `@${username}`;
    return scan.uid;
  };

  // =========================
  // Render
  // =========================
  return (
    <SafeAreaView className="flex-1 bg-[#f5f7fb]">
      <Stack.Screen options={{ title: 'Scan Kehadiran NFC' }} />
      <PageHeader
        title="Scan Kehadiran"
        subtitle="Rekam kehadiran siswa dengan kartu NFC"
        showBackButton={false}
        onRefresh={onRefresh}
        isRefreshing={refreshing}
        className="mx-6 mt-6 mb-4"
      />
      <View className="p-4 gap-3">
        <Card>
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="font-semibold text-gray-900">Status NFC</Text>
              <Text className="text-gray-600">{renderNfcStatusText()}</Text>

              {scanMode === 'reader' && (
                <Text className="text-gray-500 text-xs mt-1">
                  {readerName ? `Reader: ${readerName}` : 'Reader: -'}
                </Text>
              )}
            </View>

            <View className="flex-row items-center gap-2">
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
            <Text className="text-lg mt-1">{renderPersonLine(lastScan)}</Text>
            <Text className="text-gray-500 text-xs mt-1">{lastScan.fullName}</Text>
          </Card>
        ) : (
          <Text className="text-center text-gray-500 mt-4">Menunggu scan NFC...</Text>
        )}

        <Text className="font-semibold mt-4 mb-2">Riwayat Scan</Text>
        <FlatList
          data={scans}
          keyExtractor={(item, index) => `${item.uid}-${index}`}
          renderItem={({ item }) => (
            <Card className="mb-2">
              <Text className="text-gray-900">{renderPersonLine(item)}</Text>
              <Text className="text-gray-500 text-xs mt-1">{item.fullName}</Text>
              {scannedToday.has(item.uid) && (
                <Text className="text-green-600 mt-1">Sudah scan hari ini</Text>
              )}
            </Card>
          )}
        />
      </View>
    </SafeAreaView>
  );
}
