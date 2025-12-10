import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    Pressable,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Grid from '../../components/layout/Grid';
import Button from '../../components/ui/Button';
import DataCard from '../../components/ui/DataCard';
import PageHeader from '../../components/ui/PageHeader';
import { useAuth } from '../../hooks/useAuth';
import { fetchDinkesAssociations, deleteAssociation, type Association } from '../../services/associations';

type ViewMode = 'by_school' | 'by_catering';

interface GroupedItem {
    id: string;
    name: string;
    type: 'school' | 'catering';
    children: {
        id: string;
        entityId: string;
        name: string;
    }[];
}

const viewTabs: { key: ViewMode; label: string; icon: 'school-outline' | 'restaurant-outline' }[] = [
    { key: 'by_school', label: 'Per Sekolah', icon: 'school-outline' },
    { key: 'by_catering', label: 'Per Katering', icon: 'restaurant-outline' },
];

export default function DinkesAssociationsPage() {
    const { user } = useAuth();
    const [associations, setAssociations] = useState<Association[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>('by_catering');

    const stats = useMemo(() => {
        const uniqueSchools = new Set(associations.map(a => a.sekolah_id));
        const uniqueCaterings = new Set(associations.map(a => a.catering_id));
        return {
            totalConnections: associations.length,
            uniqueSchools: uniqueSchools.size,
            uniqueCaterings: uniqueCaterings.size,
        };
    }, [associations]);

    const groupedData = useMemo(() => {
        const groups: Map<string, GroupedItem> = new Map();

        if (viewMode === 'by_school') {
            associations.forEach(assoc => {
                if (!assoc.sekolah) return;
                if (!groups.has(assoc.sekolah_id)) {
                    groups.set(assoc.sekolah_id, {
                        id: assoc.sekolah_id,
                        name: assoc.sekolah.name,
                        type: 'school',
                        children: []
                    });
                }
                if (assoc.catering) {
                    groups.get(assoc.sekolah_id)!.children.push({
                        id: assoc.id,
                        entityId: assoc.catering_id,
                        name: assoc.catering.name
                    });
                }
            });
        } else {
            associations.forEach(assoc => {
                if (!assoc.catering) return;
                if (!groups.has(assoc.catering_id)) {
                    groups.set(assoc.catering_id, {
                        id: assoc.catering_id,
                        name: assoc.catering.name,
                        type: 'catering',
                        children: []
                    });
                }
                if (assoc.sekolah) {
                    groups.get(assoc.catering_id)!.children.push({
                        id: assoc.id,
                        entityId: assoc.sekolah_id,
                        name: assoc.sekolah.name
                    });
                }
            });
        }

        return Array.from(groups.values());
    }, [associations, viewMode]);

    const fetchData = async () => {
        try {
            // Use dedicated Dinkes endpoint that auto-filters by area
            const assocData = await fetchDinkesAssociations();
            setAssociations(assocData);
        } catch (error) {
            console.error('Failed to fetch data:', error);
            Alert.alert('Error', 'Gagal memuat data asosiasi.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const handleDeleteChild = (assocId: string, childName: string) => {
        Alert.alert(
            'Konfirmasi',
            `Putuskan hubungan dengan "${childName}"?`,
            [
                { text: 'Batal', style: 'cancel' },
                {
                    text: 'Putuskan',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteAssociation(assocId);
                            fetchData();
                        } catch (error) {
                            Alert.alert('Error', 'Gagal menghapus asosiasi.');
                        }
                    },
                },
            ]
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-[#f5f7fb]">
            <ScrollView className="flex-1">
                <View className="p-6 pb-24">
                    {/* Header */}
                    <PageHeader
                        title="Relasi Sekolah & Catering"
                        subtitle={`Asosiasi di wilayah ${user?.healthOfficeArea || 'Anda'}`}
                        showBackButton={true}
                        onRefresh={handleRefresh}
                        isRefreshing={refreshing}
                    />

                    {/* Stats Row */}
                    <View className="flex-row gap-3 mb-6">
                        <View className="flex-1 bg-white p-4 rounded-2xl border border-gray-100">
                            <View className="flex-row items-center justify-between">
                                <View className="w-10 h-10 rounded-xl bg-violet-50 items-center justify-center">
                                    <Ionicons name="git-network-outline" size={20} color="#8B5CF6" />
                                </View>
                                <Text className="text-2xl font-bold text-violet-600">{stats.totalConnections}</Text>
                            </View>
                            <Text className="text-xs font-medium text-gray-500 mt-2">Total Koneksi</Text>
                        </View>
                        <View className="flex-1 bg-white p-4 rounded-2xl border border-gray-100">
                            <View className="flex-row items-center justify-between">
                                <View className="w-10 h-10 rounded-xl bg-blue-50 items-center justify-center">
                                    <Ionicons name="school-outline" size={20} color="#3B82F6" />
                                </View>
                                <Text className="text-2xl font-bold text-blue-600">{stats.uniqueSchools}</Text>
                            </View>
                            <Text className="text-xs font-medium text-gray-500 mt-2">Sekolah</Text>
                        </View>
                        <View className="flex-1 bg-white p-4 rounded-2xl border border-gray-100">
                            <View className="flex-row items-center justify-between">
                                <View className="w-10 h-10 rounded-xl bg-emerald-50 items-center justify-center">
                                    <Ionicons name="restaurant-outline" size={20} color="#10B981" />
                                </View>
                                <Text className="text-2xl font-bold text-emerald-600">{stats.uniqueCaterings}</Text>
                            </View>
                            <Text className="text-xs font-medium text-gray-500 mt-2">Katering</Text>
                        </View>
                    </View>

                    {/* View Tabs */}
                    <View className="flex-row justify-between items-center mb-6">
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-grow">
                            <View className="flex-row gap-2">
                                {viewTabs.map((tab) => (
                                    <TouchableOpacity
                                        key={tab.key}
                                        onPress={() => setViewMode(tab.key)}
                                        className={`flex-row items-center gap-2 px-4 py-2 rounded-full border ${viewMode === tab.key
                                            ? 'bg-blue-600 border-blue-600'
                                            : 'bg-white border-gray-200'
                                            }`}
                                    >
                                        <Ionicons
                                            name={tab.icon}
                                            size={16}
                                            color={viewMode === tab.key ? '#fff' : '#6B7280'}
                                        />
                                        <Text className={`font-medium ${viewMode === tab.key ? 'text-white' : 'text-gray-600'}`}>
                                            {tab.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>
                    </View>

                    {/* Content */}
                    {loading ? (
                        <View className="items-center py-12">
                            <ActivityIndicator size="large" color="#1976D2" />
                        </View>
                    ) : groupedData.length === 0 ? (
                        <View className="bg-white p-8 rounded-2xl border border-gray-100">
                            <View className="items-center">
                                <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-4">
                                    <Ionicons name="git-network-outline" size={32} color="#9CA3AF" />
                                </View>
                                <Text className="text-lg font-bold text-gray-900 mb-2">Belum ada asosiasi</Text>
                                <Text className="text-sm text-gray-500 text-center">
                                    Tidak ada hubungan sekolah-catering di wilayah ini.
                                </Text>
                            </View>
                        </View>
                    ) : (
                        <Grid desktopColumns={3} mobileColumns={1} gap={4}>
                            {groupedData.map((group) => (
                                <DataCard
                                    key={group.id}
                                    title={group.name}
                                    subtitle={group.type === 'school' ? 'Sekolah' : 'Katering'}
                                    badges={
                                        <View className={`px-2 py-0.5 rounded-full ${group.type === 'school' ? 'bg-blue-100' : 'bg-emerald-100'
                                            }`}>
                                            <Text className={`text-xs font-medium ${group.type === 'school' ? 'text-blue-700' : 'text-emerald-700'
                                                }`}>
                                                {group.children.length} Mitra
                                            </Text>
                                        </View>
                                    }
                                    content={
                                        <View className="flex-row flex-wrap gap-2 mt-2">
                                            {group.children.map((child) => (
                                                <View
                                                    key={child.id}
                                                    className="flex-row items-center bg-gray-50 pl-3 pr-1 py-1 rounded-full border border-gray-200"
                                                >
                                                    <Ionicons
                                                        name={group.type === 'school' ? 'restaurant-outline' : 'school-outline'}
                                                        size={12}
                                                        color="#6B7280"
                                                    />
                                                    <Text className="text-sm text-gray-700 ml-1.5 mr-1 max-w-[120px]" numberOfLines={1}>
                                                        {child.name}
                                                    </Text>
                                                    <TouchableOpacity
                                                        onPress={() => handleDeleteChild(child.id, child.name)}
                                                        className="w-5 h-5 rounded-full bg-red-50 items-center justify-center"
                                                    >
                                                        <Ionicons name="close" size={12} color="#EF4444" />
                                                    </TouchableOpacity>
                                                </View>
                                            ))}
                                            {group.children.length === 0 && (
                                                <Text className="text-sm text-gray-400 italic">Tidak ada mitra</Text>
                                            )}
                                        </View>
                                    }
                                />
                            ))}
                        </Grid>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
