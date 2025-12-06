import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Dropdown, { DropdownOption } from '../../components/ui/Dropdown';
import PageHeader from '../../components/ui/PageHeader';
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

const statusFilterOptions: DropdownOption[] = [
  { label: 'Semua Status', value: 'all' },
  { label: 'Menunggu', value: 'menunggu' },
  { label: 'Diproses', value: 'proses' },
  { label: 'Selesai', value: 'selesai' },
];

export default function DinkesEmergencyPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo: string }>();
  const [reports, setReports] = useState<EmergencyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [schoolSearch, setSchoolSearch] = useState('');

  const loadReports = async () => {
    try {
      const data = await fetchEmergencyReports();
      // Sort by date descending
      const sorted = data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setReports(sorted);
    } catch (error) {
      console.error('Failed to load emergency reports', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadReports();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadReports();
  };

  const filteredReports = useMemo(() => {
    let filtered = reports;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status.toLowerCase() === statusFilter);
    }

    // Filter by school name
    if (schoolSearch.trim()) {
      const query = schoolSearch.toLowerCase();
      filtered = filtered.filter(r =>
        r.schoolName.toLowerCase().includes(query) ||
        (r.schoolAddress && r.schoolAddress.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [reports, statusFilter, schoolSearch]);

  const allowed = user?.role === 'admin_dinkes' || user?.role === 'super_admin';

  return (
    <SafeAreaView className="flex-1 bg-[#f5f7fb]">
      <View className="flex-1 bg-neutral-gray p-6">
        <PageHeader
          title="Laporan Darurat Masuk"
          subtitle="Kelola status dan tindak lanjut laporan dari sekolah"
          backPath={returnTo}
          className="mb-6"
        />

        {!allowed ? (
          <Card>
            <Text>Akses ditolak.</Text>
          </Card>
        ) : (
          <>
            {/* Filters */}
            <Card className="mb-4 p-4">
              <View className="gap-3">
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Dropdown
                      label="Filter Status"
                      options={statusFilterOptions}
                      value={statusFilter}
                      onValueChange={setStatusFilter}
                    />
                  </View>
                </View>
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-1">Cari Sekolah</Text>
                  <View className="flex-row items-center bg-white border border-gray-300 rounded-lg px-3 h-12">
                    <Ionicons name="search" size={20} color="#9CA3AF" />
                    <TextInput
                      className="flex-1 ml-2 text-base text-gray-900"
                      placeholder="Nama atau alamat sekolah..."
                      value={schoolSearch}
                      onChangeText={setSchoolSearch}
                    />
                  </View>
                </View>
              </View>
            </Card>

            {loading ? (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" color="#1976D2" />
              </View>
            ) : (
              <FlatList
                data={filteredReports}
                keyExtractor={(item) => item.id}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                  <Card>
                    <Text className="text-center text-gray-500">
                      {statusFilter !== 'all' || schoolSearch.trim()
                        ? 'Tidak ada laporan yang sesuai dengan filter.'
                        : 'Tidak ada laporan darurat.'}
                    </Text>
                  </Card>
                }
                renderItem={({ item: r }) => (
                  <Pressable onPress={() => router.push(`/dinkes-emergency/${r.id}` as any)}>
                    <Card className="mb-3 p-4">
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
                )}
                contentContainerStyle={{ paddingBottom: 20 }}
              />
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
