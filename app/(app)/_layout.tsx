import { Ionicons } from '@expo/vector-icons';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';
import { Link, Redirect, Tabs } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import React from 'react';
import { Platform, Pressable, Text, useWindowDimensions, View } from 'react-native';
import CustomDrawerContent from '../../components/navigation/CustomDrawerContent';
import { useAuth } from '../../hooks/useAuth';
import { useOffline } from '../../hooks/useOffline';
import { usePreferences } from '../../hooks/usePreferences';
import { SafeAreaView } from "react-native-safe-area-context";


function ConnectivityPill() {
  const { isOnline } = useOffline();
  return (
    <View className={`flex-row items-center px-2 py-1 rounded-full mr-3 ${isOnline ? 'bg-emerald-50/50' : 'bg-amber-50'}`}>
      <View className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`} />
      <Text className={`text-[10px] font-semibold uppercase tracking-wider ${isOnline ? 'text-emerald-600' : 'text-amber-700'}`}>
        {isOnline ? 'Online' : 'Offline'}
      </Text>
    </View>
  );
}

function HamburgerButton() {
  const navigation = useNavigation();
  return (
    <Pressable
      onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
      className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 items-center justify-center ml-4 active:bg-gray-100"
      hitSlop={8}
    >
      <Ionicons name="menu" size={22} color="#374151" />
    </Pressable>
  );
}

function HeaderActions() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  return (
    <View className="flex-row items-center mr-4">
      <ConnectivityPill />
      {isSuperAdmin ? (
        <Link href="/(app)/pending-approvals" asChild>
          <Pressable className="flex-row items-center bg-blue-50 rounded-full px-3 py-1.5 mr-3 active:bg-blue-100" hitSlop={8}>
            <Ionicons name="shield-checkmark" size={16} color="#2563EB" />
            <Text className="text-xs font-semibold text-blue-600 ml-1.5">Approvals</Text>
          </Pressable>
        </Link>
      ) : null}
      <Link href="/(app)/notifications" asChild>
        <Pressable className="w-9 h-9 rounded-full bg-gray-50 border border-gray-100 items-center justify-center mr-3 active:bg-gray-100" hitSlop={8}>
          <Ionicons name="notifications-outline" size={20} color="#374151" />
        </Pressable>
      </Link>
      <Link href="/(app)/settings" asChild>
        <Pressable accessibilityRole="button" className="w-9 h-9 rounded-full overflow-hidden border border-gray-200" hitSlop={8}>
          <Image
            source={{ uri: 'https://i.pravatar.cc/64?img=3' }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
          />
        </Pressable>
      </Link>
    </View>
  );
}

export default function AppLayout() {
  const { user, loading } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  if (!loading && !user) {
    return <Redirect href="/(auth)" />;
  }

  if (isDesktop) {
    return (
      <Drawer
        drawerContent={(props: any) => <CustomDrawerContent {...props} />}
        screenOptions={{
          headerShown: true,
          headerLeft: () => <HamburgerButton />,
          headerRight: () => <HeaderActions />,
          headerStyle: {
            backgroundColor: '#FFFFFF',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 2,
            borderBottomWidth: 0,
          },
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 18,
            color: '#111827',
            marginLeft: 8,
          },
          drawerType: 'slide',
          overlayColor: 'rgba(0, 0, 0, 0.4)',
          drawerStyle: {
            width: 300,
            backgroundColor: '#F8FAFC',
            borderRightWidth: 0,
            // @ts-ignore - Web shadow support
            boxShadow: Platform.OS === 'web' ? '4px 0 24px rgba(0, 0, 0, 0.12)' : undefined,
          },
          swipeEnabled: true,
          headerTintColor: '#111827',
        }}
      >
        {/* Define all screens that should be accessible via Drawer */}
        <Drawer.Screen name="index" options={{ title: 'Beranda' }} />
        <Drawer.Screen name="portal-feedback" options={{ title: 'Umpan Balik Saya' }} />

        {/* Reports */}
        <Drawer.Screen name="analytics" options={{ title: 'Analitik' }} />
        <Drawer.Screen name="system-health" options={{ title: 'Kesehatan Sistem' }} />

        {/* Settings */}
        <Drawer.Screen name="settings" options={{ title: 'Pengaturan' }} />
        <Drawer.Screen name="notifications" options={{ title: 'Notifikasi' }} />

        {/* Management Screens */}
        <Drawer.Screen name="user-management" options={{ title: 'Manajemen Pengguna', drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="school-management" options={{ title: 'Manajemen Sekolah', drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="catering-management" options={{ title: 'Manajemen Katering', drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="student-management" options={{ title: 'Manajemen Siswa', drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="health-area-management" options={{ title: 'Manajemen Wilayah Kesehatan', drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="association-management" options={{ title: 'Manajemen Asosiasi', drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="pending-approvals" options={{ title: 'Persetujuan Tertunda', drawerItemStyle: { display: 'none' } }} />

        {/* Dashboard Screens */}
        <Drawer.Screen name="admin-dashboard" options={{ title: 'Dashboard Admin', drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="sekolah-dashboard" options={{ title: 'Dashboard Sekolah', drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="catering-dashboard" options={{ title: 'Dashboard Katering', drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="dinkes-dashboard" options={{ title: 'Dashboard Dinkes', drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="admin-sekolah-dashboard" options={{ title: 'Dashboard Admin Sekolah', drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="admin-catering-dashboard" options={{ title: 'Dashboard Admin Katering', drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="admin-dinkes-dashboard" options={{ title: 'Dashboard Admin Dinkes', drawerItemStyle: { display: 'none' } }} />

        {/* Attendance Screens */}
        <Drawer.Screen name="attendance-scan" options={{ title: 'Pindai Kehadiran', drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="attendance-nfc" options={{ title: 'Kehadiran NFC', drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="attendance-history" options={{ title: 'Riwayat Kehadiran', drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="student-attendance" options={{ title: 'Kehadiran Siswa', drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="my-attendance" options={{ title: 'Kehadiran Saya', drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="admin-attendance-history" options={{ title: 'Riwayat Kehadiran Admin', drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="admin-student-management" options={{ title: 'Manajemen Siswa Admin', drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="assisted-attendance" options={{ title: 'Kehadiran Terbimbing', drawerItemStyle: { display: 'none' } }} />

        {/* Food History Screens */}
        <Drawer.Screen name="food-history-school" options={{ title: 'Riwayat Menu Sekolah', drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="food-history-catering" options={{ title: 'Riwayat Menu Katering', drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="food-history-student" options={{ title: 'Riwayat Menu Siswa', drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="admin-food-history-school" options={{ title: 'Riwayat Menu Sekolah Admin', drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="admin-food-history-catering" options={{ title: 'Riwayat Menu Katering Admin', drawerItemStyle: { display: 'none' } }} />

        {/* Feedback & Emergency Screens */}
        <Drawer.Screen name="feedback-list" options={{ title: 'Daftar Umpan Balik', drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="emergency-report" options={{ title: 'Laporan Darurat', drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="dinkes-emergency" options={{ title: 'Darurat Dinkes', drawerItemStyle: { display: 'none' } }} />

        {/* Other Hidden Screens */}
        <Drawer.Screen name="details" options={{ title: 'Detail', drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="explore" options={{ title: 'Telusuri', drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="catering-menu-qc" options={{ title: 'QC Menu Katering', drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="notifications/broadcast" options={{ title: 'Broadcast Notifikasi', drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="menu/[id]" options={{ title: 'Detail Menu', drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="dinkes-emergency/[id]" options={{ title: 'Detail Darurat', drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="emergency-report/new" options={{ title: 'Laporan Darurat Baru', drawerItemStyle: { display: 'none' } }} />
      </Drawer>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }} edges={["top", "bottom"]}>
      <Tabs
        screenOptions={{
          headerShown: true,
          headerRight: () => <HeaderActions />,
          headerStyle: {
            backgroundColor: '#FFFFFF',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 2,
            borderBottomWidth: 0,
          },
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 18,
            color: '#111827',
            marginLeft: 16,
          },
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopWidth: 1,
            borderTopColor: '#F1F5F9',
            height: Platform.OS === 'ios' ? 88 : 68,
            paddingBottom: Platform.OS === 'ios' ? 28 : 12,
            paddingTop: 12,
          },
          tabBarActiveTintColor: '#2563EB',
          tabBarInactiveTintColor: '#64748B',
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
            marginTop: 4,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Beranda',
            tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
              <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="explore"
          options={{
            title: 'Telusuri',
            tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
              <Ionicons name={focused ? 'grid' : 'grid-outline'} size={24} color={color} />
            ),
          }}
        />

        {/* Role specific tabs */}


        <Tabs.Screen
          name="settings"
          options={{
            title: 'Profil',
            tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
              <Ionicons name={focused ? 'person' : 'person-outline'} size={36} color={color} />
            ),
          }}
        />

        {/* Hide all other screens from Tab Bar but keep them accessible */}
        {[
          'admin-attendance-history', 'admin-catering-dashboard', 'admin-dashboard', 'admin-dinkes-dashboard', 'admin-food-history-catering', 'admin-food-history-school', 'admin-sekolah-dashboard', 'admin-student-management',
          'analytics', 'assisted-attendance', 'association-management', 'attendance-history', 'attendance-nfc', 'attendance-scan',
          'catering-dashboard', 'catering-management', 'catering-menu-qc', 'details', 'dinkes-dashboard', 'dinkes-emergency', 'dinkes-emergency/[id]',
          'emergency-report', 'emergency-report/new', 'feedback-list', 'food-history-catering', 'food-history-school', 'food-history-student', 'health-area-management',
          'menu/[id]', 'my-attendance', 'notifications', 'notifications/broadcast', 'pending-approvals', 'portal-feedback',
          'school-management', 'sekolah-dashboard', 'student-attendance', 'student-management', 'student-menu-schedule', 'system-health', 'user-management'
        ].map(name => (
          <Tabs.Screen key={name} name={name} options={{ href: null, headerShown: false }} />
        ))}
      </Tabs>
    </SafeAreaView>
  );
}
