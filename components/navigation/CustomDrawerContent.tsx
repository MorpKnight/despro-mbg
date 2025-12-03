import { Ionicons } from '@expo/vector-icons';
import { DrawerContentComponentProps, DrawerContentScrollView } from '@react-navigation/drawer';
import Constants from 'expo-constants';
import React, { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import Button from '../ui/Button';

type RoleValue = string;

type DrawerItemConfig = {
    route: string;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    description?: string;
    roles?: RoleValue[];
};

type DrawerSectionConfig = {
    key: string;
    title: string;
    subtitle?: string;
    roles?: RoleValue[];
    items: DrawerItemConfig[];
};

type QuickActionConfig = {
    route: string;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    roles?: RoleValue[];
    accent: string;
    background: string;
};

const ROLE_LABEL_ID: Record<RoleValue, string> = {
    super_admin: 'Super Admin',
    admin_sekolah: 'Admin Sekolah',
    admin_catering: 'Admin Catering',
    admin_dinkes: 'Admin Dinkes',
    siswa: 'Siswa',
};

const drawerSections: DrawerSectionConfig[] = [
    {
        key: 'overview',
        title: 'Ringkasan',
        subtitle: 'Akses cepat ke dashboard',
        items: [
            { route: 'index', label: 'Beranda', icon: 'home-outline' },
            { route: 'admin-dashboard', label: 'Dashboard Super Admin', icon: 'shield-checkmark-outline', roles: ['super_admin'] },
            { route: 'sekolah-dashboard', label: 'Dashboard Sekolah', icon: 'school-outline', roles: ['admin_sekolah', 'super_admin'] },
            { route: 'catering-dashboard', label: 'Dashboard Catering', icon: 'restaurant-outline', roles: ['admin_catering', 'super_admin'] },
            { route: 'dinkes-dashboard', label: 'Dashboard Dinkes', icon: 'medkit-outline', roles: ['admin_dinkes', 'super_admin'] },
        ],
    },
    {
        key: 'operations',
        title: 'Operasional',
        subtitle: 'Absensi, laporan, dan monitoring',
        items: [
            { route: 'student-attendance', label: 'Absensi Harian', icon: 'checkmark-done-outline', roles: ['admin_sekolah', 'super_admin'] },
            { route: 'attendance-scan', label: 'Scan Kehadiran', icon: 'qr-code-outline', roles: ['admin_sekolah', 'super_admin'] },
            { route: 'assisted-attendance', label: 'Bantuan Presensi', icon: 'hand-left-outline', roles: ['admin_sekolah', 'super_admin'] },
            { route: 'emergency-report', label: 'Laporan Darurat Sekolah', icon: 'warning-outline', roles: ['admin_sekolah', 'super_admin'] },
            { route: 'feedback-list', label: 'Umpan Balik Siswa', icon: 'chatbubbles-outline', roles: ['admin_sekolah', 'super_admin'] },
            { route: 'catering-menu-qc', label: 'Menu & QC Katering', icon: 'create-outline', roles: ['admin_catering', 'super_admin'] },
            { route: 'dinkes-emergency', label: 'Kelola Laporan Darurat', icon: 'medkit-outline', roles: ['admin_dinkes', 'super_admin'] },
            { route: 'analytics', label: 'Analitik Global', icon: 'analytics-outline', roles: ['super_admin', 'admin_dinkes'] },
            { route: 'portal-feedback', label: 'Portal Feedback', icon: 'chatbox-outline', roles: ['siswa'] },
        ],
    },
    {
        key: 'admin-tools',
        title: 'Administrasi',
        subtitle: 'Kelola pengguna dan master data',
        roles: ['super_admin'],
        items: [
            { route: 'pending-approvals', label: 'Persetujuan Pengguna', icon: 'shield-outline', roles: ['super_admin'] },
            { route: 'user-management', label: 'Manajemen Pengguna', icon: 'people-outline', roles: ['super_admin'] },
            { route: 'school-management', label: 'Manajemen Sekolah', icon: 'business-outline', roles: ['super_admin'] },
            { route: 'catering-management', label: 'Manajemen Katering', icon: 'pizza-outline', roles: ['super_admin'] },
            { route: 'health-area-management', label: 'Area Dinas Kesehatan', icon: 'medkit-outline', roles: ['super_admin'] },
            { route: 'system-health', label: 'Kesehatan & Log Sistem', icon: 'pulse-outline', roles: ['super_admin'] },
        ],
    },
    {
        key: 'communication',
        title: 'Komunikasi',
        subtitle: 'Notifikasi dan pengumuman',
        items: [
            { route: 'notifications/broadcast', label: 'Siarkan Notifikasi', icon: 'megaphone-outline', roles: ['super_admin', 'admin_sekolah', 'admin_catering', 'admin_dinkes'] },
        ],
    },
    {
        key: 'account',
        title: 'Akun & Preferensi',
        subtitle: 'Notifikasi dan pengaturan personal',
        items: [
            { route: 'notifications', label: 'Notifikasi', icon: 'notifications-outline' },
            { route: 'settings', label: 'Pengaturan Profil', icon: 'settings-outline' },
        ],
    },
];

const quickActions: QuickActionConfig[] = [
    {
        route: 'pending-approvals',
        label: 'Approvals',
        icon: 'shield-checkmark-outline',
        roles: ['super_admin'],
        accent: '#1D4ED8',
        background: 'rgba(29, 78, 216, 0.12)',
    },
    {
        route: 'analytics',
        label: 'Analytics',
        icon: 'analytics-outline',
        roles: ['super_admin', 'admin_dinkes'],
        accent: '#0F766E',
        background: 'rgba(15, 118, 110, 0.12)',
    },
    {
        route: 'notifications',
        label: 'Notifikasi',
        icon: 'notifications-outline',
        roles: ['super_admin', 'admin_sekolah', 'admin_catering', 'admin_dinkes'],
        accent: '#C026D3',
        background: 'rgba(192, 38, 211, 0.12)',
    },
];

const iconPalette: Record<string, { background: string; color: string }> = {
    index: { background: 'rgba(14, 116, 144, 0.12)', color: '#0E7490' },
    'admin-dashboard': { background: 'rgba(79, 70, 229, 0.15)', color: '#4F46E5' },
    'sekolah-dashboard': { background: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6' },
    'catering-dashboard': { background: 'rgba(249, 115, 22, 0.15)', color: '#F97316' },
    'dinkes-dashboard': { background: 'rgba(16, 185, 129, 0.15)', color: '#10B981' },
    'student-attendance': { background: 'rgba(59, 130, 246, 0.12)', color: '#1D4ED8' },
    'attendance-scan': { background: 'rgba(99, 102, 241, 0.12)', color: '#6366F1' },
    'assisted-attendance': { background: 'rgba(14, 165, 233, 0.12)', color: '#0EA5E9' },
    'emergency-report': { background: 'rgba(239, 68, 68, 0.12)', color: '#DC2626' },
    'feedback-list': { background: 'rgba(236, 72, 153, 0.12)', color: '#DB2777' },
    'catering-menu-qc': { background: 'rgba(249, 115, 22, 0.12)', color: '#EA580C' },
    'dinkes-emergency': { background: 'rgba(56, 189, 248, 0.12)', color: '#0284C7' },
    analytics: { background: 'rgba(34, 197, 94, 0.12)', color: '#10B981' },
    'portal-feedback': { background: 'rgba(236, 72, 153, 0.12)', color: '#F472B6' },
    'pending-approvals': { background: 'rgba(30, 64, 175, 0.12)', color: '#1E40AF' },
    'user-management': { background: 'rgba(99, 102, 241, 0.12)', color: '#4338CA' },
    'school-management': { background: 'rgba(59, 130, 246, 0.12)', color: '#2563EB' },
    'catering-management': { background: 'rgba(249, 115, 22, 0.12)', color: '#C2410C' },
    'health-area-management': { background: 'rgba(56, 189, 248, 0.12)', color: '#0891B2' },
    'system-health': { background: 'rgba(190, 242, 100, 0.18)', color: '#4D7C0F' },
    notifications: { background: 'rgba(192, 38, 211, 0.12)', color: '#A21CAF' },
    settings: { background: 'rgba(148, 163, 184, 0.12)', color: '#475569' },
};

const getIconAppearance = (routeName: string) => iconPalette[routeName] ?? {
    background: 'rgba(15, 23, 42, 0.06)',
    color: '#1F2937',
};

export default function CustomDrawerContent(props: DrawerContentComponentProps) {
    const version = Constants?.expoConfig?.version ?? (Constants as any)?.manifest?.version ?? '0.0.0';
    const { user, signOut } = useAuth();
    const { width } = useWindowDimensions();
    const isDesktop = Platform.OS === 'web' && width >= 1024;

    const { navigation, state } = props;
    const { routes, index } = state;
    const currentRoute = routes[index]?.name;

    const routesMap = useMemo(() => {
        const map = new Map<string, (typeof routes)[number]>();
        routes.forEach((route) => {
            map.set(route.name, route);
        });
        return map;
    }, [routes]);

    const filteredSections = useMemo(() => {
        return drawerSections
            .map((section) => {
                if (section.roles && (!user?.role || !section.roles.includes(user.role))) {
                    return { ...section, items: [] };
                }

                const items = section.items.filter((item) => {
                    if (!routesMap.has(item.route)) return false;
                    if (!item.roles || item.roles.length === 0) {
                        return true;
                    }
                    if (!user?.role) return false;
                    return item.roles.includes(user.role);
                });

                return { ...section, items };
            })
            .filter((section) => section.items.length > 0);
    }, [routesMap, user?.role]);

    const quickLinks = useMemo(() => quickActions.filter((action) => {
        if (!routesMap.has(action.route)) return false;
        if (!action.roles || action.roles.length === 0) return true;
        if (!user?.role) return false;
        return action.roles.includes(user.role);
    }), [routesMap, user?.role]);

    const sectionKeys = useMemo(() => filteredSections.map((section) => section.key), [filteredSections]);

    const [expandedSections, setExpandedSections] = useState<string[]>(sectionKeys);

    useEffect(() => {
        setExpandedSections((prev) => {
            const existing = prev.filter((key) => sectionKeys.includes(key));
            const missing = sectionKeys.filter((key) => !existing.includes(key));
            return [...existing, ...missing];
        });
    }, [sectionKeys]);

    useEffect(() => {
        if (!currentRoute) return;
        const section = filteredSections.find((candidate) =>
            candidate.items.some((item) => item.route === currentRoute),
        );
        if (section && !expandedSections.includes(section.key)) {
            setExpandedSections((prev) => [...prev, section.key]);
        }
    }, [currentRoute, expandedSections, filteredSections]);

    const toggleSection = (sectionKey: string) => {
        setExpandedSections((prev) =>
            prev.includes(sectionKey)
                ? prev.filter((key) => key !== sectionKey)
                : [...prev, sectionKey],
        );
    };

    const userInitials = useMemo(() => {
        const base = user?.fullName || user?.username || 'MBG';
        return base
            .split(' ')
            .map((part: string) => part[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();
    }, [user?.fullName, user?.username]);

    const roleLabel = user?.role ? ROLE_LABEL_ID[user.role] ?? user.role : 'Tidak diketahui';

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#0B1F44' }}>
            <View
                style={{
                    backgroundColor: '#0B1F44',
                    paddingHorizontal: 20,
                    paddingTop: Platform.select({ ios: 12, android: 16, default: 18 }),
                    paddingBottom: 24,
                    borderBottomLeftRadius: 24,
                    borderBottomRightRadius: 24,
                }}
            >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                    <View
                        style={{
                            width: 52,
                            height: 52,
                            borderRadius: 26,
                            backgroundColor: 'rgba(255, 255, 255, 0.12)',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '700' }}>{userInitials}</Text>
                    </View>
                    <View style={{ marginLeft: 16, flex: 1 }}>
                        <Text style={{ color: '#E0F2FE', fontSize: 14, fontWeight: '500' }}>MBGlance Console</Text>
                        <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700' }} numberOfLines={1}>
                            {user?.fullName || user?.username || 'Tamu'}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                            <View
                                style={{
                                    paddingHorizontal: 10,
                                    paddingVertical: 4,
                                    borderRadius: 999,
                                    backgroundColor: 'rgba(96, 165, 250, 0.25)',
                                    marginRight: 8,
                                }}
                            >
                                <Text style={{ color: '#BFDBFE', fontSize: 11, fontWeight: '600' }}>{roleLabel}</Text>
                            </View>
                            <Text style={{ color: 'rgba(226, 232, 240, 0.75)', fontSize: 11 }}>v{version}</Text>
                        </View>
                    </View>
                </View>

                {quickLinks.length > 0 && (
                    <View
                        style={{
                            flexDirection: isDesktop ? 'column' : 'row',
                        }}
                    >
                        {quickLinks
                            .slice(0, isDesktop ? quickLinks.length : 3)
                            .map((action, index, arr) => {
                                const focused = currentRoute === action.route;
                                const isLast = index === arr.length - 1;
                                return (
                                    <Pressable
                                        key={action.route}
                                        onPress={() => navigation.navigate(action.route as never)}
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            paddingVertical: isDesktop ? 16 : 12,
                                            paddingHorizontal: isDesktop ? 16 : 12,
                                            borderRadius: 16,
                                            backgroundColor: focused ? action.accent : action.background,
                                            marginRight: !isDesktop && !isLast ? 10 : 0,
                                            marginBottom: isDesktop && !isLast ? 12 : 0,
                                            width: isDesktop ? '100%' : undefined,
                                            shadowColor: '#0F172A',
                                            shadowOpacity: focused ? 0.15 : 0.08,
                                            shadowOffset: { width: 0, height: 8 },
                                            shadowRadius: 12,
                                            elevation: focused ? 6 : 2,
                                        }}
                                    >
                                        <View
                                            style={{
                                                backgroundColor: focused ? 'rgba(255, 255, 255, 0.28)' : '#FFFFFF',
                                                borderRadius: 999,
                                                padding: 8,
                                                marginRight: 12,
                                            }}
                                        >
                                            <Ionicons
                                                name={action.icon}
                                                size={18}
                                                color={focused ? '#FFFFFF' : action.accent}
                                            />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text
                                                style={{
                                                    color: focused ? '#FFFFFF' : '#0F172A',
                                                    fontSize: isDesktop ? 14 : 12,
                                                    fontWeight: '700',
                                                    letterSpacing: 0.2,
                                                }}
                                                numberOfLines={1}
                                            >
                                                {action.label}
                                            </Text>
                                            <Text
                                                style={{
                                                    color: focused ? 'rgba(241, 245, 249, 0.85)' : '#475569',
                                                    fontSize: 11,
                                                }}
                                            >
                                                Akses cepat
                                            </Text>
                                        </View>
                                        <Ionicons
                                            name="arrow-forward"
                                            size={16}
                                            color={focused ? '#FFFFFF' : action.accent}
                                        />
                                    </Pressable>
                                );
                            })}
                    </View>
                )}
            </View>

            <DrawerContentScrollView
                {...props}
                contentContainerStyle={{ backgroundColor: '#F8FAFC', paddingBottom: 16 }}
            >
                <View style={{ paddingHorizontal: 16, paddingTop: 20 }}>
                    {filteredSections.map((section) => {
                        const isExpanded = expandedSections.includes(section.key);
                        const sectionContainsActive = section.items.some((item) => item.route === currentRoute);

                        return (
                            <View
                                key={section.key}
                                style={{
                                    backgroundColor: '#FFFFFF',
                                    borderRadius: 20,
                                    padding: 16,
                                    marginBottom: 20,
                                    shadowColor: '#0F172A',
                                    shadowOpacity: 0.05,
                                    shadowOffset: { width: 0, height: 10 },
                                    shadowRadius: 18,
                                    elevation: 4,
                                }}
                            >
                                <Pressable onPress={() => toggleSection(section.key)} style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 16, fontWeight: '700', color: sectionContainsActive ? '#1D4ED8' : '#0F172A' }}>
                                            {section.title}
                                        </Text>
                                        {section.subtitle ? (
                                            <Text style={{ marginTop: 4, fontSize: 12, color: '#64748B' }}>{section.subtitle}</Text>
                                        ) : null}
                                    </View>
                                    <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} color="#475569" />
                                </Pressable>

                                {isExpanded && (
                                    <View style={{ marginTop: 16 }}>
                                        {section.items.map((item, index) => {
                                            const focused = currentRoute === item.route;
                                            const iconColors = getIconAppearance(item.route);
                                            const isLastItem = index === section.items.length - 1;
                                            return (
                                                <Pressable
                                                    key={item.route}
                                                    onPress={() => navigation.navigate(item.route as never)}
                                                    style={{
                                                        flexDirection: 'row',
                                                        alignItems: 'center',
                                                        paddingVertical: 12,
                                                        paddingHorizontal: 12,
                                                        borderRadius: 16,
                                                        backgroundColor: focused ? 'rgba(37, 99, 235, 0.12)' : 'transparent',
                                                        marginBottom: isLastItem ? 0 : 12,
                                                    }}
                                                >
                                                    <View
                                                        style={{
                                                            width: 38,
                                                            height: 38,
                                                            borderRadius: 19,
                                                            backgroundColor: focused ? 'rgba(37, 99, 235, 0.18)' : iconColors.background,
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            marginRight: 12,
                                                        }}
                                                    >
                                                        <Ionicons
                                                            name={item.icon}
                                                            size={20}
                                                            color={focused ? '#2563EB' : iconColors.color}
                                                        />
                                                    </View>
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={{ fontSize: 15, fontWeight: focused ? '700' : '600', color: focused ? '#1D4ED8' : '#0F172A' }}>
                                                            {item.label}
                                                        </Text>
                                                        {item.description ? (
                                                            <Text style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                                                                {item.description}
                                                            </Text>
                                                        ) : null}
                                                    </View>
                                                    {focused ? (
                                                        <View
                                                            style={{
                                                                width: 6,
                                                                height: 6,
                                                                borderRadius: 999,
                                                                backgroundColor: '#2563EB',
                                                            }}
                                                        />
                                                    ) : null}
                                                </Pressable>
                                            );
                                        })}
                                    </View>
                                )}
                            </View>
                        );
                    })}
                </View>
            </DrawerContentScrollView>

            <View
                style={{
                    paddingHorizontal: 20,
                    paddingVertical: 18,
                    borderTopWidth: 1,
                    borderTopColor: 'rgba(15, 23, 42, 0.08)',
                    backgroundColor: '#FFFFFF',
                }}
            >
                <View style={{ marginBottom: 12 }}>
                    <Text style={{ color: '#0F172A', fontSize: 12, fontWeight: '600' }}>
                        {user?.username ?? 'guest'}
                    </Text>
                    <Text style={{ color: '#94A3B8', fontSize: 11 }}>
                        {roleLabel}
                    </Text>
                </View>
                <Button
                    title="Keluar"
                    variant="ghost"
                    onPress={signOut}
                    textClassName="text-red-600"
                    className="border border-red-500 bg-red-50"
                />
            </View>
        </SafeAreaView>
    );
}
