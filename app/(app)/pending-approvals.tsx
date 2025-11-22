import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Card from '../../components/ui/Card';
import Dropdown, { DropdownOption } from '../../components/ui/Dropdown';
import { useResponsive } from '../../hooks/useResponsive';
import { api } from '../../services/api';

interface PendingUser {
    id: string;
    username: string;
    name: string;
    role: string;
    created_at: string;
    school_id?: string;
    catering_id?: string;
    health_office_area?: string;
}

const roleFilterOptions: DropdownOption[] = [
    { label: 'Semua Role', value: 'all' },
    { label: 'Super Admin', value: 'super_admin' },
    { label: 'Admin Sekolah', value: 'admin_sekolah' },
    { label: 'Admin Catering', value: 'admin_catering' },
    { label: 'Admin Dinkes', value: 'admin_dinkes' },
    { label: 'Siswa', value: 'siswa' },
];

export default function PendingApprovalsPage() {
    const router = useRouter();
    const { isDesktop } = useResponsive();
    const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

    const fetchPending = async () => {
        setLoading(true);
        try {
            const data = await api('approvals/pending');
            setPendingUsers(data);
        } catch (error) {
            console.error('Failed to fetch pending approvals:', error);
            Alert.alert('Error', 'Gagal memuat data persetujuan.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPending();
    }, []);

    const confirmAction = async (action: () => Promise<void>, message: string) => {
        if (Platform.OS === 'web') {
            const confirmed = window.confirm(message);
            if (!confirmed) return;
            await action();
            return;
        }

        Alert.alert('Konfirmasi', message, [
            { text: 'Batal', style: 'cancel' },
            {
                text: 'Ya',
                onPress: () => action().catch(() => {
                    Alert.alert('Error', 'Operasi gagal. Coba lagi.');
                }),
            },
        ]);
    };

    const handleApprove = (id: string) => {
        confirmAction(async () => {
            setProcessingIds(prev => new Set(prev).add(id));
            try {
                await api(`approvals/${id}/approve`, { method: 'POST' });
                await fetchPending();
                if (Platform.OS === 'web') {
                    alert('✅ Pengguna berhasil disetujui!');
                } else {
                    Alert.alert('Berhasil', 'Pengguna berhasil disetujui!');
                }
            } catch (error) {
                console.warn('[pending-approvals] approve failed', error);
                if (Platform.OS === 'web') {
                    alert('❌ Gagal menyetujui pengguna.');
                } else {
                    Alert.alert('Error', 'Gagal menyetujui pengguna.');
                }
            } finally {
                setProcessingIds(prev => {
                    const next = new Set(prev);
                    next.delete(id);
                    return next;
                });
            }
        }, 'Setujui pendaftaran pengguna ini?');
    };

    const handleReject = (id: string) => {
        confirmAction(async () => {
            setProcessingIds(prev => new Set(prev).add(id));
            try {
                await api(`approvals/${id}/reject`, { method: 'POST' });
                await fetchPending();
                if (Platform.OS === 'web') {
                    alert('✅ Pengguna berhasil ditolak!');
                } else {
                    Alert.alert('Berhasil', 'Pengguna berhasil ditolak!');
                }
            } catch (error) {
                console.warn('[pending-approvals] reject failed', error);
                if (Platform.OS === 'web') {
                    alert('❌ Gagal menolak pengguna.');
                } else {
                    Alert.alert('Error', 'Gagal menolak pengguna.');
                }
            } finally {
                setProcessingIds(prev => {
                    const next = new Set(prev);
                    next.delete(id);
                    return next;
                });
            }
        }, 'Tolak pendaftaran pengguna ini?');
    };

    const filteredUsers = useMemo(() => {
        if (roleFilter === 'all') return pendingUsers;
        return pendingUsers.filter(user => user.role === roleFilter);
    }, [pendingUsers, roleFilter]);

    const getRoleLabel = (role: string) => {
        const labels: Record<string, string> = {
            'super_admin': 'Super Admin',
            'admin_sekolah': 'Admin Sekolah',
            'admin_catering': 'Admin Catering',
            'admin_dinkes': 'Admin Dinkes',
            'siswa': 'Siswa',
        };
        return labels[role] || role;
    };

    const getRoleColor = (role: string) => {
        const colors: Record<string, { bg: string; text: string; border: string }> = {
            'super_admin': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
            'admin_sekolah': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
            'admin_catering': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
            'admin_dinkes': { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
            'siswa': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
        };
        return colors[role] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };
    };

    const getRoleIcon = (role: string) => {
        const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
            'super_admin': 'shield-checkmark',
            'admin_sekolah': 'school',
            'admin_catering': 'restaurant',
            'admin_dinkes': 'medkit',
            'siswa': 'person',
        };
        return icons[role] || 'person-circle-outline';
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);

        if (diffHours < 1) return 'Baru saja';
        if (diffHours < 24) return `${diffHours} jam yang lalu`;
        if (diffDays < 7) return `${diffDays} hari yang lalu`;
        return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const renderItem = ({ item }: { item: PendingUser }) => {
        const roleColor = getRoleColor(item.role);
        const isProcessing = processingIds.has(item.id);

        if (isDesktop) {
            // Desktop Layout - Card style
            return (
                <Card className="mb-4 p-6 hover:shadow-lg transition-shadow">
                    <View className="flex-row items-center justify-between">
                        {/* Left: Avatar + Info */}
                        <View className="flex-row items-center flex-1">
                            <View className={`w-14 h-14 rounded-full ${roleColor.bg} items-center justify-center mr-4`}>
                                <Ionicons name={getRoleIcon(item.role)} size={28} color="#6B7280" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-xl font-bold text-gray-900 mb-1">{item.name || 'Tanpa Nama'}</Text>
                                <View className="flex-row items-center gap-2 mb-2">
                                    <Ionicons name="at" size={14} color="#6B7280" />
                                    <Text className="text-sm text-gray-600">{item.username}</Text>
                                </View>
                                <View className="flex-row items-center gap-3">
                                    <View className={`${roleColor.bg} ${roleColor.border} border px-3 py-1 rounded-full`}>
                                        <Text className={`text-xs font-semibold ${roleColor.text}`}>
                                            {getRoleLabel(item.role)}
                                        </Text>
                                    </View>
                                    <View className="flex-row items-center">
                                        <Ionicons name="time-outline" size={14} color="#9CA3AF" />
                                        <Text className="text-xs text-gray-500 ml-1">{formatDate(item.created_at)}</Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Right: Action Buttons */}
                        <View className="flex-row gap-3">
                            <TouchableOpacity
                                onPress={() => handleApprove(item.id)}
                                disabled={isProcessing}
                                className={`px-6 py-3 rounded-lg flex-row items-center gap-2 ${
                                    isProcessing ? 'bg-gray-100' : 'bg-green-500 hover:bg-green-600'
                                }`}
                            >
                                {isProcessing ? (
                                    <ActivityIndicator size="small" color="#6B7280" />
                                ) : (
                                    <>
                                        <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                                        <Text className="text-white font-semibold">Setujui</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => handleReject(item.id)}
                                disabled={isProcessing}
                                className={`px-6 py-3 rounded-lg flex-row items-center gap-2 ${
                                    isProcessing ? 'bg-gray-100' : 'bg-red-500 hover:bg-red-600'
                                }`}
                            >
                                {isProcessing ? (
                                    <ActivityIndicator size="small" color="#6B7280" />
                                ) : (
                                    <>
                                        <Ionicons name="close-circle" size={20} color="#FFFFFF" />
                                        <Text className="text-white font-semibold">Tolak</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </Card>
            );
        }

        // Mobile Layout - Compact card
        return (
            <Card className="mb-3 p-4">
                <View className="flex-row items-start gap-3">
                    {/* Avatar */}
                    <View className={`w-12 h-12 rounded-full ${roleColor.bg} items-center justify-center`}>
                        <Ionicons name={getRoleIcon(item.role)} size={24} color="#6B7280" />
                    </View>

                    {/* Content */}
                    <View className="flex-1">
                        <Text className="text-base font-bold text-gray-900 mb-1">{item.name || 'Tanpa Nama'}</Text>
                        <Text className="text-sm text-gray-600 mb-2">@{item.username}</Text>
                        
                        <View className="flex-row items-center gap-2 mb-3">
                            <View className={`${roleColor.bg} ${roleColor.border} border px-2 py-1 rounded-full`}>
                                <Text className={`text-xs font-semibold ${roleColor.text}`}>
                                    {getRoleLabel(item.role)}
                                </Text>
                            </View>
                            <View className="flex-row items-center">
                                <Ionicons name="time-outline" size={12} color="#9CA3AF" />
                                <Text className="text-xs text-gray-500 ml-1">{formatDate(item.created_at)}</Text>
                            </View>
                        </View>

                        {/* Action Buttons - Mobile */}
                        <View className="flex-row gap-2">
                            <TouchableOpacity
                                onPress={() => handleApprove(item.id)}
                                disabled={isProcessing}
                                className={`flex-1 py-2.5 rounded-lg flex-row items-center justify-center gap-2 ${
                                    isProcessing ? 'bg-gray-100' : 'bg-green-500'
                                }`}
                            >
                                {isProcessing ? (
                                    <ActivityIndicator size="small" color="#6B7280" />
                                ) : (
                                    <>
                                        <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                                        <Text className="text-white font-semibold text-sm">Setujui</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => handleReject(item.id)}
                                disabled={isProcessing}
                                className={`flex-1 py-2.5 rounded-lg flex-row items-center justify-center gap-2 ${
                                    isProcessing ? 'bg-gray-100' : 'bg-red-500'
                                }`}
                            >
                                {isProcessing ? (
                                    <ActivityIndicator size="small" color="#6B7280" />
                                ) : (
                                    <>
                                        <Ionicons name="close-circle-outline" size={18} color="#FFFFFF" />
                                        <Text className="text-white font-semibold text-sm">Tolak</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Card>
        );
    };

    if (isDesktop) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'bottom', 'left', 'right']}>
                <ScrollView className="flex-1">
                    <View className="max-w-7xl mx-auto w-full px-8 py-8">
                        {/* Header */}
                        <View className="mb-8">
                            <View className="flex-row items-center mb-2">
                                <TouchableOpacity 
                                    onPress={() => router.back()} 
                                    className="mr-4 p-2 hover:bg-gray-100 rounded-lg"
                                >
                                    <Ionicons name="arrow-back" size={24} color="#374151" />
                                </TouchableOpacity>
                                <View className="flex-1">
                                    <Text className="text-3xl font-bold text-gray-900 mb-1">Persetujuan Tertunda</Text>
                                    <Text className="text-sm text-gray-600">
                                        Kelola pendaftaran pengguna yang menunggu persetujuan
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    onPress={fetchPending}
                                    className="p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50"
                                >
                                    <Ionicons name="refresh" size={20} color="#6B7280" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Stats Cards */}
                        <View className="flex-row gap-4 mb-6">
                            <Card className="flex-1 p-4">
                                <View className="flex-row items-center justify-between">
                                    <View>
                                        <Text className="text-sm text-gray-600 mb-1">Total Tertunda</Text>
                                        <Text className="text-3xl font-bold text-gray-900">{pendingUsers.length}</Text>
                                    </View>
                                    <View className="w-12 h-12 bg-blue-50 rounded-full items-center justify-center">
                                        <Ionicons name="hourglass" size={24} color="#3B82F6" />
                                    </View>
                                </View>
                            </Card>
                            <Card className="flex-1 p-4">
                                <View className="flex-row items-center justify-between">
                                    <View>
                                        <Text className="text-sm text-gray-600 mb-1">Difilter</Text>
                                        <Text className="text-3xl font-bold text-gray-900">{filteredUsers.length}</Text>
                                    </View>
                                    <View className="w-12 h-12 bg-purple-50 rounded-full items-center justify-center">
                                        <Ionicons name="funnel" size={24} color="#8B5CF6" />
                                    </View>
                                </View>
                            </Card>
                        </View>

                        {/* Filter */}
                        <View className="mb-6">
                            <Dropdown
                                label="Filter berdasarkan Role"
                                options={roleFilterOptions}
                                value={roleFilter}
                                onValueChange={setRoleFilter}
                            />
                        </View>

                        {/* Content */}
                        {loading ? (
                            <View className="items-center justify-center py-20">
                                <ActivityIndicator size="large" color="#3B82F6" />
                                <Text className="text-gray-500 mt-4">Memuat data...</Text>
                            </View>
                        ) : filteredUsers.length === 0 ? (
                            <Card className="p-12">
                                <View className="items-center justify-center">
                                    <View className="w-24 h-24 bg-green-50 rounded-full items-center justify-center mb-4">
                                        <Ionicons name="checkmark-circle" size={48} color="#10B981" />
                                    </View>
                                    <Text className="text-xl font-bold text-gray-900 mb-2">Semua Bersih!</Text>
                                    <Text className="text-gray-600 text-center max-w-md">
                                        {roleFilter !== 'all'
                                            ? 'Tidak ada pendaftaran tertunda untuk role ini.'
                                            : 'Tidak ada pendaftaran yang menunggu persetujuan saat ini.'}
                                    </Text>
                                </View>
                            </Card>
                        ) : (
                            <View>
                                {filteredUsers.map((item) => (
                                    <View key={item.id}>
                                        {renderItem({ item })}
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    // Mobile Layout
    return (
        <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'bottom', 'left', 'right']}>
            <View className="flex-1">
                {/* Header */}
                <View className="bg-white border-b border-gray-200 px-4 py-4">
                    <View className="flex-row items-center justify-between mb-3">
                        <View className="flex-row items-center flex-1">
                            <TouchableOpacity 
                                onPress={() => router.back()} 
                                className="mr-3 p-2"
                            >
                                <Ionicons name="arrow-back" size={24} color="#374151" />
                            </TouchableOpacity>
                            <View className="flex-1">
                                <Text className="text-xl font-bold text-gray-900">Persetujuan</Text>
                                <Text className="text-xs text-gray-600">Tertunda: {pendingUsers.length}</Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            onPress={fetchPending}
                            className="p-2"
                        >
                            <Ionicons name="refresh" size={22} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    {/* Filter Compact */}
                    <View>
                        <Dropdown
                            label=""
                            options={roleFilterOptions}
                            value={roleFilter}
                            onValueChange={setRoleFilter}
                        />
                    </View>
                </View>

                {/* Content */}
                {loading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color="#3B82F6" />
                        <Text className="text-gray-500 mt-4">Memuat data...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={filteredUsers}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={{ padding: 16 }}
                        ListEmptyComponent={
                            <View className="items-center justify-center py-16">
                                <View className="w-20 h-20 bg-green-50 rounded-full items-center justify-center mb-4">
                                    <Ionicons name="checkmark-circle" size={40} color="#10B981" />
                                </View>
                                <Text className="text-lg font-bold text-gray-900 mb-2">Semua Bersih!</Text>
                                <Text className="text-sm text-gray-600 text-center px-8">
                                    {roleFilter !== 'all'
                                        ? 'Tidak ada pendaftaran tertunda untuk role ini.'
                                        : 'Tidak ada pendaftaran yang menunggu persetujuan.'}
                                </Text>
                            </View>
                        }
                    />
                )}
            </View>
        </SafeAreaView>
    );
}
