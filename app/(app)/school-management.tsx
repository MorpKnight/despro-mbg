import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Grid from '../../components/layout/Grid';
import Button from '../../components/ui/Button';
import DataCard from '../../components/ui/DataCard';
import Dropdown from '../../components/ui/Dropdown';
import EmptyState from '../../components/ui/EmptyState';
import LoadingState from '../../components/ui/LoadingState';
import PageHeader from '../../components/ui/PageHeader';
import SearchInput from '../../components/ui/SearchInput';
import TextInput from '../../components/ui/TextInput';
import { useAuth } from '../../hooks/useAuth';
import { useResponsive } from '../../hooks/useResponsive';
import {
    HealthOfficeAreaItem,
    fetchHealthOfficeAreas,
} from '../../services/healthOfficeAreas';
import { DropdownOption } from '../../components/ui/Dropdown';
import { fetchProvinces, fetchCities } from '../../services/regions';
import {
    SchoolListItem,
    SchoolPayload,
    createSchool,
    deleteSchool,
    fetchSchools,
    updateSchool,
} from '../../services/schools';

type SchoolFormState = {
    id?: string;
    name: string;
    addressLine?: string | null;
    postalCode?: string | null;
    countryCode?: string | null;
    administrativeAreaLevel1?: string | null;
    administrativeAreaLevel2?: string | null;
    contactPhone?: string | null;
    healthOfficeAreaId?: string | null;
    healthOfficeAreaName?: string | null;
};

const EMPTY_FORM: SchoolFormState = {
    name: '',
    addressLine: null,
    postalCode: null,
    countryCode: 'ID', // Default to Indonesia
    administrativeAreaLevel1: null,
    administrativeAreaLevel2: null,
    contactPhone: null,
    healthOfficeAreaId: null,
    healthOfficeAreaName: null,
};

