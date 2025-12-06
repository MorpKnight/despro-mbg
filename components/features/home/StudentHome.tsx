import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import { useResponsive } from '../../../hooks/useResponsive';

interface Props {
  username?: string | null;
}

export function StudentHome({ username }: Props) {
  const { isMobile } = useResponsive();
  const router = useRouter();

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
            Halo{username ? `, ${username}` : ''} 👋
          </Text>
          <Text className={`${isMobile ? 'text-sm' : 'text-base'} text-gray-600`}>
            Lihat menu hari ini dan riwayat presensi kamu.
          </Text>
        </View>

        {/* Today menu placeholder */}
        <Card className={isMobile ? 'mb-6 p-4' : 'mb-8 p-6'}>
          <Text className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-gray-900 mb-2`}>
            Menu Hari Ini
          </Text>
          <Text className="text-sm text-gray-600 mb-3">
            Di sini nanti akan tampil menu makan siang dari katering sekolahmu.
          </Text>
          <Button
            title="Lihat Daftar Menu"
            variant="outline"
            icon={<Ionicons name="restaurant" size={20} color="#2563EB" />}
            fullWidth
            onPress={() => router.push('/food-history-student')}
          />
        </Card>

        {/* Attendance & feedback quick actions */}
        <Card>
          <Text className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-gray-900 mb-4`}>
            Aksi Cepat
          </Text>
          <View className="gap-3">
            <Button
              title="Lihat Riwayat Presensi"
              variant="primary"
              icon={<Ionicons name="calendar" size={20} color="white" />}
              fullWidth
              onPress={() => router.push('/my-attendance')}
            />
            <Button
              title="Kirim Feedback Makanan"
              variant="outline"
              icon={<Ionicons name="chatbubbles" size={20} color="#2563EB" />}
              fullWidth
              onPress={() => router.push('/portal-feedback')}

            />
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
