import { Redirect } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CateringAdminHome } from '../../components/features/home/CateringAdminHome';
import { DinkesAdminHome } from '../../components/features/home/DinkesAdminHome';
import { SchoolAdminHome } from '../../components/features/home/SchoolAdminHome';
import { StudentHome } from '../../components/features/home/StudentHome';
import { SuperAdminHome } from '../../components/features/home/SuperAdminHome';
import { useAuth } from '../../hooks/useAuth';
import type { Role } from '../../services/session';

function RoleNotSupported({ role }: { role: string | null | undefined }) {
  return (
    <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center" edges={["top", "bottom", "left", "right"]}>
      <View className="items-center px-8">
        <Text className="text-2xl font-bold text-gray-900 mb-2">Peran belum didukung</Text>
        <Text className="text-sm text-gray-600 text-center">
          Peran <Text className="font-semibold">{role ?? 'tidak diketahui'}</Text> belum memiliki beranda khusus.
          Silakan hubungi administrator sistem.
        </Text>
      </View>
    </SafeAreaView>
  );
}

export default function AppHome() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center" edges={["top", "bottom", "left", "right"]}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="text-gray-500 mt-4">Memuat profil pengguna...</Text>
      </SafeAreaView>
    );
  }

  if (!user) {
    return <Redirect href="/(auth)" />;
  }

  const role = user.role as Role | undefined;

  switch (role) {
    case 'super_admin':
      return <SuperAdminHome username={user.username} />;
    case 'admin_sekolah':
      return <SchoolAdminHome username={user.username} />;
    case 'admin_catering':
      return <CateringAdminHome username={user.username} cateringId={user.catering_id ?? undefined} />;
    case 'admin_dinkes':
      return <DinkesAdminHome username={user.username} healthOfficeArea={user.health_office_area ?? undefined} />;
    case 'siswa':
      return <StudentHome username={user.username} />;
    default:
      return <RoleNotSupported role={role} />;
  }
}
