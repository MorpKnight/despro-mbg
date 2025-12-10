import { Stack } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { AppState, FlatList, Platform, Text, View, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

import { useAuth } from '../../hooks/useAuth';
import { useElectronNfc } from '../../hooks/useElectronNfc';
import { startScan, stopScan, type NFCSource } from '../../lib/nfc';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useOfflineMutation } from '../../hooks/useOfflineMutation';
import { recordAttendanceViaNfc, type RecordAttendanceResult } from '../../services/attendance';
import { useSnackbar } from '../../hooks/useSnackbar';

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
  const [scanMode, setScanMode] = useState<NFCSource>(Platform.OS === 'web' ? 'reader' : 'device');
  const [appActive, setAppActive] = useState(true);

  // ===== confirm popup state =====
  const [openResetConfirm, setOpenResetConfirm] = useState(false);

  // =========================
  // Electron NFC Hook (status/error)
  // =========================
  const { available, status, error } = useElectronNfc({
    enabled: Platform.OS === 'web' && scanMode === 'reader' && appActive,
  });

  const readerName = status?.reader ?? null;
  const readerStatus = status?.status ?? null; // "connected" | "disconnected"

  // show connect once
  const hasShownFirstConnectRef = useRef(false);
  // throttle error
  const lastErrorAtRef = useRef(0);

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
    if (!readerStatus) return;

    if (readerStatus === 'connected' && !hasShownFirstConnectRef.current) {
      hasShownFirstConnectRef.current = true;
      showSnackbar({
        message: readerName ? `Reader "${readerName}" siap digunakan.` : 'Reader siap digunakan.',
        variant: 'success',
      });
    }
  }, [readerStatus, readerName, scanMode, appActive]);

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
                message: 'Siswa ini sudah/ sedang diproses untuk absensi hari ini.',
                variant: 'info',
              });
              return;
            }

            try {
              // 1) insert placeholder to UI
              const scan: NFCScan = { uid, username: null, fullName: null };
              setLastScan(scan);
              setScans((prev) => [scan, ...prev].slice(0, 20));

              // 2) submit
              const result = await submitAttendance({ nfcTagId: uid });

              // 3) mark daily lock
              markScannedToday(uid);

              // 4) extract student from typed result (camelCase)
              const student = result?.record?.student;

              if (student) {
                const username = student.username ? student.username : null;
                const fullName = student.fullName ?? null;

                setLastScan((prev) =>
                  prev && prev.uid === uid ? { ...prev, username, fullName } : prev
                );

                setScans((prev) =>
                  prev.map((s) => (s.uid === uid ? { ...s, username, fullName } : s))
                );
              }

              console.log('NFC attendance recorded', result);
              // 5) feedback
              if (result && (result as any)?.queued) {
                showSnackbar({ message: 'Disimpan ke antrian offline.', variant: 'info' });
              } else {
                showSnackbar({ message: 'Kehadiran tercatat.', variant: 'success' });
              }
            } catch (err: any) {
              console.warn('[attendance-nfc] gagal kirim absensi', err);

              const raw = String(err?.message || '');
              const friendly = /409/.test(raw)
                ? 'Siswa sudah tercatat hadir hari ini.'
                : raw || 'Gagal memproses absensi.';

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
        showSnackbar({ message: 'Terjadi masalah saat pemindaian NFC.', variant: 'error' });
      }
    };

    runScan();

    return () => {
      active = false;
      stopScan().catch(() => {});
    };
  }, [paused, scanMode, appActive]);

  // =========================
  // Reset handler (dipakai modal)
  // =========================
  const handleResetToday = async () => {
    const todayKey = getJakartaDateKey();
    const storageKey = `mbg:nfc:scanned:${todayKey}`;

    try {
      await AsyncStorage.removeItem(storageKey);
    } catch (e) {
      // ignore
    }

    scannedTodayRef.current = new Set();
    inFlightRef.current = new Set();
    setScannedToday(new Set());

    showSnackbar({ message: 'Daftar scan hari ini di-reset.', variant: 'success' });
    setOpenResetConfirm(false);
  };

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
    if (scanMode === 'device') return 'Aktif (Device)';

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

      {/* ===== Confirm Popup Modal (inline, 1 file) ===== */}
      <Modal
        visible={openResetConfirm}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setOpenResetConfirm(false)}
      >
        {/* backdrop: klik area gelap untuk tutup */}
        <Pressable
          onPress={() => setOpenResetConfirm(false)}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.35)',
            padding: 20,
            justifyContent: 'center',
          }}
        >
          {/* card: stop propagation */}
          <Pressable
            onPress={() => {}}
            style={{
              backgroundColor: 'white',
              borderRadius: 12,
              padding: 16,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 6 }}>
              Reset Absensi
            </Text>
            <Text style={{ fontSize: 13.5, opacity: 0.75, marginBottom: 14 }}>
              Yakin ingin mengosongkan daftar scan hari ini?
            </Text>

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
              <Pressable
                onPress={() => setOpenResetConfirm(false)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 8,
                  backgroundColor: '#F3F4F6',
                }}
              >
                <Text style={{ fontWeight: '600', fontSize: 12 }}>Batal</Text>
              </Pressable>

              <Pressable
                onPress={handleResetToday}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 8,
                  backgroundColor: '#DC2626',
                }}
              >
                <Text style={{ fontWeight: '700', fontSize: 12, color: 'white' }}>
                  Reset
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

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

              {/* ===== Button Reset: sekarang buka modal ===== */}
              <Button
                title="Reset Hari Ini"
                variant="outline"
                size="sm"
                onPress={() => setOpenResetConfirm(true)}
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
