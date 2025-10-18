import { Ionicons } from '@expo/vector-icons';
import { Redirect } from 'expo-router';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { useAuth } from '../../hooks/useAuth';

type ReportStatus = 'MENUNGGU' | 'PROSES' | 'SELESAI';

interface ReportItem {
  id: string;
  date: string; // ISO or formatted
  title: string; // short summary
  status: ReportStatus;
}

export default function EmergencyReportPage() {
  const { user } = useAuth();
  if (user?.role !== 'admin sekolah' && user?.role !== 'super admin') return <Redirect href="/" />;

  // Example list (newest first)
  const reports: ReportItem[] = [
    { id: 'r1', date: '2025-10-18', title: 'Dugaan Keracunan Makanan', status: 'PROSES' },
    { id: 'r2', date: '2025-10-16', title: 'Alergi Kacang - 1 siswa', status: 'SELESAI' },
    { id: 'r3', date: '2025-10-12', title: 'Keluhan Mual Setelah Makan', status: 'MENUNGGU' },
  ];

  const badgeColor = (s: ReportStatus) =>
    s === 'MENUNGGU' ? { bg: '#FBC02D', text: '#000000' } : s === 'PROSES' ? { bg: '#1976D2', text: '#FFFFFF' } : { bg: '#4CAF50', text: '#FFFFFF' };

  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <ScrollView className="flex-1 bg-neutral-gray">
      <View className="p-6">
        <View className="mb-4">
          <Text className="text-2xl font-bold text-gray-900">Daftar Laporan Darurat</Text>
        </View>

        <Card className="mb-4">
          <View className="flex-row">
            <View className="flex-1">
              <Button
                title="+ Buat Laporan Baru"
                className="w-full"
                style={{ backgroundColor: '#E53935' }}
                onPress={() => {
                  // TODO: open create report flow
                  console.log('create emergency report');
                }}
              />
            </View>
          </View>
          <View className="absolute left-4 top-4">
            <Ionicons name="add-circle" size={20} color="#FFFFFF" />
          </View>
        </Card>

        {reports.length === 0 ? (
          <View className="items-center justify-center py-12">
            <Ionicons name="medkit-outline" size={40} color="#9CA3AF" />
            <Text className="text-gray-500 mt-2 text-center">Tidak ada laporan darurat yang dibuat. Gunakan tombol di atas untuk membuat laporan baru.</Text>
          </View>
        ) : (
          <View className="gap-3">
            {reports.map((r) => {
              const colors = badgeColor(r.status);
              return (
                <Card key={r.id} className="p-4">
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 pr-3">
                      <Text className="font-semibold text-gray-900 mb-1">{fmtDate(r.date)} - {r.title}</Text>
                      <View style={{ alignSelf: 'flex-start', backgroundColor: colors.bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }}>
                        <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700' }}>
                          {r.status === 'MENUNGGU' ? 'Menunggu Penanganan' : r.status === 'PROSES' ? 'Sedang Ditangani' : 'Selesai'}
                        </Text>
                      </View>
                    </View>
                    <View>
                      <Text className="text-primary font-semibold">Lihat Detail</Text>
                    </View>
                  </View>
                </Card>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
