import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Link, Redirect, Tabs } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import React, { useMemo } from 'react';
import { Platform, Pressable, Text, useWindowDimensions, View } from 'react-native';
import CustomDrawerContent from '../../components/navigation/CustomDrawerContent';
import { ROLE_LABEL_EN, ROLE_LABEL_ID, type UserRoleValue } from '../../constants/roles';
import { useAuth } from '../../hooks/useAuth';
import { useOffline } from '../../hooks/useOffline';
import { usePreferences } from '../../hooks/usePreferences';



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
          headerLeft: () => null,
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
          },
          drawerType: 'permanent',
          drawerStyle: { width: 280, backgroundColor: '#F8FAFC', borderRightWidth: 1, borderRightColor: '#E2E8F0' },
          headerTintColor: '#111827',
        }}
      >
        {/* Define all screens that should be accessible via Drawer */}
        <Drawer.Screen name="index" options={{ title: 'Home' }} />
        <Drawer.Screen name="portal-feedback" options={{ title: 'My Feedback' }} />

        {/* Reports */}
        <Drawer.Screen name="analytics" options={{ title: 'Analytics' }} />
        <Drawer.Screen name="system-health" options={{ title: 'System Health' }} />

        {/* Settings */}
        <Drawer.Screen name="settings" options={{ title: 'Settings' }} />
        <Drawer.Screen name="notifications" options={{ title: 'Notifications' }} />

        {/* Hidden/Other */}
        <Drawer.Screen name="details" options={{ drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="explore" options={{ drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="notifications/broadcast" options={{ drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="assisted-attendance" options={{ drawerItemStyle: { display: 'none' } }} />
      </Drawer>
    );
  }

  return (
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
          title: 'Home',
          tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
            <Ionicons name={focused ? 'grid' : 'grid-outline'} size={24} color={color} />
          ),
        }}
      />

      {/* Role specific tabs */}
      <Tabs.Screen
        name="feedback-list"
        options={{
          title: 'Feedback',
          href: user?.role === 'siswa' ? '/(app)/feedback-list' : null,
          tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
            <Ionicons name={focused ? 'chatbubbles' : 'chatbubbles-outline'} size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: 'Account',
          tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
          ),
        }}
      />

      {/* Hide all other screens from Tab Bar but keep them accessible */}
      {[
        'admin-dashboard', 'sekolah-dashboard', 'catering-dashboard', 'dinkes-dashboard',
        'user-management', 'school-management', 'catering-management', 'health-area-management',
        'association-management', 'api-keys', 'pending-approvals',
        'attendance-scan', 'student-attendance', 'catering-menu-qc', 'emergency-report',
        'dinkes-emergency', 'portal-feedback',
        'analytics', 'system-health', 'notifications', 'details', 'notifications/broadcast', 'assisted-attendance'
      ].map(name => (
        <Tabs.Screen key={name} name={name} options={{ href: null, headerShown: false }} />
      ))}

    </Tabs>
  );
}
