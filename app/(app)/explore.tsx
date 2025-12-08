import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useAuth } from '../../hooks/useAuth';

type RoleValue = string;

type MenuItem = {
    route: string;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    description?: string;
    roles?: RoleValue[];
    color: string;
    background: string;
};

type MenuSection = {
    title: string;
    items: MenuItem[];
};

const menuItems: MenuSection[] = [
    {
        title: 'Operasional',
        items: [
            {
                route: '/(app)/student-attendance',
                label: 'Absensi Harian',
                icon: 'checkmark-done-outline',
                description: 'Kelola kehadiran siswa harian',
                roles: ['admin_sekolah', 'super_admin'],
                color: '#2563EB',
                background: 'bg-blue-50'
            },
            {
                route: '/(app)/attendance-scan',
                label: 'Scan Kehadiran',
                icon: 'qr-code-outline',
                description: 'Scan QR code siswa',
                roles: ['admin_sekolah', 'super_admin'],
                color: '#4F46E5',
                background: 'bg-indigo-50'
            },
            {
                route: '/(app)/assisted-attendance',
                label: 'Bantuan Presensi',
                icon: 'hand-left-outline',
                description: 'Bantuan input manual',
                roles: ['admin_sekolah', 'super_admin'],
                color: '#0EA5E9',
                background: 'bg-sky-50'
            },
            {
                route: '/(app)/emergency-report',
                label: 'Laporan Darurat',
                icon: 'warning-outline',
                description: 'Laporkan kejadian darurat',
                roles: ['admin_sekolah', 'super_admin'],
                color: '#DC2626',
                background: 'bg-red-50'
            },
            {
                route: '/(app)/attendance-history',
                label: 'Riwayat Absensi',
                icon: 'calendar-outline',
                description: 'Lihat riwayat kehadiran siswa',
                roles: ['admin_sekolah', 'super_admin'],
                color: '#059669',
                background: 'bg-emerald-50'
            },
            {
                route: '/(app)/food-history-school',
                label: 'Riwayat Makanan',
                icon: 'restaurant-outline',
                description: 'Riwayat menu sekolah',
                roles: ['admin_sekolah', 'super_admin'],
                color: '#F59E0B',
                background: 'bg-amber-50'
            },
            {
                route: '/(app)/feedback-list',
                label: 'Umpan Balik',
                icon: 'chatbubbles-outline',
                description: 'Lihat masukan siswa',
                roles: ['admin_sekolah', 'super_admin'],
                color: '#DB2777',
                background: 'bg-pink-50'
            },
            {
                route: '/(app)/catering-menu-qc',
                label: 'Menu & QC',
                icon: 'create-outline',
                description: 'Input menu dan quality control',
                roles: ['admin_catering', 'super_admin'],
                color: '#EA580C',
                background: 'bg-orange-50'
            },
            {
                route: '/(app)/food-history-catering',
                label: 'Riwayat Makanan',
                icon: 'restaurant-outline',
                description: 'Riwayat menu katering',
                roles: ['admin_catering', 'super_admin'],
                color: '#F97316',
                background: 'bg-orange-50'
            },
            {
                route: '/(app)/dinkes-emergency',
                label: 'Kelola Darurat',
                icon: 'medkit-outline',
                description: 'Tindak lanjut laporan darurat',
                roles: ['admin_dinkes', 'super_admin'],
                color: '#0284C7',
                background: 'bg-sky-50'
            },
            {
                route: '/(app)/portal-feedback',
                label: 'Portal Feedback',
                icon: 'chatbox-outline',
                description: 'Kirim masukan dan saran',
                roles: ['siswa'],
                color: '#F472B6',
                background: 'bg-pink-50'
            },
            {
                route: '/(app)/food-history-student',
                label: 'Riwayat Makan',
                icon: 'restaurant-outline',
                description: 'Lihat riwayat menu makanan',
                roles: ['siswa'],
                color: '#F97316',
                background: 'bg-orange-50'
            },
            {
                route: '/(app)/my-attendance',
                label: 'Riwayat Presensi',
                icon: 'calendar-outline',
                description: 'Lihat riwayat kehadiran',
                roles: ['siswa'],
                color: '#8B5CF6',
                background: 'bg-violet-50'
            },
        ]
    },
    {
        title: 'Administrasi',
        items: [
            {
                route: '/(app)/pending-approvals',
                label: 'Persetujuan',
                icon: 'shield-checkmark-outline',
                description: 'Setujui pendaftaran pengguna',
                roles: ['super_admin'],
                color: '#1D4ED8',
                background: 'bg-blue-50'
            },
            {
                route: '/(app)/admin-sekolah-dashboard',
                label: 'Dashboard Sekolah',
                icon: 'school-outline',
                description: 'Lihat dashboard sekolah',
                roles: ['super_admin'],
                color: '#0EA5E9',
                background: 'bg-sky-50'
            },
            {
                route: '/(app)/admin-catering-dashboard',
                label: 'Dashboard Katering',
                icon: 'restaurant-outline',
                description: 'Lihat dashboard katering',
                roles: ['super_admin'],
                color: '#F97316',
                background: 'bg-orange-50'
            },
            {
                route: '/(app)/admin-dinkes-dashboard',
                label: 'Dashboard Dinkes',
                icon: 'medkit-outline',
                description: 'Lihat dashboard dinas kesehatan',
                roles: ['super_admin'],
                color: '#10B981',
                background: 'bg-emerald-50'
            },
            {
                route: '/(app)/user-management',
                label: 'Pengguna',
                icon: 'people-outline',
                description: 'Kelola data pengguna',
                roles: ['super_admin'],
                color: '#4338CA',
                background: 'bg-indigo-50'
            },
            {
                route: '/(app)/school-management',
                label: 'Sekolah',
                icon: 'business-outline',
                description: 'Kelola data sekolah',
                roles: ['super_admin'],
                color: '#2563EB',
                background: 'bg-blue-50'
            },
            {
                route: '/(app)/student-management',
                label: 'Kelola Siswa',
                icon: 'people-circle-outline',
                description: 'Kelola data siswa sekolah',
                roles: ['admin_sekolah', 'super_admin'],
                color: '#0EA5E9',
                background: 'bg-sky-50'
            },
            {
                route: '/(app)/catering-management',
                label: 'Katering',
                icon: 'pizza-outline',
                description: 'Kelola vendor katering',
                roles: ['super_admin'],
                color: '#C2410C',
                background: 'bg-orange-50'
            },
            {
                route: '/(app)/health-area-management',
                label: 'Area Dinkes',
                icon: 'medkit-outline',
                description: 'Kelola area kesehatan',
                roles: ['super_admin'],
                color: '#0891B2',
                background: 'bg-cyan-50'
            },
            {
                route: '/(app)/system-health',
                label: 'System Health',
                icon: 'pulse-outline',
                description: 'Monitor kesehatan sistem',
                roles: ['super_admin'],
                color: '#4D7C0F',
                background: 'bg-lime-50'
            },
            {
                route: '/(app)/analytics',
                label: 'Analitik Global',
                icon: 'analytics-outline',
                description: 'Statistik dan laporan',
                roles: ['super_admin', 'admin_dinkes'],
                color: '#10B981',
                background: 'bg-emerald-50'
            },
        ]
    },
    {
        title: 'Komunikasi',
        items: [
            {
                route: '/(app)/notifications/broadcast',
                label: 'Siarkan Notifikasi',
                icon: 'megaphone-outline',
                description: 'Kirim notifikasi ke pengguna',
                roles: ['super_admin', 'admin_sekolah', 'admin_catering', 'admin_dinkes'],
                color: '#7C3AED',
                background: 'bg-purple-50'
            },
        ]
    }
];

