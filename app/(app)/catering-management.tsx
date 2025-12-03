import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
    Alert,
    FlatList,
    Modal,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/ui/Button';
import DataCard from '../../components/ui/DataCard';
import EmptyState from '../../components/ui/EmptyState';
import LoadingState from '../../components/ui/LoadingState';
import PageHeader from '../../components/ui/PageHeader';
import SearchInput from '../../components/ui/SearchInput';
import TextInput from '../../components/ui/TextInput';
import { useAuth } from '../../hooks/useAuth';
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
    alamat?: string | null;
    provinsi?: string | null;
    kotaKabupaten?: string | null;
    kecamatan?: string | null;
    kelurahan?: string | null;
    contactPhone?: string | null;
};

const EMPTY_FORM: CateringFormState = {
    name: '',
    alamat: null,
    provinsi: null,
    kotaKabupaten: null,
    kecamatan: null,
    kelurahan: null,
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
        return list.filter(item => item.name.toLowerCase().includes(lower));
    }, [list, searchQuery]);

    const openCreateModal = () => {
        setForm(EMPTY_FORM);
        setModalVisible(true);
    };

    const openEditModal = (item: CateringListItem) => {
        setForm({
            id: item.id,
            name: item.name,
            alamat: item.alamat,
            provinsi: item.provinsi,
            kotaKabupaten: item.kotaKabupaten,
            kecamatan: item.kecamatan,
            kelurahan: item.kelurahan,
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
                alamat: form.alamat,
                provinsi: form.provinsi,
                kotaKabupaten: form.kotaKabupaten,
                kecamatan: form.kecamatan,
                kelurahan: form.kelurahan,
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

    const renderItem = ({ item }: { item: CateringListItem }) => (
        <DataCard
            title={item.name}
            subtitle={item.alamat || undefined}
            content={
                <View className="gap-1 mt-1">
                    <View className="flex-row flex-wrap gap-x-3 gap-y-1">
                        {item.provinsi ? <Text className="text-xs text-gray-500">Provinsi: {item.provinsi}</Text> : null}
                        {item.kotaKabupaten ? <Text className="text-xs text-gray-500">Kota/Kab: {item.kotaKabupaten}</Text> : null}
                        {item.kecamatan ? <Text className="text-xs text-gray-500">Kec: {item.kecamatan}</Text> : null}
                        {item.kelurahan ? <Text className="text-xs text-gray-500">Kel: {item.kelurahan}</Text> : null}
                    </View>
                    {item.contactPhone ? <Text className="text-xs text-gray-500 mt-1">Kontak: {item.contactPhone}</Text> : null}
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
    );

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
                    subtitle={isEdgeMode ? "Read Only - Edge Mode" : undefined}
                    showBackButton={true}
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
                ) : (
                    <FlatList
                        data={filteredList}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.id}
                        ListEmptyComponent={
                            <EmptyState
                                title="Tidak ada katering"
                                description={searchQuery ? `Tidak ditemukan katering dengan kata kunci "${searchQuery}"` : "Belum ada data katering."}
                                actionLabel={!searchQuery && !isEdgeMode ? "Tambah Katering" : undefined}
                                onAction={openCreateModal}
                                actionIcon={<Ionicons name="add" size={20} color="white" />}
                            />
                        }
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        contentContainerStyle={{ paddingBottom: 24 }}
                    />
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

                        <View className="gap-4 flex-1">
                            <View>
                                <Text className="text-sm font-medium text-gray-700 mb-1">Nama Katering</Text>
                                <TextInput
                                    placeholder="Contoh: Catering Sehat"
                                    value={form.name}
                                    onChangeText={(value) => setForm((prev) => ({ ...prev, name: value }))}
                                />
                            </View>
                            <View>
                                <Text className="text-sm font-medium text-gray-700 mb-1">Alamat</Text>
                                <TextInput
                                    multiline
                                    placeholder="Alamat lengkap"
                                    value={form.alamat ?? ''}
                                    onChangeText={(value) => setForm((prev) => ({ ...prev, alamat: value }))}
                                />
                            </View>
                            <View className="flex-row gap-3">
                                <View className="flex-1 gap-1">
                                    <Text className="text-sm font-medium text-gray-700">Provinsi</Text>
                                    <TextInput
                                        placeholder="Provinsi"
                                        value={form.provinsi ?? ''}
                                        onChangeText={(value) => setForm((prev) => ({ ...prev, provinsi: value }))}
                                    />
                                </View>
                                <View className="flex-1 gap-1">
                                    <Text className="text-sm font-medium text-gray-700">Kota/Kabupaten</Text>
                                    <TextInput
                                        placeholder="Kota atau Kabupaten"
                                        value={form.kotaKabupaten ?? ''}
                                        onChangeText={(value) => setForm((prev) => ({ ...prev, kotaKabupaten: value }))}
                                    />
                                </View>
                            </View>
                            <View className="flex-row gap-3">
                                <View className="flex-1 gap-1">
                                    <Text className="text-sm font-medium text-gray-700">Kecamatan</Text>
                                    <TextInput
                                        placeholder="Kecamatan"
                                        value={form.kecamatan ?? ''}
                                        onChangeText={(value) => setForm((prev) => ({ ...prev, kecamatan: value }))}
                                    />
                                </View>
                                <View className="flex-1 gap-1">
                                    <Text className="text-sm font-medium text-gray-700">Kelurahan</Text>
                                    <TextInput
                                        placeholder="Kelurahan"
                                        value={form.kelurahan ?? ''}
                                        onChangeText={(value) => setForm((prev) => ({ ...prev, kelurahan: value }))}
                                    />
                                </View>
                            </View>
                            <View>
                                <Text className="text-sm font-medium text-gray-700 mb-1">Kontak</Text>
                                <TextInput
                                    placeholder="Nomor telepon (misal 0211234567)"
                                    keyboardType="phone-pad"
                                    value={form.contactPhone ?? ''}
                                    onChangeText={(value) => setForm((prev) => ({ ...prev, contactPhone: value }))}
                                />
                            </View>

                            <Button
                                title="Simpan"
                                onPress={handleSave}
                                loading={saving}
                                className="mt-auto"
                            />
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
