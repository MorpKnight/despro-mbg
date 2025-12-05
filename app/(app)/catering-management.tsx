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
import Dropdown, { DropdownOption } from '../../components/ui/Dropdown';
import EmptyState from '../../components/ui/EmptyState';
import LoadingState from '../../components/ui/LoadingState';
import PageHeader from '../../components/ui/PageHeader';
import SearchInput from '../../components/ui/SearchInput';
import TextInput from '../../components/ui/TextInput';
import { useAuth } from '../../hooks/useAuth';
import { fetchProvinces, fetchCities } from '../../services/regions';
import {
    CateringListItem,
    CateringPayload,
    createCatering,
    deleteCatering,
    fetchCaterings,
    updateCatering,
} from '../../services/caterings';

type CateringFormState = {
    id?: string;
    name: string;
    addressLine?: string | null;
    postalCode?: string | null;
    countryCode?: string | null;
    administrativeAreaLevel1?: string | null;
    administrativeAreaLevel2?: string | null;
    contactPhone?: string | null;
};

const EMPTY_FORM: CateringFormState = {
    name: '',
    addressLine: null,
    postalCode: null,
    countryCode: 'ID', // Default to Indonesia
    administrativeAreaLevel1: null,
    administrativeAreaLevel2: null,
    contactPhone: null,
};