export default function ExploreScreen() {
    const { user } = useAuth();
    const router = useRouter();

    const filteredSections = useMemo(() => {
        if (!user?.role) return [];

        return menuItems.map(section => ({
            ...section,
            items: section.items.filter(item =>
                !item.roles || item.roles.includes(user.role as string)
            )
        })).filter(section => section.items.length > 0);
    }, [user?.role]);

    return (
        <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ paddingBottom: 120 }}>
            <View className="px-5 pt-6 pb-4">
                <Text className="text-2xl font-bold text-gray-900">Menu</Text>
                <Text className="text-gray-500 mt-1">Akses semua fitur MBGlance</Text>
            </View>

            {filteredSections.map((section, idx) => (
                <View key={idx} className="mb-6 px-5">
                    <Text className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 ml-1">
                        {section.title}
                    </Text>
                    <View className="flex-row flex-wrap justify-between">
                        {section.items.map((item, itemIdx) => (
                            <Link
                                href={{
                                    pathname: item.route as any,
                                    params: { returnTo: '/(app)/explore' }
                                }}
                                key={itemIdx}
                                asChild
                            >
                                <Pressable className="w-[48%] bg-white p-4 rounded-2xl mb-4 shadow-sm border border-gray-100 active:scale-95 transition-transform">
                                    <View className={`w-10 h-10 rounded-full items-center justify-center mb-3 ${item.background}`}>
                                        <Ionicons name={item.icon} size={20} color={item.color} />
                                    </View>
                                    <Text className="font-semibold text-gray-900 mb-1">{item.label}</Text>
                                    {item.description && (
                                        <Text className="text-xs text-gray-500 leading-tight" numberOfLines={2}>
                                            {item.description}
                                        </Text>
                                    )}
                                </Pressable>
                            </Link>
                        ))}
                    </View>
                </View>
            ))}
        </ScrollView>
    );
}
