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
import Dropdown from '../../components/ui/Dropdown';
import EmptyState from '../../components/ui/EmptyState';
import LoadingState from '../../components/ui/LoadingState';
import PageHeader from '../../components/ui/PageHeader';
import { useAuth } from '../../hooks/useAuth';
import { fetchAssociations, createAssociation, deleteAssociation, type Association } from '../../services/associations';
import { api } from '../../services/api';

interface School {
    id: string;
    name: string;
}

interface Catering {
    id: string;
    name: string;
}

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

export default function AssociationManagementPage() {
    const { user } = useAuth();
    const [associations, setAssociations] = useState<Association[]>([]);
    const [schools, setSchools] = useState<School[]>([]);
    const [caterings, setCaterings] = useState<Catering[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedSchool, setSelectedSchool] = useState<string>('');
    const [selectedCatering, setSelectedCatering] = useState<string>('');
    const [saving, setSaving] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>('by_school');

    const isSuperAdmin = user?.role === 'super_admin';
    const isSchoolAdmin = user?.role === 'admin_sekolah';
    const isCateringAdmin = user?.role === 'admin_catering';

    useEffect(() => {
        if (isSchoolAdmin) setViewMode('by_school');
        if (isCateringAdmin) setViewMode('by_catering');
    }, [isSchoolAdmin, isCateringAdmin]);

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

    const schoolOptions = useMemo(() =>
        schools.map(s => ({ label: s.name, value: s.id })),
        [schools]
    );

    const cateringOptions = useMemo(() =>
        caterings.map(c => ({ label: c.name, value: c.id })),
        [caterings]
    );

    const fetchData = async () => {
        try {
            const [assocData, schoolData, cateringData] = await Promise.all([
                fetchAssociations(),
                api('associations/dropdown/schools'),
                api('associations/dropdown/caterings'),
            ]);
            setAssociations(assocData);
            setSchools(schoolData);
            setCaterings(cateringData);
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

    const handleOpenModal = () => {
        setSelectedSchool('');
        setSelectedCatering('');
        setIsModalVisible(true);
    };

    const handleSave = async () => {
        let finalSchoolId = selectedSchool;
        let finalCateringId = selectedCatering;

        if (isSchoolAdmin && user?.schoolId) {
            finalSchoolId = user.schoolId;
        }
        if (isCateringAdmin && user?.cateringId) {
            finalCateringId = user.cateringId;
        }

        if (!finalSchoolId || !finalCateringId) {
            Alert.alert('Error', 'Mohon pilih sekolah dan katering.');
            return;
        }

        setSaving(true);
        try {
            await createAssociation(finalSchoolId, finalCateringId);
            setIsModalVisible(false);
            fetchData();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Gagal menyimpan asosiasi.');
        } finally {
            setSaving(false);
        }
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

    const getSubtitle = () => {
        if (isSchoolAdmin) return 'Kelola mitra katering sekolah Anda';
        if (isCateringAdmin) return 'Kelola sekolah yang Anda layani';
        return 'Kelola hubungan antara sekolah dan katering';
    };

    return (
        <SafeAreaView className="flex-1 bg-[#f5f7fb]">
            <ScrollView className="flex-1">
                <View className="p-6 pb-24">
                    {/* Header */}
                    <PageHeader
                        title="Asosiasi Katering"
                        subtitle={getSubtitle()}
                        showBackButton={false}
                        onRefresh={handleRefresh}
                        isRefreshing={refreshing}
                        rightAction={null}
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

                    {/* View Tabs + Add Button */}
                    <View className="flex-row justify-between items-center mb-6">
                        {isSuperAdmin && (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-grow mr-4">
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
                        )}
                        {!isSuperAdmin && <View className="flex-1" />}
                        <Button
                            title="Tambah"
                            icon={<Ionicons name="add" size={18} color="white" />}
                            onPress={handleOpenModal}
                            size="sm"
                        />
                    </View>

                    {/* Content */}
                    {loading ? (
                        <LoadingState />
                    ) : groupedData.length === 0 ? (
                        <EmptyState
                            title="Belum ada asosiasi"
                            description="Tambahkan hubungan antara sekolah dan katering untuk memulai."
                            actionLabel="Tambah Asosiasi"
                            onAction={handleOpenModal}
                            actionIcon={<Ionicons name="add" size={20} color="white" />}
                        />
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

            {/* Add Modal - Simple Version */}
            <Modal visible={isModalVisible} animationType="slide" transparent>
                <Pressable
                    className="flex-1 bg-black/60 justify-end"
                    onPress={() => setIsModalVisible(false)}
                >
                    <Pressable
                        className="bg-white rounded-t-3xl shadow-2xl"
                        onPress={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <View className="flex-row justify-between items-center p-6 pb-4 border-b border-gray-100">
                            <View>
                                <Text className="text-2xl font-bold text-gray-900">Tambah Asosiasi</Text>
                                <Text className="text-sm text-gray-500 mt-1">Hubungkan sekolah dengan katering</Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => setIsModalVisible(false)}
                                className="p-2 bg-gray-100 rounded-full"
                            >
                                <Ionicons name="close" size={24} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        {/* Modal Body */}
                        <View className="px-6 py-6 gap-5">
                            {/* School Selection */}
                            {(isSuperAdmin || isCateringAdmin) && (
                                <Dropdown
                                    label="Pilih Sekolah"
                                    options={schoolOptions}
                                    value={selectedSchool || undefined}
                                    onValueChange={(val) => setSelectedSchool(val || '')}
                                    placeholder="Pilih sekolah..."
                                />
                            )}

                            {isSchoolAdmin && user?.sekolah && (
                                <View>
                                    <Text className="text-sm font-semibold text-gray-700 mb-2">Sekolah Anda</Text>
                                    <View className="flex-row items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                                        <View className="w-10 h-10 bg-blue-100 rounded-xl items-center justify-center">
                                            <Ionicons name="school" size={20} color="#3B82F6" />
                                        </View>
                                        <Text className="text-base font-medium text-blue-900">{user.sekolah.name}</Text>
                                    </View>
                                </View>
                            )}

                            {/* Catering Selection */}
                            {(isSuperAdmin || isSchoolAdmin) && (
                                <Dropdown
                                    label="Pilih Katering"
                                    options={cateringOptions}
                                    value={selectedCatering || undefined}
                                    onValueChange={(val) => setSelectedCatering(val || '')}
                                    placeholder="Pilih katering..."
                                />
                            )}

                            {isCateringAdmin && user?.catering && (
                                <View>
                                    <Text className="text-sm font-semibold text-gray-700 mb-2">Katering Anda</Text>
                                    <View className="flex-row items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                                        <View className="w-10 h-10 bg-emerald-100 rounded-xl items-center justify-center">
                                            <Ionicons name="restaurant" size={20} color="#10B981" />
                                        </View>
                                        <Text className="text-base font-medium text-emerald-900">{user.catering.name}</Text>
                                    </View>
                                </View>
                            )}
                        </View>

                        {/* Modal Footer */}
                        <View className="p-6 pt-0">
                            <Button
                                title="Simpan Asosiasi"
                                onPress={handleSave}
                                fullWidth
                                loading={saving}
                                icon={<Ionicons name="checkmark-circle" size={20} color="white" />}
                            />
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
        </SafeAreaView>
    );
}
