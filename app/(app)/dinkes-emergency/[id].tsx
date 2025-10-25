import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import TextInput from '../../../components/ui/TextInput';
import { useAuth } from '../../../hooks/useAuth';
import { EmergencyReport, ReportStatus, fetchEmergencyReport, updateEmergencyStatus } from '../../../services/emergency';

function StatusPicker({ value, onChange }: { value: ReportStatus; onChange: (s: ReportStatus) => void }) {
  const options: ReportStatus[] = ['MENUNGGU', 'PROSES', 'SELESAI'];
  return (
    <View className="flex-row gap-2">
      {options.map((opt) => (
        <Button key={opt} title={opt === 'MENUNGGU' ? 'Menunggu' : opt === 'PROSES' ? 'Diproses' : 'Selesai'} variant={value === opt ? 'primary' : 'secondary'} onPress={() => onChange(opt)} />
      ))}
    </View>
  );
}

export default function DinkesEmergencyDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<EmergencyReport | null>(null);
  const [status, setStatus] = useState<ReportStatus>('MENUNGGU');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      if (!id) return;
      const r = await fetchEmergencyReport(String(id));
      setReport(r);
      if (r) setStatus(r.status);
      setLoading(false);
    })();
  }, [id]);

  const allowed = user?.role === 'admin dinkes' || user?.role === 'super admin';

  async function onSave() {
    if (!report) return;
    if (status === 'SELESAI' && !note.trim()) {
      Alert.alert('Catatan dibutuhkan', 'Mohon isi catatan tindak lanjut saat menandai selesai.');
      return;
    }
    setSaving(true);
    const ok = await updateEmergencyStatus(report.id, status, note.trim() || undefined);
    setSaving(false);
    if (ok) Alert.alert('Tersimpan', 'Perubahan status tersimpan.');
    else Alert.alert('Disimpan offline', 'Perubahan diantre dan akan disinkron saat online.');
  }

  return (
    <SafeAreaView className="flex-1 bg-[#f5f7fb]">
      <Stack.Screen options={{ title: 'Detail Laporan Darurat' }} />
      {!allowed ? (
        <View className="p-6"><Text>Akses ditolak.</Text></View>
      ) : loading ? (
        <View className="p-6"><Text>Memuat…</Text></View>
      ) : !report ? (
        <View className="p-6"><Text>Data tidak ditemukan.</Text></View>
      ) : (
        <ScrollView className="flex-1 bg-neutral-gray">
          <View className="p-6 gap-4">
            <Card>
              <Text className="text-xl font-bold text-gray-900 mb-1">{report.title}</Text>
              <Text className="text-gray-700 mb-2">{new Date(report.date).toLocaleString('id-ID')} • {report.schoolName}</Text>
              {report.location && <Text className="text-gray-600 mb-1">Lokasi: {report.location}</Text>}
              {typeof report.studentsAffected === 'number' && <Text className="text-gray-600 mb-1">Korban terdampak: {report.studentsAffected}</Text>}
              {report.symptoms && report.symptoms.length > 0 && <Text className="text-gray-600 mb-1">Gejala: {report.symptoms.join(', ')}</Text>}
              {report.suspectedFood && <Text className="text-gray-600 mb-1">Diduga dari: {report.suspectedFood}</Text>}
              {report.description && <Text className="text-gray-700 mt-2">{report.description}</Text>}
            </Card>

            <Card>
              <Text className="text-lg font-bold text-gray-900 mb-3">Status Penanganan</Text>
              <StatusPicker value={status} onChange={setStatus} />
            </Card>

            <Card>
              <Text className="text-lg font-bold text-gray-900 mb-3">Catatan Tindak Lanjut</Text>
              <TextInput multiline numberOfLines={4} value={note} onChangeText={setNote} placeholder="Rangkuman pemeriksaan, rujukan, edukasi, dll." />
              <Button title={saving ? 'Menyimpan…' : 'Simpan Perubahan'} onPress={onSave} loading={saving} className="mt-3" />
            </Card>

            {report.followUps && report.followUps.length > 0 && (
              <Card>
                <Text className="text-lg font-bold text-gray-900 mb-3">Riwayat Tindak Lanjut</Text>
                {report.followUps.map((f, idx) => (
                  <View key={idx} className="mb-2">
                    <Text className="text-gray-800 font-semibold">{new Date(f.at).toLocaleString('id-ID')}</Text>
                    <Text className="text-gray-700">{f.note}</Text>
                  </View>
                ))}
              </Card>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
