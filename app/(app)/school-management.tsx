import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    TextInput as RNTextInput,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import TextInput from '../../components/ui/TextInput';
import { useAuth } from '../../hooks/useAuth';
import {
    HealthOfficeAreaItem,
    fetchHealthOfficeAreas,
} from '../../services/healthOfficeAreas';
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
    alamat?: string | null;
    provinsi?: string | null;
    kotaKabupaten?: string | null;
    kecamatan?: string | null;
    kelurahan?: string | null;
    contactPhone?: string | null;
    healthOfficeAreaId?: string | null;
    healthOfficeAreaName?: string | null;
};

const EMPTY_FORM: SchoolFormState = {
    name: '',
    alamat: null,
    provinsi: null,
    kotaKabupaten: null,
    kecamatan: null,
    kelurahan: null,
    contactPhone: null,
    healthOfficeAreaId: null,
    healthOfficeAreaName: null,
};

export default function SchoolManagementPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [list, setList] = useState<SchoolListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [form, setForm] = useState<SchoolFormState>(EMPTY_FORM);
    const [modalVisible, setModalVisible] = useState(false);
    const [healthAreas, setHealthAreas] = useState<HealthOfficeAreaItem[]>([]);
    const [healthAreaPickerVisible, setHealthAreaPickerVisible] = useState(false);

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
                || (item.alamat ?? '').toLowerCase().includes(query)
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
            alamat: item.alamat ?? null,
            provinsi: item.provinsi ?? null,
            kotaKabupaten: item.kotaKabupaten ?? null,
            kecamatan: item.kecamatan ?? null,
            kelurahan: item.kelurahan ?? null,
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
        alamat: normalize(state.alamat),
        provinsi: normalize(state.provinsi),
        kotaKabupaten: normalize(state.kotaKabupaten),
        kecamatan: normalize(state.kecamatan),
        kelurahan: normalize(state.kelurahan),
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

    const renderItem = ({ item }: { item: SchoolListItem }) => (
        <Card className="mb-3 p-4">
            <View className="flex-row justify-between items-start gap-3">
                <View className="flex-1 gap-1">
                    <Text className="text-lg font-bold text-gray-900">{item.name}</Text>
                    {item.healthOfficeArea?.name ? (
                        <Text className="text-sm text-blue-700">Area Dinkes: {item.healthOfficeArea.name}</Text>
                    ) : null}
                    {item.alamat ? <Text className="text-sm text-gray-600">{item.alamat}</Text> : null}
                    <View className="flex-row flex-wrap gap-x-3 gap-y-1 mt-1">
                        {item.provinsi ? <Text className="text-xs text-gray-500">Provinsi: {item.provinsi}</Text> : null}
                        {item.kotaKabupaten ? <Text className="text-xs text-gray-500">Kota/Kab: {item.kotaKabupaten}</Text> : null}
                        {item.kecamatan ? <Text className="text-xs text-gray-500">Kec: {item.kecamatan}</Text> : null}
                        {item.kelurahan ? <Text className="text-xs text-gray-500">Kel: {item.kelurahan}</Text> : null}
                    </View>
                    {item.contactPhone ? <Text className="text-xs text-gray-500 mt-1">Kontak: {item.contactPhone}</Text> : null}
                </View>
                <View className="flex-row gap-2">
                    <TouchableOpacity
                        accessibilityRole="button"
                        onPress={() => openEditModal(item)}
                        className="p-2 bg-blue-50 rounded-full"
                    >
                        <Ionicons name="create-outline" size={20} color="#1976D2" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        accessibilityRole="button"
                        onPress={() => confirmDelete(item)}
                        className="p-2 bg-red-50 rounded-full"
                    >
                        <Ionicons name="trash-outline" size={20} color="#EF4444" />
                    </TouchableOpacity>
                </View>
            </View>
        </Card>
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
                <View className="flex-row items-center justify-between mb-6">
                    <View className="flex-row items-center">
                        <TouchableOpacity onPress={() => router.back()} className="mr-4" accessibilityRole="button">
                            <Ionicons name="arrow-back" size={24} color="#111827" />
                        </TouchableOpacity>
                        <Text className="text-2xl font-bold text-gray-900">Manajemen Sekolah</Text>
                    </View>
                    <Button
                        title="+ Tambah"
                        size="sm"
                        onPress={openCreateModal}
                    />
                </View>

                <View className="mb-4 flex-row items-center bg-white border border-gray-200 rounded-xl px-3 h-12">
                    <Ionicons name="search" size={20} color="#9CA3AF" />
                    <RNTextInput
                        placeholder="Cari sekolah atau area Dinkes..."
                        placeholderTextColor="#9CA3AF"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        className="flex-1 ml-2 text-base text-gray-900"
                    />
                </View>

                {loading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color="#1976D2" />
                    </View>
                ) : (
                    <FlatList
                        data={filteredList}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.id}
                        ListEmptyComponent={
                            <Text className="text-center text-gray-500 mt-10">
                                {searchQuery.trim() ? 'Tidak ada sekolah yang sesuai.' : 'Belum ada data sekolah.'}
                            </Text>
                        }
                    />
                )}
            </View>

            <Modal visible={modalVisible} animationType="slide" transparent>
                <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-white rounded-t-3xl p-6 h-[80%]">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-xl font-bold text-gray-900">
                                {form.id ? 'Edit Sekolah' : 'Tambah Sekolah'}
                            </Text>
                            <TouchableOpacity onPress={closeModal} accessibilityRole="button">
                                <Ionicons name="close" size={24} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        <View className="gap-4 flex-1">
                            <View>
                                <Text className="text-sm font-medium text-gray-700 mb-1">Nama Sekolah</Text>
                                <TextInput
                                    placeholder="Contoh: SDN 1 Bogor"
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
                            <View>
                                <Text className="text-sm font-medium text-gray-700 mb-1">Area Dinas Kesehatan</Text>
                                <TouchableOpacity
                                    className="border border-gray-200 rounded-xl px-3 py-3 bg-gray-50"
                                    onPress={() => setHealthAreaPickerVisible(true)}
                                >
                                    <Text className="text-base text-gray-900">
                                        {form.healthOfficeAreaName ?? 'Pilih area (opsional)'}
                                    </Text>
                                    {form.healthOfficeAreaName ? (
                                        <Text className="text-xs text-gray-500 mt-1">Ketuk untuk mengganti atau kosongkan.</Text>
                                    ) : null}
                                </TouchableOpacity>
                                {form.healthOfficeAreaId ? (
                                    <TouchableOpacity
                                        className="mt-2"
                                        onPress={() => handleSelectHealthArea(null)}
                                    >
                                        <Text className="text-sm text-red-500">Kosongkan area terpilih</Text>
                                    </TouchableOpacity>
                                ) : null}
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

            <Modal visible={healthAreaPickerVisible} animationType="fade" transparent>
                <View className="flex-1 bg-black/60 justify-center p-6">
                    <View className="bg-white rounded-2xl p-4 max-h-[70%]">
                        <View className="flex-row justify-between items-center mb-3">
                            <Text className="text-lg font-semibold text-gray-900">Pilih Area Dinkes</Text>
                            <TouchableOpacity onPress={() => setHealthAreaPickerVisible(false)} accessibilityRole="button">
                                <Ionicons name="close" size={22} color="#6B7280" />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={healthAreas}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    onPress={() => handleSelectHealthArea(item)}
                                    className="py-3 border-b border-gray-100"
                                >
                                    <Text className="text-base text-gray-900">{item.name}</Text>
                                    {item.code ? <Text className="text-xs text-gray-500">Kode: {item.code}</Text> : null}
                                    {item.coverageNotes ? (
                                        <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={2}>
                                            {item.coverageNotes}
                                        </Text>
                                    ) : null}
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={
                                <Text className="text-center text-gray-500 py-10">Belum ada area terdaftar.</Text>
                            }
                        />
                        <Button title="Batalkan" onPress={() => setHealthAreaPickerVisible(false)} className="mt-4" />
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
