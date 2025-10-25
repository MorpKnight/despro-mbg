import { useIsFocused } from '@react-navigation/native';
import { Stack } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, AppState, FlatList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { QRScanner } from '../../components/features/attendance';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import TextInput from '../../components/ui/TextInput';
import { useAuth } from '../../hooks/useAuth';

// Dummy dataset for search (can be replaced with API later)
const STUDENTS: { id: string; name: string; kelas?: string }[] = [
  { id: 'S1001', name: 'Ahmad Rizki', kelas: '5A' },
  { id: 'S1002', name: 'Siti Nurhaliza', kelas: '4B' },
  { id: 'S1003', name: 'Budi Santoso', kelas: '6C' },
  { id: 'S1004', name: 'Lina Puspa', kelas: '6C' },
  { id: 'S1005', name: 'Rangga', kelas: '3A' },
  { id: 'S1006', name: 'Dafa', kelas: '3C' },
  { id: 'S1007', name: 'Tia', kelas: '5A' },
];

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
  const isAllowed = user?.role === 'admin sekolah' || user?.role === 'super admin';
  const isFocused = useIsFocused();

  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<{ id: string; name: string } | null>(null);

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

  const [records, setRecords] = useState<{ id: string; studentId: string; studentName?: string; timestamp: string; method: 'manual' | 'qr-dibantu'; admin: string }[]>([]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return STUDENTS;
    return STUDENTS.filter(s => s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q));
  }, [query]);

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

  function recordAttendance(opts: { studentId: string; studentName?: string; method: 'manual' | 'qr-dibantu' }) {
    const rec = { id: `att_${Date.now()}`, studentId: opts.studentId, studentName: opts.studentName, timestamp: new Date().toISOString(), method: opts.method, admin: user?.username || 'unknown' };
    setRecords(prev => [rec, ...prev]);
    console.log('Assisted attendance recorded:', rec);
    Alert.alert('Tercatat', `Kehadiran ${opts.studentName || opts.studentId} berhasil dicatat (${opts.method}).`);
  }

  function onConfirmManual() {
    if (!selected) return;
    recordAttendance({ studentId: selected.id, studentName: selected.name, method: 'manual' });
  }

  function onConfirmScan() {
    if (!scanResult) return;
    recordAttendance({ studentId: scanResult.id, studentName: scanResult.name, method: 'qr-dibantu' });
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
                  <FlatList
                    data={filtered}
                    keyExtractor={(s) => s.id}
                    ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                    renderItem={({ item: s }) => (
                      <Card className={`p-3 ${selected?.id === s.id ? 'ring-2 ring-primary' : ''}` as any}>
                        <View className="flex-row items-center justify-between">
                          <View>
                            <Text className="font-semibold text-gray-900">{s.name}</Text>
                            <Text className="text-gray-600 text-sm">ID: {s.id}{s.kelas ? ` • Kelas ${s.kelas}` : ''}</Text>
                          </View>
                          <Button title={selected?.id === s.id ? 'Dipilih' : 'Pilih'} variant={selected?.id === s.id ? 'primary' : 'secondary'} onPress={() => setSelected({ id: s.id, name: s.name })} />
                        </View>
                      </Card>
                    )}
                  />
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
                      <Text className="text-gray-600 text-sm">{new Date(r.timestamp).toLocaleString('id-ID')} • {r.method} • oleh {r.admin}</Text>
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
