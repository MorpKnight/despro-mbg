import { Ionicons } from '@expo/vector-icons';
import { DrawerContentComponentProps, DrawerContentScrollView } from '@react-navigation/drawer';
import { Image } from 'expo-image';
import { usePathname, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { USER_ROLES, type UserRoleValue } from '../../constants/roles';
import { useAuth } from '../../hooks/useAuth';
import { SafeAreaView } from "react-native-safe-area-context";


type DrawerItem = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  roles?: UserRoleValue[];
};

type DrawerSection = {
  title: string;
  items: DrawerItem[];
  roles?: UserRoleValue[];
};

const MENU_STRUCTURE: DrawerSection[] = [
  {
    title: 'Dashboard',
    items: [
      { label: 'Overview', icon: 'grid-outline', route: 'index', roles: [USER_ROLES.SISWA] },
      { label: 'Admin Dashboard', icon: 'speedometer-outline', route: 'admin-dashboard', roles: [USER_ROLES.SUPER_ADMIN] },
      { label: 'School Dashboard', icon: 'school-outline', route: 'sekolah-dashboard', roles: [USER_ROLES.ADMIN_SEKOLAH] },
      { label: 'Catering Dashboard', icon: 'restaurant-outline', route: 'catering-dashboard', roles: [USER_ROLES.ADMIN_CATERING] },
      { label: 'Health Dashboard', icon: 'medkit-outline', route: 'dinkes-dashboard', roles: [USER_ROLES.ADMIN_DINKES] },
    ],
  },
  {
    title: 'Menu Siswa',
    roles: [USER_ROLES.SISWA],
    items: [
      { label: 'Riwayat Absensi', icon: 'calendar-outline', route: 'my-attendance' },
      { label: 'Jadwal Menu', icon: 'restaurant-outline', route: 'student-menu-schedule' },
      { label: 'History Makanan', icon: 'fast-food-outline', route: 'food-history-student' },
    ],
  },
  {
    title: 'School Administration',
    roles: [USER_ROLES.ADMIN_SEKOLAH],
    items: [
      { label: 'Kelola Siswa', icon: 'people-outline', route: 'student-management' },
      { label: 'Riwayat Absensi', icon: 'calendar-outline', route: 'attendance-history' },
      { label: 'History Makanan', icon: 'fast-food-outline', route: 'food-history-school' },
      { label: 'Asosiasi Katering', icon: 'git-network-outline', route: 'association-management' },
    ],
  },
  {
    title: 'Management',
    roles: [USER_ROLES.SUPER_ADMIN],
    items: [
      { label: 'User Management', icon: 'people-outline', route: 'user-management' },
      { label: 'School Management', icon: 'business-outline', route: 'school-management' },
      { label: 'Catering Management', icon: 'nutrition-outline', route: 'catering-management' },
      { label: 'Health Areas', icon: 'map-outline', route: 'health-area-management' },
      { label: 'Associations', icon: 'git-network-outline', route: 'association-management' },
      { label: 'Approvals', icon: 'shield-checkmark-outline', route: 'pending-approvals' },
    ],
  },
  {
    title: 'Role Dashboards',
    roles: [USER_ROLES.SUPER_ADMIN],
    items: [
      { label: 'Sekolah Dashboard', icon: 'school-outline', route: 'admin-sekolah-dashboard' },
      { label: 'Katering Dashboard', icon: 'restaurant-outline', route: 'admin-catering-dashboard' },
      { label: 'Dinkes Dashboard', icon: 'medkit-outline', route: 'admin-dinkes-dashboard' },
      { label: 'Kelola Siswa (Sekolah)', icon: 'people-outline', route: 'admin-student-management' },
      { label: 'History Makanan (Sekolah)', icon: 'fast-food-outline', route: 'admin-food-history-school' },
      { label: 'History Menu (Katering)', icon: 'restaurant-outline', route: 'admin-food-history-catering' },
      { label: 'Riwayat Absensi (Sekolah)', icon: 'calendar-outline', route: 'admin-attendance-history' },
    ],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Scan QR Kehadiran', icon: 'qr-code-outline', route: 'attendance-scan', roles: [USER_ROLES.ADMIN_SEKOLAH, USER_ROLES.SUPER_ADMIN] },
      { label: 'Scan NFC Kehadiran', icon: 'wifi-outline', route: 'attendance-nfc', roles: [USER_ROLES.ADMIN_SEKOLAH, USER_ROLES.SUPER_ADMIN] },
      { label: 'Daily Attendance', icon: 'calendar-outline', route: 'student-attendance', roles: [USER_ROLES.ADMIN_SEKOLAH, USER_ROLES.SUPER_ADMIN] },
      { label: 'Menu QC', icon: 'clipboard-outline', route: 'catering-menu-qc', roles: [USER_ROLES.ADMIN_CATERING, USER_ROLES.SUPER_ADMIN] },
      { label: 'Food History', icon: 'fast-food-outline', route: 'food-history-catering', roles: [USER_ROLES.ADMIN_CATERING] },
      { label: 'Asosiasi Sekolah', icon: 'git-network-outline', route: 'association-management', roles: [USER_ROLES.ADMIN_CATERING] },
      { label: 'Emergency Reports', icon: 'warning-outline', route: 'emergency-report', roles: [USER_ROLES.ADMIN_SEKOLAH, USER_ROLES.SUPER_ADMIN] },
      { label: 'Health Reports', icon: 'document-text-outline', route: 'dinkes-emergency', roles: [USER_ROLES.ADMIN_DINKES, USER_ROLES.SUPER_ADMIN] },
      { label: 'Feedback', icon: 'chatbubbles-outline', route: 'feedback-list', roles: [USER_ROLES.ADMIN_SEKOLAH, USER_ROLES.SUPER_ADMIN] },
      { label: 'My Feedback', icon: 'chatbox-outline', route: 'portal-feedback', roles: [USER_ROLES.SISWA] },
    ],
  },
  {
    title: 'Reports & Analytics',
    roles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN_DINKES],
    items: [
      { label: 'Analytics', icon: 'bar-chart-outline', route: 'analytics' },
      { label: 'System Health', icon: 'pulse-outline', route: 'system-health', roles: [USER_ROLES.SUPER_ADMIN] },
    ],
  },
  {
    title: 'Settings',
    items: [
      { label: 'Profile', icon: 'person-outline', route: 'settings' },
      { label: 'Notifications', icon: 'notifications-outline', route: 'notifications' },
    ],
  },
];

