import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { useAuth } from '../../hooks/useAuth';
import { EmergencyReport, ReportStatus, fetchEmergencyReports } from '../../services/emergency';

function StatusBadge({ status }: { status: ReportStatus }) {
  const normalized = status.toLowerCase() as ReportStatus;
  const style = normalized === 'menunggu' ? { bg: '#FBC02D', text: '#000' } : normalized === 'proses' ? { bg: '#1976D2', text: '#FFF' } : { bg: '#4CAF50', text: '#FFF' };
  const label = normalized === 'menunggu' ? 'Menunggu' : normalized === 'proses' ? 'Diproses' : 'Selesai';
  return (
    <View style={{ alignSelf: 'flex-start', backgroundColor: style.bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }}>
      <Text style={{ color: style.text, fontSize: 12, fontWeight: '700' }}>{label}</Text>
    </View>
  );
}

export default function DinkesEmergencyListPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<EmergencyReport[]>([]);

  useEffect(() => {
    (async () => {
      const data = await fetchEmergencyReports();
      // Sort newest first
      setReports(data.sort((a, b) => +new Date(b.date) - +new Date(a.date)));
      setLoading(false);
    })();
  }, []);

  const allowed = user?.role === 'admin_dinkes' || user?.role === 'super_admin';

  return (
    <SafeAreaView className="flex-1 bg-[#f5f7fb]">
      <ScrollView className="flex-1 bg-neutral-gray">
        <View className="p-6">
          <View className="mb-4">
            <Text className="text-2xl font-bold text-gray-900">Laporan Darurat Masuk</Text>
            <Text className="text-gray-600">Kelola status dan tindak lanjut laporan dari sekolah</Text>
          </View>

          {!allowed ? (
            <Card>
              <Text>Akses ditolak.</Text>
            </Card>
          ) : loading ? (
            <Card>
              <Text>Memuat…</Text>
            </Card>
          ) : reports.length === 0 ? (
            <Card>
              <Text>Tidak ada laporan darurat.</Text>
            </Card>
          ) : (
            <View className="gap-3">
              {reports.map((r) => (
                <Pressable key={r.id} onPress={() => router.push(`/dinkes-emergency/${r.id}` as any)}>
                  <Card className="p-4">
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1 pr-3">
                        <Text className="font-semibold text-gray-900 mb-1">{new Date(r.date).toLocaleString('id-ID')}</Text>
                        <Text className="text-gray-800 mb-1">{r.title} • <Text className="font-semibold">{r.schoolName}</Text></Text>
                        {r.schoolAddress && <Text className="text-gray-600 mb-1">{r.schoolAddress}</Text>}
                        <StatusBadge status={r.status} />
                      </View>
                      <View>
                        <Button title="Kelola" variant="secondary" onPress={() => router.push(`/dinkes-emergency/${r.id}` as any)} />
                      </View>
                    </View>
                  </Card>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