export default function SchoolManagementPage() {
    const router = useRouter();
    const { user, isEdgeMode } = useAuth();
    const { isDesktop } = useResponsive();
    const [list, setList] = useState<SchoolListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [form, setForm] = useState<SchoolFormState>(EMPTY_FORM);
    const [modalVisible, setModalVisible] = useState(false);
    const [healthAreas, setHealthAreas] = useState<HealthOfficeAreaItem[]>([]);
    const [healthAreaPickerVisible, setHealthAreaPickerVisible] = useState(false);

    // Region State
    const [provinces, setProvinces] = useState<DropdownOption[]>([]);
    const [cities, setCities] = useState<DropdownOption[]>([]);
    const [loadingRegions, setLoadingRegions] = useState(false);

    // Load Provinces on Mount
    React.useEffect(() => {
        const loadProvinces = async () => {
            const data = await fetchProvinces();
            setProvinces(data);
        };
        void loadProvinces();
    }, []);

    // Load Cities when Province changes
    React.useEffect(() => {
        const loadCities = async () => {
            if (form.administrativeAreaLevel1) {
                // If we are editing and have cities already, don't clear? 
                // Actually we should reload to be safe, or cache.
                // Simple approach: always fetch.
                const data = await fetchCities(form.administrativeAreaLevel1);
                setCities(data);
            } else {
                setCities([]);
            }
        };
        void loadCities();
    }, [form.administrativeAreaLevel1]);

    const loadSchools = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchSchools({ limit: 200 });
            setList(data);
        } catch (error) {
            console.warn('[school-management] failed to load schools', error);
            Alert.alert('Error', 'Gagal memuat daftar sekolah.');
        } finally {
            setLoading(false);
        }
    }, []);

    const loadHealthAreas = useCallback(async () => {
        try {
            const data = await fetchHealthOfficeAreas({ limit: 200 });
            setHealthAreas(data);
        } catch (error) {
            console.warn('[school-management] failed to load health areas', error);
            Alert.alert('Error', 'Gagal memuat data area Dinkes.');
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            void loadSchools();
            void loadHealthAreas();
        }, [loadSchools, loadHealthAreas]),
    );

    const filteredList = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return list;
        return list.filter((item) => {
            return (
                item.name.toLowerCase().includes(query)
                || (item.addressLine ?? '').toLowerCase().includes(query)
                || (item.administrativeAreaLevel1 ?? '').toLowerCase().includes(query)
                || (item.administrativeAreaLevel2 ?? '').toLowerCase().includes(query)
                || (item.contactPhone ?? '').toLowerCase().includes(query)
                || (item.healthOfficeArea?.name ?? '').toLowerCase().includes(query)
            );
        });
    }, [list, searchQuery]);

    const openCreateModal = () => {
        setForm(EMPTY_FORM);
        setModalVisible(true);
    };

    const openEditModal = (item: SchoolListItem) => {
        setForm({
            id: item.id,
            name: item.name,
            addressLine: item.addressLine ?? null,
            postalCode: item.postalCode ?? null,
            countryCode: item.countryCode ?? 'ID',
            administrativeAreaLevel1: item.administrativeAreaLevel1 ?? null,
            administrativeAreaLevel2: item.administrativeAreaLevel2 ?? null,
            contactPhone: item.contactPhone ?? null,
            healthOfficeAreaId: item.healthOfficeAreaId ?? null,
            healthOfficeAreaName: item.healthOfficeArea?.name ?? null,
        });
        setModalVisible(true);
    };

    const closeModal = () => {
        setModalVisible(false);
        setForm(EMPTY_FORM);
    };

    const normalize = (value?: string | null) => {
        if (value === undefined || value === null) return null;
        const trimmed = value.trim();
        return trimmed.length ? trimmed : null;
    };

    const buildPayload = (state: SchoolFormState): SchoolPayload => ({
        name: state.name.trim(),
        addressLine: normalize(state.addressLine),
        postalCode: normalize(state.postalCode),
        countryCode: normalize(state.countryCode),
        administrativeAreaLevel1: normalize(state.administrativeAreaLevel1),
        administrativeAreaLevel2: normalize(state.administrativeAreaLevel2),
        contactPhone: normalize(state.contactPhone),
        healthOfficeAreaId: state.healthOfficeAreaId ?? null,
    });

    const handleSave = async () => {
        if (!form.name.trim()) {
            Alert.alert('Validasi', 'Nama sekolah wajib diisi.');
            return;
        }

        setSaving(true);
        try {
            const payload = buildPayload(form);
            if (form.id) {
                await updateSchool(form.id, payload);
            } else {
                await createSchool(payload);
            }
            closeModal();
            await loadSchools();
        } catch (error: any) {
            console.warn('[school-management] save failed', error);
            Alert.alert('Error', error?.message ?? 'Gagal menyimpan data sekolah.');
        } finally {
            setSaving(false);
        }
    };

    const confirmDelete = (school: SchoolListItem) => {
        Alert.alert(
            'Hapus Sekolah',
            `Hapus ${school.name}? Aksi ini tidak dapat dibatalkan.`,
            [
                { text: 'Batal', style: 'cancel' },
                {
                    text: 'Hapus',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteSchool(school.id);
                            await loadSchools();
                        } catch (error) {
                            console.warn('[school-management] delete failed', error);
                            Alert.alert('Error', 'Gagal menghapus sekolah.');
                        }
                    },
                },
            ],
        );
    };

    const handleSelectHealthArea = (area: HealthOfficeAreaItem | null) => {
        setForm((prev) => ({
            ...prev,
            healthOfficeAreaId: area?.id ?? null,
            healthOfficeAreaName: area?.name ?? null,
        }));
        setHealthAreaPickerVisible(false);
    };

    const onRefresh = useCallback(() => {
        void loadSchools();
        void fetchHealthOfficeAreas().then(setHealthAreas).catch(() => { });
    }, [loadSchools]);

    if (user && user.role !== 'super_admin') {
        return (
            <SafeAreaView className="flex-1 bg-[#f5f7fb] items-center justify-center px-6">
                <Text className="text-lg font-semibold text-gray-800 text-center">
                    Akses fitur ini khusus untuk Super Admin.
                </Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-[#f5f7fb]">
            <View className="flex-1 p-6">
                <PageHeader
                    title="Manajemen Sekolah"
                    subtitle="Kelola data sekolah dan area dinas kesehatan"
                    showBackButton={false}
                    onRefresh={onRefresh}
                    isRefreshing={loading}
                    rightAction={
                        !isEdgeMode && (
                            <Button
                                title="Tambah"
                                size="sm"
                                onPress={openCreateModal}
                                icon={<Ionicons name="add" size={18} color="white" />}
                            />
                        )
                    }
                />

                <SearchInput
                    placeholder="Cari sekolah..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    containerClassName="mb-6"
                />

                {loading ? (
                    <LoadingState />
                ) : filteredList.length === 0 ? (
                    <EmptyState
                        title="Tidak ada sekolah"
                        description={searchQuery ? `Tidak ditemukan sekolah dengan kata kunci "${searchQuery}"` : "Belum ada data sekolah."}
                        actionLabel={!searchQuery && !isEdgeMode ? "Tambah Sekolah" : undefined}
                        onAction={openCreateModal}
                        actionIcon={<Ionicons name="add" size={20} color="white" />}
                    />
                ) : (
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <Grid desktopColumns={3} mobileColumns={1} gap={4}>
                            {filteredList.map((school) => (
                                <DataCard
                                    key={school.id}
                                    title={school.name}
                                    subtitle={school.addressLine ?? 'Alamat belum diisi'}
                                    content={
                                        <View className="flex-row flex-wrap gap-2 mt-2">
                                            {(school.administrativeAreaLevel2 || school.administrativeAreaLevel1) && (
                                                <View className="flex-row items-center bg-gray-100 px-2 py-1 rounded">
                                                    <Ionicons name="location-outline" size={12} color="#6B7280" />
                                                    <Text className="text-xs text-gray-600 ml-1">
                                                        {[school.administrativeAreaLevel2, school.administrativeAreaLevel1].filter(Boolean).join(', ')}
                                                    </Text>
                                                </View>
                                            )}
                                            {school.healthOfficeArea && (
                                                <View className="flex-row items-center bg-blue-50 px-2 py-1 rounded">
                                                    <Ionicons name="medkit-outline" size={12} color="#2563EB" />
                                                    <Text className="text-xs text-blue-700 ml-1">
                                                        {school.healthOfficeArea.name}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                    }
                                    actions={
                                        !isEdgeMode ? (
                                            <View className="flex-row gap-2">
                                                <TouchableOpacity
                                                    accessibilityRole="button"
                                                    onPress={() => openEditModal(school)}
                                                    className="p-2 bg-blue-50 rounded-full active:bg-blue-100"
                                                >
                                                    <Ionicons name="create-outline" size={20} color="#1976D2" />
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    accessibilityRole="button"
                                                    onPress={() => confirmDelete(school)}
                                                    className="p-2 bg-red-50 rounded-full active:bg-red-100"
                                                >
                                                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                                                </TouchableOpacity>
                                            </View>
                                        ) : undefined
                                    }
                                />
                            ))}
                        </Grid>
                        <View className="h-20" />
                    </ScrollView>
                )}
            </View>

            {/* School Form Modal */}
            <Modal visible={modalVisible} animationType="slide" transparent>
                <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-white rounded-t-3xl p-6 h-[90%]">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-xl font-bold text-gray-900">
                                {form.id ? 'Edit Sekolah' : 'Tambah Sekolah'}
                            </Text>
                            <TouchableOpacity onPress={closeModal} accessibilityRole="button">
                                <Ionicons name="close" size={24} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                            <View className="gap-4 pb-6">
                                <View>
                                    <Text className="text-sm font-medium text-gray-700 mb-1">Nama Sekolah <Text className="text-red-500">*</Text></Text>
                                    <TextInput
                                        placeholder="Contoh: SD Negeri 01 Jakarta"
                                        value={form.name}
                                        onChangeText={(value) => setForm((prev) => ({ ...prev, name: value }))}
                                        className="bg-white"
                                    />
                                </View>

                                <View>
                                    <Text className="text-sm font-medium text-gray-700 mb-1">Alamat Lengkap</Text>
                                    <TextInput
                                        placeholder="Nama jalan, nomor gedung, RT/RW"
                                        value={form.addressLine ?? ''}
                                        onChangeText={(value) => setForm((prev) => ({ ...prev, addressLine: value }))}
                                        className="bg-white"
                                    />
                                </View>

                                <Dropdown
                                    label="Provinsi"
                                    placeholder="Pilih Provinsi"
                                    options={provinces}
                                    value={form.administrativeAreaLevel1 ?? undefined}
                                    onValueChange={(value) => {
                                        setForm((prev) => ({
                                            ...prev,
                                            administrativeAreaLevel1: value,
                                            administrativeAreaLevel2: null, // Reset city when province changes
                                        }));
                                    }}
                                    className="mb-0"
                                />

                                <Dropdown
                                    label="Kota/Kabupaten"
                                    placeholder="Pilih Kota/Kabupaten"
                                    options={cities}
                                    value={form.administrativeAreaLevel2 ?? undefined}
                                    onValueChange={(value) => {
                                        setForm((prev) => ({ ...prev, administrativeAreaLevel2: value }));
                                    }}
                                    disabled={!form.administrativeAreaLevel1}
                                    className="mb-0"
                                />

                                <View>
                                    <Text className="text-sm font-medium text-gray-700 mb-1">Kode Pos</Text>
                                    <TextInput
                                        placeholder="Kode Pos (5 digit)"
                                        value={form.postalCode ?? ''}
                                        onChangeText={(value) => setForm((prev) => ({ ...prev, postalCode: value }))}
                                        keyboardType="number-pad"
                                        className="bg-white"
                                    />
                                </View>

                                <View>
                                    <Text className="text-sm font-medium text-gray-700 mb-1">Nomor Telepon</Text>
                                    <TextInput
                                        placeholder="Contoh: 021-12345678"
                                        value={form.contactPhone ?? ''}
                                        onChangeText={(value) => setForm((prev) => ({ ...prev, contactPhone: value }))}
                                        keyboardType="phone-pad"
                                        className="bg-white"
                                    />
                                </View>

                                <View>
                                    <Text className="text-sm font-medium text-gray-700 mb-1">Area Dinkes</Text>
                                    <TouchableOpacity
                                        onPress={() => setHealthAreaPickerVisible(true)}
                                        className="bg-white border border-gray-200 rounded-xl p-4 flex-row justify-between items-center"
                                    >
                                        <Text className={form.healthOfficeAreaName ? 'text-gray-900' : 'text-gray-400'}>
                                            {form.healthOfficeAreaName ?? 'Pilih Area Dinkes'}
                                        </Text>
                                        <Ionicons name="chevron-down" size={20} color="#6B7280" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </ScrollView>

                        <View className="pt-4 border-t border-gray-100">
                            <Button
                                title="Simpan"
                                onPress={handleSave}
                                loading={saving}
                                fullWidth
                            />
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Health Area Picker Modal */}
            <Modal visible={healthAreaPickerVisible} animationType="slide" transparent>
                <TouchableOpacity
                    className="flex-1 bg-black/50 justify-end"
                    onPress={() => setHealthAreaPickerVisible(false)}
                >
                    <View className="bg-white rounded-t-3xl h-[60%]">
                        <View className="flex-row justify-between items-center p-6 border-b border-gray-100">
                            <Text className="text-xl font-bold text-gray-900">Pilih Area Dinkes</Text>
                            <TouchableOpacity onPress={() => setHealthAreaPickerVisible(false)}>
                                <Ionicons name="close" size={24} color="#6B7280" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView className="flex-1 p-4">
                            <TouchableOpacity
                                onPress={() => handleSelectHealthArea(null)}
                                className="p-4 border-b border-gray-100 flex-row items-center justify-between"
                            >
                                <Text className="text-gray-500 italic">Tidak ada area</Text>
                                {!form.healthOfficeAreaId && <Ionicons name="checkmark" size={20} color="#3B82F6" />}
                            </TouchableOpacity>
                            {healthAreas.map((area) => (
                                <TouchableOpacity
                                    key={area.id}
                                    onPress={() => handleSelectHealthArea(area)}
                                    className="p-4 border-b border-gray-100 flex-row items-center justify-between"
                                >
                                    <Text className="text-gray-900">{area.name}</Text>
                                    {form.healthOfficeAreaId === area.id && (
                                        <Ionicons name="checkmark" size={20} color="#3B82F6" />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
}