export default function CustomDrawerContent(props: DrawerContentComponentProps) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;


  // Filter sections based on user role
  const filteredSections = useMemo(() => {
    if (!user?.role) return [];

    return MENU_STRUCTURE.map(section => {
      // Check section level role access
      if (section.roles && !section.roles.includes(user.role as UserRoleValue)) {
        return null;
      }

      // Filter items based on role
      const items = section.items.filter(item => {
        if (!item.roles) return true;
        return item.roles.includes(user.role as UserRoleValue);
      });

      if (items.length === 0) return null;

      return { ...section, items };
    }).filter(Boolean) as DrawerSection[];
  }, [user?.role]);

  // State for collapsible sections (default all expanded)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Initialize all sections as expanded
    const initial: Record<string, boolean> = {};
    filteredSections.forEach((s: DrawerSection) => {
      initial[s.title] = true;
    });
    setExpandedSections(initial);
  }, [filteredSections]);

  const toggleSection = (title: string) => {
    setExpandedSections((prev: Record<string, boolean>) => ({ ...prev, [title]: !prev[title] }));
  };

  const handleNavigation = (route: string) => {
    if (route === 'index') {
      router.push('/(app)');
    } else {
      router.push(`/(app)/${route}` as any);
    }
  };

  const isActive = (route: string) => {
    if (route === 'index') return pathname === '/' || pathname === '/(app)' || pathname === '/(app)/';
    return pathname.includes(route);
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-900">
      {/* Sidebar Header */}
      <SafeAreaView
        style={{ paddingTop: insets.top + 20, paddingBottom: 20, paddingHorizontal: 20 }}
        className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700"
      >
        <SafeAreaView className="flex-row items-center space-x-3">
          <SafeAreaView className="w-10 h-10 bg-blue-600 rounded-xl items-center justify-center shadow-sm">
            <Ionicons name="grid" size={20} color="white" />
          </SafeAreaView>
          <SafeAreaView>
            <Text className="text-lg font-bold text-slate-900 dark:text-white">MBGlance</Text>
            <Text className="text-xs text-slate-500 dark:text-slate-400">Management Console</Text>
          </SafeAreaView>
        </SafeAreaView>
      </SafeAreaView>

      {/* Scrollable Menu */}
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {filteredSections.map((section: DrawerSection, index: number) => (
          <SafeAreaView key={section.title} className="mb-6">
            <Pressable
              onPress={() => toggleSection(section.title)}
              className="flex-row items-center justify-between mb-2 px-2"
            >
              <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {section.title}
              </Text>
              <Ionicons
                name={expandedSections[section.title] ? 'chevron-up' : 'chevron-down'}
                size={14}
                color="#94A3B8"
              />
            </Pressable>

            {expandedSections[section.title] && (
              <SafeAreaView className="space-y-1">
                {section.items.map((item: DrawerItem) => {
                  const active = isActive(item.route);
                  return (
                    <Pressable
                      key={item.route}
                      onPress={() => handleNavigation(item.route)}
                      className={`flex-row items-center px-3 py-2.5 rounded-lg transition-colors ${active
                        ? 'bg-blue-50 dark:bg-blue-900/20'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                    >
                      <Ionicons
                        name={active ? item.icon : (item.icon as string).replace('-outline', '') + '-outline' as any}
                        size={20}
                        color={active ? '#2563EB' : '#64748B'}
                      />
                      <Text
                        className={`ml-3 text-sm font-medium ${active ? 'text-blue-700 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300'
                          }`}
                      >
                        {item.label}
                      </Text>
                      {active && (
                        <SafeAreaView className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />
                      )}
                    </Pressable>
                  );
                })}
              </SafeAreaView>
            )}
          </SafeAreaView>
        ))}
      </DrawerContentScrollView>

      {/* User Profile Footer */}
      <SafeAreaView
        style={{ paddingBottom: insets.bottom + 16, paddingHorizontal: 16, paddingTop: 16 }}
        className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700"
      >
        <Pressable className="flex-row items-center p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700">
          <Image
            source={{ uri: 'https://i.pravatar.cc/150?img=3' }}
            style={{ width: 40, height: 40, borderRadius: 20 }}
            contentFit="cover"
          />
          <SafeAreaView className="ml-3 flex-1">
            <Text className="text-sm font-semibold text-slate-900 dark:text-white" numberOfLines={1}>
              {user?.fullName || user?.username || 'User'}
            </Text>
            <Text className="text-xs text-slate-500 dark:text-slate-400 capitalize">
              {user?.role?.replace('_', ' ') || 'Guest'}
            </Text>
          </SafeAreaView>
          <Pressable
            onPress={signOut}
            className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          </Pressable>
        </Pressable>
      </SafeAreaView>
    </SafeAreaView>
  );
}

