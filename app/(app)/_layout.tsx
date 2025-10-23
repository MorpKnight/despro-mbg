import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Link, Redirect } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import { Pressable, Text, View } from 'react-native';
import CustomDrawerContent from '../../components/navigation/CustomDrawerContent';
import { useAuth } from '../../hooks/useAuth';

export default function AppDrawerLayout() {
  const { user, loading } = useAuth();
  const isSuperAdmin = user?.role === 'super admin';
  const isSiswa = user?.role === 'siswa';
  if (!loading && !user) {
    return <Redirect href="/(auth)" />;
  }
  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
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
          headerRight: () => (
            <Link href="/(app)/details" asChild>
              <Pressable accessibilityRole="button" className="mr-2" hitSlop={8}>
                <View className="w-8 h-8 rounded-full overflow-hidden bg-gray-200">
                  <Image
                    source={{
                      uri: 'https://i.pravatar.cc/64?img=3',
                    }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                  />
                </View>
              </Pressable>
            </Link>
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
          headerRight: () => (
            <Pressable accessibilityRole="button" className="flex-row items-center mr-2" hitSlop={8} onPress={() => { /* TODO: open help page/modal */ }}>
              <Ionicons name="help-circle-outline" size={22} color="#1976D2" />
              <Text className="ml-1 text-[15px] font-semibold text-[#1976D2]">Need Help</Text>
            </Pressable>
          ),
        }}
      />
      <Drawer.Screen name="page1" options={{ title: 'Page 1', drawerIcon: ({ color, size }) => (<Ionicons name="document-outline" size={size} color={color} />) }} />
      <Drawer.Screen name="page2" options={{ title: 'Page 2', drawerIcon: ({ color, size }) => (<Ionicons name="document-text-outline" size={size} color={color} />) }} />
  <Drawer.Screen name="student-attendance" options={{ title: 'Absensi Harian', drawerIcon: ({ color, size }) => (<Ionicons name="checkmark-done-outline" size={size} color={color} />) }} />
  <Drawer.Screen name="emergency-report" options={{ title: 'Laporan Darurat', drawerIcon: ({ color, size }) => (<Ionicons name="warning-outline" size={size} color={color} />) }} />
  <Drawer.Screen name="feedback-list" options={{ title: 'Umpan Balik Siswa', drawerIcon: ({ color, size }) => (<Ionicons name="chatbubbles-outline" size={size} color={color} />) }} />
  <Drawer.Screen name="portal-feedback" options={{ title: 'Portal Feedback', drawerIcon: ({ color, size }) => (<Ionicons name="chatbox-outline" size={size} color={color} />), drawerItemStyle: isSiswa ? undefined : { display: 'none' } }} />
      <Drawer.Screen name="page5" options={{ title: 'Page 5', drawerIcon: ({ color, size }) => (<Ionicons name="calendar-outline" size={size} color={color} />) }} />
      <Drawer.Screen name="page6" options={{ title: 'Page 6', drawerIcon: ({ color, size }) => (<Ionicons name="people-outline" size={size} color={color} />) }} />
      <Drawer.Screen name="page7" options={{ title: 'Page 7', drawerIcon: ({ color, size }) => (<Ionicons name="school-outline" size={size} color={color} />) }} />
      <Drawer.Screen name="page8" options={{ title: 'Page 8', drawerIcon: ({ color, size }) => (<Ionicons name="restaurant-outline" size={size} color={color} />) }} />
      <Drawer.Screen name="page9" options={{ title: 'Page 9', drawerIcon: ({ color, size }) => (<Ionicons name="medkit-outline" size={size} color={color} />) }} />
      <Drawer.Screen name="page10" options={{ title: 'Page 10', drawerIcon: ({ color, size }) => (<Ionicons name="settings-outline" size={size} color={color} />) }} />
      
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
          drawerItemStyle: isSuperAdmin ? undefined : { display: 'none' },
        }}
      />
      
      {/* Hidden child route: accessible via Link but not visible in drawer */}
      <Drawer.Screen name="details" options={{ title: 'Details', drawerItemStyle: { display: 'none' } }} />
    </Drawer>
  );
}
