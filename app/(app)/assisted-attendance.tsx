import { useIsFocused } from '@react-navigation/native';
import { Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, AppState, FlatList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { QRScanner } from '../../components/features/attendance';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import TextInput from '../../components/ui/TextInput';
import { useAuth } from '../../hooks/useAuth';
import {
    recordAttendance,
    searchAttendanceStudents,
    type AttendanceMethod,
    type AttendanceStudent,
} from '../../services/attendance';

function methodLabel(method: AttendanceMethod) {
  switch (method) {
    case 'nfc':
      return 'NFC';
    case 'qr':
      return 'QR';
    case 'assisted':
      return 'Pendampingan';
    default:
      return 'Manual';
  }
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function parseQrPayload(input: string): { id: string; name?: string; source: 'json' | 'url' | 'plain'; raw: string } {
  const raw = String(input ?? '');
  try {
    const obj = JSON.parse(raw);
    if (obj && typeof obj === 'object' && typeof obj.id === 'string') {
      return { raw, id: obj.id.trim(), name: typeof obj.name === 'string' ? obj.name.trim() : undefined, source: 'json' };
    }
  } catch {}
  try {
    const u = new URL(raw);
    const sid = u.searchParams.get('studentId') || u.searchParams.get('id') || '';
    if (sid) return { raw, id: sid.trim(), source: 'url' } as const;
    const segs = u.pathname.split('/').filter(Boolean);
    if (segs.length > 0) return { raw, id: segs[segs.length - 1].trim(), source: 'url' } as const;
  } catch {}
  const plain = raw.trim();
  if (/^[A-Za-z0-9_-]{1,64}$/.test(plain)) return { raw, id: plain, source: 'plain' } as const;
  return { raw, id: plain.slice(0, 64) || 'UNKNOWN', source: 'plain' } as const;
}

export default function AssistedAttendancePage() {
  const { user } = useAuth();
  const isAllowed = user?.role === 'admin_sekolah' || user?.role === 'super_admin';
  const isFocused = useIsFocused();

  const [query, setQuery] = useState('');
  const [students, setStudents] = useState<AttendanceStudent[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [studentsError, setStudentsError] = useState<string | null>(null);
  const [selected, setSelected] = useState<AttendanceStudent | null>(null);

  const [cameraOn, setCameraOn] = useState(true);
  const [paused, setPaused] = useState(false);
  const [scanResult, setScanResult] = useState<{ id: string; name?: string; raw: string } | null>(null);
  const [appActive, setAppActive] = useState(true);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      setAppActive(state === 'active');
    });
    return () => sub.remove();
  }, []);

  const [records, setRecords] = useState<{ id: string; studentId: string; studentName?: string; timestamp: string; method: AttendanceMethod; admin: string }[]>([]);

  useEffect(() => {
    if (!isAllowed) {
      setStudents([]);
      setStudentsLoading(false);
      return;
    }

    let active = true;
    setStudentsLoading(true);
    setStudentsError(null);
    const handle = setTimeout(() => {
      const searchTerm = query.trim();
      searchAttendanceStudents({ query: searchTerm || undefined, limit: 25 })
        .then((list) => {
          if (!active) return;
          setStudents(list);
        })
        .catch((err) => {
          console.warn('[assisted-attendance] gagal memuat siswa', err);
          if (!active) return;
          setStudents([]);
          setStudentsError('Gagal memuat daftar siswa.');
        })
        .finally(() => {
          if (active) setStudentsLoading(false);
        });
    }, 300);

    return () => {
      active = false;
      clearTimeout(handle);
    };
  }, [query, isAllowed]);

  if (!isAllowed) {
    return (
      <SafeAreaView className="flex-1 bg-[#f5f7fb]">
        <Stack.Screen options={{ title: 'Bantuan Presensi Siswa' }} />
        <View className="p-6">
          <Card><Text>Akses ditolak.</Text></Card>
        </View>
      </SafeAreaView>
    );
  }

  async function recordAndNotify(studentId: string, studentName: string | undefined, method: AttendanceMethod) {
    try {
      const result = await recordAttendance(studentId, method);
      const timestamp = result.record?.createdAt ?? new Date().toISOString();
      setRecords((prev) => [
        {
          id: `att_${Date.now()}`,
          studentId,
          studentName,
          timestamp,
          method,
          admin: user?.username || 'unknown',
        },
        ...prev,
      ]);

      const title = result.queued ? 'Disimpan Offline' : 'Tercatat';
      const message = result.queued
        ? `${studentName || studentId} akan disinkron saat koneksi kembali tersedia.`
        : `${studentName || studentId} berhasil dicatat (${methodLabel(method)}).`;

      Alert.alert(title, message);
    } catch (err: any) {
      console.warn('[assisted-attendance] record failed', err);
      const rawMessage = String(err?.message || '');
      const friendly = /409/.test(rawMessage)
        ? 'Siswa sudah tercatat hadir untuk hari ini.'
        : rawMessage || 'Tidak dapat mencatat kehadiran.';
      Alert.alert('Gagal', friendly);
    }
  }

  async function onConfirmManual() {
    if (!selected) return;
    await recordAndNotify(selected.id, selected.fullName || selected.username, 'manual');
  }

  async function onConfirmScan() {
    if (!scanResult) return;
    await recordAndNotify(scanResult.id, scanResult.name, 'assisted');
    setScanResult(null);
    setPaused(false);
  }

  function onScanSuccess(data: string) {
    setPaused(true);
    const parsed = parseQrPayload(data);
    if (!parsed.id || parsed.id === 'UNKNOWN') {
      Alert.alert('QR tidak valid', 'Tidak dapat mengenali ID siswa.');
      setPaused(false);
      return;
    }
    setScanResult({ id: parsed.id, name: parsed.name, raw: parsed.raw });
  }

  function onScanError(err: Error) {
    Alert.alert('Gagal Memindai', err.message || 'Terjadi kesalahan.');
  }

  return (
    <SafeAreaView className="flex-1 bg-[#f5f7fb]">
      <Stack.Screen options={{ title: 'Bantuan Presensi Siswa' }} />
      <FlatList
        contentContainerStyle={{ padding: 16, gap: 12 }}
        data={[{ key: 'manual' }, { key: 'scan' }, { key: 'recent' }]}
        keyExtractor={(item) => String(item.key)}
        renderItem={({ item }) => {
          if (item.key === 'manual') {
            return (
              <Card>
                <Text className="text-lg font-bold text-gray-900 mb-3">Opsi 1: Tandai Manual</Text>
                <Text className="text-gray-700 mb-2">Cari siswa berdasarkan nama atau ID.</Text>
                <TextInput value={query} onChangeText={setQuery} placeholder="Cari nama atau ID siswa…" />
                <View className="mt-3" />
                <View style={{ maxHeight: 220 }}>
                  {studentsLoading ? (
                    <Text className="text-gray-500">Memuat daftar siswa…</Text>
                  ) : studentsError ? (
                    <Text className="text-accent-red">{studentsError}</Text>
                  ) : students.length === 0 ? (
                    <Text className="text-gray-500">Tidak ada siswa ditemukan.</Text>
                  ) : (
                    <FlatList
                      data={students}
                      keyExtractor={(s) => s.id}
                      ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                      renderItem={({ item: s }) => {
                        const isSelected = selected?.id === s.id;
                        return (
                          <View
                            className={`rounded-card p-3 shadow-card border ${isSelected ? 'border-primary bg-primary/5' : 'border-gray-200 bg-white'}`}
                          >
                            <View className="flex-row items-center justify-between">
                              <View className="flex-1 pr-3">
                                <Text className="font-semibold text-gray-900">{s.fullName || s.username}</Text>
                                <Text className="text-gray-600 text-sm">ID: {s.username}</Text>
                              </View>
                              <Button
                                title={isSelected ? 'Dipilih' : 'Pilih'}
                                variant={isSelected ? 'primary' : 'secondary'}
                                onPress={() => setSelected(s)}
                              />
                            </View>
                          </View>
                        );
                      }}
                    />
                  )}
                </View>
                <View className="mt-3">
                  <Button title="Tandai Hadir Manual" disabled={!selected} onPress={onConfirmManual} />
                </View>
              </Card>
            );
          }
          if (item.key === 'scan') {
            return (
              <Card>
                <Text className="text-lg font-bold text-gray-900 mb-3">Opsi 2: Scan QR Kartu Siswa</Text>
                <View className="mb-2">
                  <Button title={cameraOn ? 'Matikan Kamera' : 'Nyalakan Kamera'} variant={cameraOn ? 'secondary' : 'primary'} onPress={() => { setCameraOn(on => !on); if (!cameraOn) setPaused(false); }} />
                </View>
                <QRScanner onScanSuccess={onScanSuccess} onScanError={onScanError} paused={paused} cameraEnabled={cameraOn && isFocused && appActive} />
                {scanResult && (
                  <View className="mt-3">
                    <Text className="text-gray-900 font-semibold">Terbaca:</Text>
                    <Text className="text-gray-700">ID: {scanResult.id}{scanResult.name ? ` • Nama: ${scanResult.name}` : ''}</Text>
                    <View className="mt-2 flex-row gap-2">
                      <Button title="Konfirmasi Kehadiran" onPress={onConfirmScan} />
                      <Button title="Batal" variant="secondary" onPress={() => { setScanResult(null); setPaused(false); }} />
                    </View>
                  </View>
                )}
              </Card>
            );
          }
          // recent
          return (
            <Card>
              <Text className="text-lg font-bold text-gray-900 mb-3">Tercatat Terakhir</Text>
              {records.length === 0 ? (
                <Text className="text-gray-600">Belum ada pencatatan.</Text>
              ) : (
                <View className="gap-2">
                  {records.slice(0, 5).map((r) => (
                    <View key={r.id} className="bg-gray-50 rounded-lg p-3">
                      <Text className="font-semibold text-gray-900">{r.studentName || r.studentId}</Text>
                      <Text className="text-gray-600 text-sm">
                        {formatDateTime(r.timestamp)} • {methodLabel(r.method)} • oleh {r.admin}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </Card>
          );
        }}
      />
    </SafeAreaView>
  );
}