export default function CateringManagementPage() {
    const router = useRouter();
    const { user, isEdgeMode } = useAuth();
    const [list, setList] = useState<CateringListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState<CateringFormState>(EMPTY_FORM);

    // Region State
    const [provinces, setProvinces] = useState<DropdownOption[]>([]);
    const [cities, setCities] = useState<DropdownOption[]>([]);

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
                const data = await fetchCities(form.administrativeAreaLevel1);
                setCities(data);
            } else {
                setCities([]);
            }
        };
        void loadCities();
    }, [form.administrativeAreaLevel1]);

    const loadCaterings = useCallback(async () => {
        try {
            setLoading(true);
            const data = await fetchCaterings();
            setList(data);
        } catch (error) {
            Alert.alert('Error', 'Gagal memuat data katering');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadCaterings();
        }, [loadCaterings])
    );

    const handleRefresh = () => {
        setRefreshing(true);
        loadCaterings();
    };

    const filteredList = useMemo(() => {
        if (!searchQuery) return list;
        const lower = searchQuery.toLowerCase();
        return list.filter((item) =>
            item.name.toLowerCase().includes(lower)
            || (item.addressLine ?? '').toLowerCase().includes(lower)
            || (item.administrativeAreaLevel1 ?? '').toLowerCase().includes(lower)
            || (item.administrativeAreaLevel2 ?? '').toLowerCase().includes(lower)
        );
    }, [list, searchQuery]);

    const openCreateModal = () => {
        setForm(EMPTY_FORM);
        setModalVisible(true);
    };

    const openEditModal = (item: CateringListItem) => {
        setForm({
            id: item.id,
            name: item.name,
            addressLine: item.addressLine,
            postalCode: item.postalCode,
            countryCode: item.countryCode,
            administrativeAreaLevel1: item.administrativeAreaLevel1,
            administrativeAreaLevel2: item.administrativeAreaLevel2,
            contactPhone: item.contactPhone,
        });
        setModalVisible(true);
    };

    const closeModal = () => {
        setModalVisible(false);
        setForm(EMPTY_FORM);
    };

    const handleSave = async () => {
        if (!form.name.trim()) {
            Alert.alert('Error', 'Nama katering wajib diisi');
            return;
        }

        try {
            setSaving(true);
            const payload: CateringPayload = {
                name: form.name,
                addressLine: form.addressLine,
                postalCode: form.postalCode,
                countryCode: form.countryCode,
                administrativeAreaLevel1: form.administrativeAreaLevel1,
                administrativeAreaLevel2: form.administrativeAreaLevel2,
                contactPhone: form.contactPhone,
            };

            if (form.id) {
                await updateCatering(form.id, payload);
            } else {
                await createCatering(payload);
            }
            closeModal();
            loadCaterings();
        } catch (error) {
            Alert.alert('Error', 'Gagal menyimpan data');
        } finally {
            setSaving(false);
        }
    };

    const confirmDelete = (item: CateringListItem) => {
        Alert.alert(
            'Hapus Katering',
            `Apakah Anda yakin ingin menghapus ${item.name}?`,
            [
                { text: 'Batal', style: 'cancel' },
                {
                    text: 'Hapus',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteCatering(item.id);
                            loadCaterings();
                        } catch (error) {
                            Alert.alert('Error', 'Gagal menghapus data');
                        }
                    },
                },
            ]
        );
    };

    if (user && user.role !== 'super_admin') {
        return (
            <SafeAreaView className="flex-1 bg-[#f5f7fb] items-center justify-center px-6">
                <Text className="text-lg font-semibold text-gray-800 text-center">
                    Akses fitur ini khusus untuk Super Admin.
                </Text>
                <Button title="Kembali" onPress={() => router.back()} className="mt-4" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-[#f5f7fb]">
            <View className="flex-1 p-6">
                <PageHeader
                    title="Manajemen Katering"
                    subtitle={isEdgeMode ? "Read Only - Edge Mode" : "Kelola data penyedia katering"}
                    showBackButton={true}
                    onRefresh={handleRefresh}
                    isRefreshing={refreshing}
                    rightAction={
                        !isEdgeMode ? (
                            <Button
                                title="Tambah"
                                size="sm"
                                onPress={openCreateModal}
                                icon={<Ionicons name="add" size={18} color="white" />}
                            />
                        ) : undefined
                    }
                />

                <SearchInput
                    placeholder="Cari katering..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    containerClassName="mb-6"
                />

                {loading ? (
                    <LoadingState />
                ) : filteredList.length === 0 ? (
                    <EmptyState
                        title="Tidak ada katering"
                        description={searchQuery ? `Tidak ditemukan katering dengan kata kunci "${searchQuery}"` : "Belum ada data katering."}
                        actionLabel={!searchQuery && !isEdgeMode ? "Tambah Katering" : undefined}
                        onAction={openCreateModal}
                        actionIcon={<Ionicons name="add" size={20} color="white" />}
                    />
                ) : (
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <Grid desktopColumns={2} mobileColumns={1} gap={4}>
                            {filteredList.map((item) => (
                                <DataCard
                                    key={item.id}
                                    title={item.name}
                                    subtitle={item.addressLine || undefined}
                                    content={
                                        <View className="flex-row items-center mt-2 flex-wrap gap-2">
                                            {(item.administrativeAreaLevel2 || item.administrativeAreaLevel1) && (
                                                <View className="flex-row items-center bg-gray-100 px-2 py-1 rounded">
                                                    <Ionicons name="location-outline" size={12} color="#6B7280" />
                                                    <Text className="text-xs text-gray-600 ml-1">
                                                        {[item.administrativeAreaLevel2, item.administrativeAreaLevel1].filter(Boolean).join(', ')}
                                                    </Text>
                                                </View>
                                            )}
                                            {item.contactPhone && (
                                                <View className="flex-row items-center bg-gray-100 px-2 py-1 rounded">
                                                    <Ionicons name="call-outline" size={12} color="#6B7280" />
                                                    <Text className="text-xs text-gray-600 ml-1">
                                                        {item.contactPhone}
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
                                                    onPress={() => openEditModal(item)}
                                                    className="p-2 bg-blue-50 rounded-full active:bg-blue-100"
                                                >
                                                    <Ionicons name="create-outline" size={20} color="#1976D2" />
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    accessibilityRole="button"
                                                    onPress={() => confirmDelete(item)}
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

            <Modal visible={modalVisible} animationType="slide" transparent>
                <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-white rounded-t-3xl p-6 h-[80%]">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-xl font-bold text-gray-900">
                                {form.id ? 'Edit Katering' : 'Tambah Katering'}
                            </Text>
                            <TouchableOpacity onPress={closeModal} accessibilityRole="button">
                                <Ionicons name="close" size={24} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                            <View className="gap-4 pb-6">
                                <View>
                                    <Text className="text-sm font-medium text-gray-700 mb-1">Nama Katering <Text className="text-red-500">*</Text></Text>
                                    <TextInput
                                        placeholder="Contoh: Catering Berkah"
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
                                            administrativeAreaLevel2: null,
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
                                        placeholder="Kode Pos"
                                        value={form.postalCode ?? ''}
                                        onChangeText={(value) => setForm((prev) => ({ ...prev, postalCode: value }))}
                                        keyboardType="number-pad"
                                        className="bg-white"
                                    />
                                </View>

                                <View>
                                    <Text className="text-sm font-medium text-gray-700 mb-1">Nomor Telepon</Text>
                                    <TextInput
                                        placeholder="Contoh: 08123456789"
                                        value={form.contactPhone ?? ''}
                                        onChangeText={(value) => setForm((prev) => ({ ...prev, contactPhone: value }))}
                                        keyboardType="phone-pad"
                                        className="bg-white"
                                    />
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
        </SafeAreaView>
    );
}
