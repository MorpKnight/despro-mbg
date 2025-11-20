import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Link, Redirect } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import React, { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import CustomDrawerContent from '../../components/navigation/CustomDrawerContent';
import { ROLE_LABEL_EN, ROLE_LABEL_ID, type UserRoleValue } from '../../constants/roles';
import { useAuth } from '../../hooks/useAuth';
import { useOffline } from '../../hooks/useOffline';
import { usePreferences } from '../../hooks/usePreferences';

function HeaderTitle() {
  const { user } = useAuth();
  const { language } = usePreferences();
  const label = useMemo(() => {
    if (!user?.role) return null;
    const map = language === 'en' ? ROLE_LABEL_EN : ROLE_LABEL_ID;
    return map[user.role as UserRoleValue];
  }, [language, user?.role]);

  return (
    <View>
      <Text className="text-xl font-bold text-gray-900">MBGlance</Text>
      {label ? (
        <Text className="text-xs text-gray-500 mt-0.5">{label}</Text>
      ) : null}
    </View>
  );
}

function ConnectivityPill() {
  const { isOnline } = useOffline();
  return (
    <View className={`flex-row items-center px-2.5 py-1 rounded-full mr-2 ${isOnline ? 'bg-emerald-50' : 'bg-amber-100'}`}>
      <View className={`w-2 h-2 rounded-full mr-1.5 ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`} />
      <Text className={`text-xs font-semibold ${isOnline ? 'text-emerald-600' : 'text-amber-700'}`}>
        {isOnline ? 'Online' : 'Offline'}
      </Text>
    </View>
  );
}

function HeaderActions() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  return (
    <View className="flex-row items-center">
      <ConnectivityPill />
      {isSuperAdmin ? (
        <Link href="/(app)/pending-approvals" asChild>
          <Pressable className="flex-row items-center bg-blue-50 border border-blue-200 rounded-full px-3 py-1 mr-2" hitSlop={8}>
            <Ionicons name="shield-checkmark" size={16} color="#1D4ED8" />
            <Text className="text-xs font-semibold text-[#1D4ED8] ml-1">Approvals</Text>
          </Pressable>
        </Link>
      ) : null}
      <Link href="/(app)/notifications" asChild>
        <Pressable className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center mr-2" hitSlop={8}>
          <Ionicons name="notifications-outline" size={18} color="#111827" />
        </Pressable>
      </Link>
      <Link href="/(app)/settings" asChild>
        <Pressable accessibilityRole="button" className="w-9 h-9 rounded-full overflow-hidden bg-gray-200" hitSlop={8}>
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

export default function AppDrawerLayout() {
  const { user, loading } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  const isSiswa = user?.role === 'siswa';
  if (!loading && !user) {
    return <Redirect href="/(auth)" />;
  }
  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerTitle: () => <HeaderTitle />,
        headerRight: () => <HeaderActions />,
        headerTitleStyle: { fontWeight: '700' },
        headerTintColor: '#111827',
        headerStyle: { backgroundColor: '#FFFFFF' },
        drawerType: 'front',
        drawerStyle: { width: 280, backgroundColor: '#FFFFFF' },
        drawerActiveTintColor: '#1976D2',
        drawerInactiveTintColor: '#374151',
        drawerActiveBackgroundColor: 'rgba(25,118,210,0.08)',
        drawerLabelStyle: { fontSize: 16, marginLeft: -12 },
        drawerItemStyle: { marginVertical: 6, borderRadius: 12 },
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          title: 'Home',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="settings"
        options={{
          title: 'Settings',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen name="student-attendance" options={{ title: 'Absensi Harian', drawerIcon: ({ color, size }) => (<Ionicons name="checkmark-done-outline" size={size} color={color} />) }} />
      <Drawer.Screen name="attendance-scan" options={{ title: 'Scan Kehadiran', drawerIcon: ({ color, size }) => (<Ionicons name="qr-code-outline" size={size} color={color} />) }} />
      <Drawer.Screen name="assisted-attendance" options={{ title: 'Bantuan Presensi', drawerIcon: ({ color, size }) => (<Ionicons name="hand-left-outline" size={size} color={color} />) }} />
      <Drawer.Screen name="emergency-report" options={{ title: 'Laporan Darurat', drawerIcon: ({ color, size }) => (<Ionicons name="warning-outline" size={size} color={color} />) }} />
      <Drawer.Screen name="feedback-list" options={{ title: 'Umpan Balik Siswa', drawerIcon: ({ color, size }) => (<Ionicons name="chatbubbles-outline" size={size} color={color} />) }} />
      <Drawer.Screen name="portal-feedback" options={{ title: 'Portal Feedback', drawerIcon: ({ color, size }) => (<Ionicons name="chatbox-outline" size={size} color={color} />), drawerItemStyle: isSiswa ? undefined : { display: 'none' } }} />
      <Drawer.Screen name="catering-menu-qc" options={{ title: 'Input Menu Harian & QC', drawerIcon: ({ color, size }) => (<Ionicons name="create-outline" size={size} color={color} />) }} />
      <Drawer.Screen name="dinkes-emergency" options={{ title: 'Kelola Laporan Darurat', drawerIcon: ({ color, size }) => (<Ionicons name="medkit-outline" size={size} color={color} />) }} />


      {/* Role-specific dashboards */}
      <Drawer.Screen name="admin-dashboard" options={{ title: 'Admin Dashboard', drawerIcon: ({ color, size }) => (<Ionicons name="shield-checkmark-outline" size={size} color={color} />), drawerItemStyle: isSuperAdmin ? undefined : { display: 'none' } }} />
      <Drawer.Screen name="sekolah-dashboard" options={{ title: 'Sekolah Dashboard', drawerIcon: ({ color, size }) => (<Ionicons name="school-outline" size={size} color={color} />) }} />
      <Drawer.Screen name="catering-dashboard" options={{ title: 'Catering Dashboard', drawerIcon: ({ color, size }) => (<Ionicons name="restaurant-outline" size={size} color={color} />) }} />
      <Drawer.Screen name="dinkes-dashboard" options={{ title: 'Dinkes Dashboard', drawerIcon: ({ color, size }) => (<Ionicons name="medical-outline" size={size} color={color} />) }} />

      {/* Super Admin feature pages */}
      <Drawer.Screen
        name="user-management"
        options={{
          title: 'Manajemen Pengguna',
          drawerIcon: ({ color, size }) => (<Ionicons name="people-outline" size={size} color={color} />),
          drawerItemStyle: isSuperAdmin ? undefined : { display: 'none' },
        }}
      />
      <Drawer.Screen
        name="system-health"
        options={{
          title: 'Kesehatan & Log Sistem',
          drawerIcon: ({ color, size }) => (<Ionicons name="pulse-outline" size={size} color={color} />),
          drawerItemStyle: isSuperAdmin ? undefined : { display: 'none' },
        }}
      />
      <Drawer.Screen
        name="analytics"
        options={{
          title: 'Analitik Global',
          drawerIcon: ({ color, size }) => (<Ionicons name="analytics-outline" size={size} color={color} />),
          drawerItemStyle: (isSuperAdmin || user?.role === 'admin_dinkes') ? undefined : { display: 'none' },
        }}
      />
      <Drawer.Screen
        name="pending-approvals"
        options={{
          title: 'Persetujuan Pengguna',
          drawerIcon: ({ color, size }) => (<Ionicons name="shield-checkmark-outline" size={size} color={color} />),
          drawerItemStyle: isSuperAdmin ? undefined : { display: 'none' },
        }}
      />

      {/* Hidden child route: accessible via Link but not visible in drawer */}
      <Drawer.Screen name="details" options={{ title: 'Details', drawerItemStyle: { display: 'none' } }} />
    </Drawer>
  );
}
