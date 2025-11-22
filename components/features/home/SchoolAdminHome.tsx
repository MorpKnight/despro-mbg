import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Grid from '../../../components/layout/Grid';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Skeleton from '../../../components/ui/Skeleton';
import { useResponsive } from '../../../hooks/useResponsive';
import { fetchAttendanceSummary, type AttendanceSummary } from '../../../services/attendance';
import { fetchEmergencyReports, type EmergencyReport } from '../../../services/emergency';

interface Props {
  username?: string | null;
}

export function SchoolAdminHome({ username }: Props) {
  const { isMobile } = useResponsive();
  const router = useRouter();
  const [attendance, setAttendance] = useState<AttendanceSummary | null>(null);
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);
  const [emergencies, setEmergencies] = useState<EmergencyReport[]>([]);
  const [emergencyLoading, setEmergencyLoading] = useState(true);
  const [emergencyError, setEmergencyError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const [attendanceData, emergencyData] = await Promise.all([
          fetchAttendanceSummary(),
          fetchEmergencyReports(),
        ]);

        if (!active) return;
        setAttendance(attendanceData);
        setAttendanceError(null);
        setEmergencies(emergencyData);
        setEmergencyError(null);
      } catch (err) {
        console.error('[school-admin-home] failed to load data', err);
        if (!active) return;
        setAttendanceError('Gagal memuat ringkasan presensi.');
        setEmergencyError('Gagal memuat laporan darurat.');
      } finally {
        if (!active) return;
        setAttendanceLoading(false);
        setEmergencyLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  return (
    <SafeAreaView
      className="flex-1 bg-gray-50"
      edges={['top', 'bottom', 'left', 'right']}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: isMobile ? 16 : 32, paddingBottom: isMobile ? 24 : 48 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className={isMobile ? 'mb-6' : 'mb-8'}>
          <Text className={`${isMobile ? 'text-3xl' : 'text-4xl'} font-bold text-gray-900 mb-1`}>
            Dashboard Admin Sekolah
          </Text>
          <Text className={`${isMobile ? 'text-sm' : 'text-base'} text-gray-600`}>
            Selamat datang{username ? `, ${username}` : ''} — pantau kehadiran dan kondisi siswa.
          </Text>
        </View>

        {/* Quick Stats */}
        <Grid
          mobileColumns={1}
          tabletColumns={2}
          desktopColumns={3}
          gap={isMobile ? 3 : 4}
          className={isMobile ? 'mb-6' : 'mb-8'}
        >
          <Card className="p-4 flex-row items-center justify-between">
            <View>
              <Text className="text-sm text-gray-600 mb-1">Total Siswa</Text>
              {attendanceLoading ? (
                <Skeleton height={24} width={80} rounded={8} />
              ) : (
                <Text className="text-2xl font-bold text-gray-900">
                  {attendance?.totalStudents ?? 0}
                </Text>
              )}
            </View>
            <Ionicons name="people" size={28} color="#3B82F6" />
          </Card>
          <Card className="p-4 flex-row items-center justify-between">
            <View>
              <Text className="text-sm text-gray-600 mb-1">Hadir Hari Ini</Text>
              {attendanceLoading ? (
                <Skeleton height={24} width={80} rounded={8} />
              ) : (
                <Text className="text-2xl font-bold text-gray-900">
                  {attendance?.presentToday ?? 0}
                </Text>
              )}
            </View>
            <Ionicons name="checkmark-circle" size={28} color="#10B981" />
          </Card>
          <Card className="p-4 flex-row items-center justify-between">
            <View>
              <Text className="text-sm text-gray-600 mb-1">Laporan Darurat Aktif</Text>
              {emergencyLoading ? (
                <Skeleton height={24} width={80} rounded={8} />
              ) : (
                <Text className="text-2xl font-bold text-gray-900">
                  {emergencies.filter((e) => e.status !== 'selesai').length}
                </Text>
              )}
            </View>
            <Ionicons name="warning" size={28} color="#EF4444" />
          </Card>
        </Grid>

        {(attendanceError || emergencyError) && (
          <Text className="text-xs text-red-600 mb-4">
            {attendanceError || emergencyError}
          </Text>
        )}

        {/* Quick Actions */}
        <Card className={isMobile ? 'mb-6 p-4' : 'mb-8 p-6'}>
          <Text className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-gray-900 mb-4`}>
            Aksi Cepat
          </Text>
          <View className="gap-3">
            <Button
              title="Mulai Presensi (Scan)"
              variant="primary"
              icon={<Ionicons name="qr-code" size={20} color="white" />}
              fullWidth
              onPress={() => router.push('/(app)/attendance-scan')}
            />
            <Button
              title="Presensi Pendampingan"
              variant="outline"
              icon={<Ionicons name="people-circle" size={20} color="#2563EB" />}
              fullWidth
              onPress={() => router.push('/(app)/assisted-attendance')}
            />
            <Button
              title="Laporkan Kejadian Darurat"
              variant="ghost"
              icon={<Ionicons name="warning" size={20} color="#DC2626" />}
              fullWidth
              onPress={() => router.push('/(app)/emergency-report')}
            />
          </View>
        </Card>

        {/* Recent emergencies */}
        <Card>
          <Text className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-gray-900 mb-3`}>
            Laporan Darurat Terbaru
          </Text>
          {emergencyLoading ? (
            <View className="gap-3">
              <Skeleton height={48} rounded={12} />
              <Skeleton height={48} rounded={12} />
            </View>
          ) : emergencies.length === 0 ? (
            <Text className="text-sm text-gray-600">
              Belum ada laporan darurat yang masuk.
            </Text>
          ) : (
            emergencies
              .slice(0, 5)
              .map((report) => (
                <View
                  key={report.id}
                  className="py-3 border-b border-gray-100 last:border-b-0"
                >
                  <Text className="text-sm font-semibold text-gray-900">
                    {report.title}
                  </Text>
                  <Text className="text-xs text-gray-600 mt-0.5">
                    {report.schoolName} • {new Date(report.date).toLocaleString('id-ID')}
                  </Text>
                  {report.status !== 'selesai' && (
                    <Text className="mt-1 text-xs font-medium text-amber-700">
                      Status: {report.status.toUpperCase()}
                    </Text>
                  )}
                </View>
              ))
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
