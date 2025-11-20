import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { api } from '../../services/api';

interface Catering {
    id: string;
    nama: string;
    alamat: string;
    kontak: string;
}

export default function CateringManagementPage() {
    const router = useRouter();
    const [caterings, setCaterings] = useState<Catering[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingCatering, setEditingCatering] = useState<Partial<Catering>>({});
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchCaterings = async () => {
        try {
            const data = await api('caterings/');
            setCaterings(data);
        } catch (error) {
            console.error('Failed to fetch caterings:', error);
            Alert.alert('Error', 'Gagal memuat data katering.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCaterings();
    }, []);

    const handleSave = async () => {
        if (!editingCatering.nama) {
            Alert.alert('Error', 'Nama katering wajib diisi.');
            return;
        }

        setSaving(true);
        try {
            if (editingCatering.id) {
                await api(`caterings/${editingCatering.id}`, {
                    method: 'PATCH',
                    body: JSON.stringify(editingCatering),
                });
            } else {
                await api('caterings/', {
                    method: 'POST',
                    body: JSON.stringify(editingCatering),
                });
            }
            setIsModalVisible(false);
            fetchCaterings();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Gagal menyimpan data katering.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (id: string) => {
        Alert.alert('Konfirmasi', 'Apakah Anda yakin ingin menghapus katering ini?', [
            { text: 'Batal', style: 'cancel' },
            {
                text: 'Hapus',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await api(`caterings/${id}`, { method: 'DELETE' });
                        fetchCaterings();
                    } catch (error) {
                        Alert.alert('Error', 'Gagal menghapus katering.');
                    }
                },
            },
        ]);
    };

    const filteredCaterings = useMemo(() => {
        if (!searchQuery.trim()) return caterings;
        const query = searchQuery.toLowerCase();
        return caterings.filter(catering =>
            catering.nama.toLowerCase().includes(query) ||
            catering.alamat?.toLowerCase().includes(query)
        );
    }, [caterings, searchQuery]);

    const renderItem = ({ item }: { item: Catering }) => (
        <Card className="mb-3 p-4">
            <View className="flex-row justify-between items-center">
                <View className="flex-1">
                    <Text className="text-lg font-bold text-gray-900">{item.nama}</Text>
                    <Text className="text-gray-600">{item.alamat}</Text>
                    <Text className="text-xs text-gray-500 mt-1">{item.kontak}</Text>
                </View>
                <View className="flex-row gap-2">
                    <TouchableOpacity
                        onPress={() => { setEditingCatering(item); setIsModalVisible(true); }}
                        className="p-2 bg-blue-50 rounded-full"
                    >
                        <Ionicons name="create-outline" size={20} color="#1976D2" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => handleDelete(item.id)}
                        className="p-2 bg-red-50 rounded-full"
                    >
                        <Ionicons name="trash-outline" size={20} color="#EF4444" />
                    </TouchableOpacity>
                </View>
            </View>
        </Card>
    );

    return (
        <SafeAreaView className="flex-1 bg-[#f5f7fb]">
            <View className="flex-1 p-6">
                <View className="flex-row items-center justify-between mb-6">
                    <View className="flex-row items-center">
                        <TouchableOpacity onPress={() => router.back()} className="mr-4">
                            <Ionicons name="arrow-back" size={24} color="#111827" />
                        </TouchableOpacity>
                        <Text className="text-2xl font-bold text-gray-900">Manajemen Katering</Text>
                    </View>
                    <Button
                        title="+ Tambah"
                        size="sm"
                        onPress={() => { setEditingCatering({}); setIsModalVisible(true); }}
                    />
                </View>

                {/* Search */}
                <View className="mb-4 flex-row items-center bg-white border border-gray-300 rounded-lg px-3 h-12">
                    <Ionicons name="search" size={20} color="#9CA3AF" />
                    <TextInput
                        className="flex-1 ml-2 text-base text-gray-900"
                        placeholder="Cari katering..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color="#1976D2" />
                ) : (
                    <FlatList
                        data={filteredCaterings}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.id}
                        ListEmptyComponent={
                            <Text className="text-center text-gray-500 mt-10">
                                {searchQuery.trim() ? 'Tidak ada katering yang cocok dengan pencarian.' : 'Belum ada data katering.'}
                            </Text>
                        }
                    />
                )}

                <Modal visible={isModalVisible} animationType="slide" transparent>
                    <View className="flex-1 bg-black/50 justify-end">
                        <View className="bg-white rounded-t-3xl p-6 h-[70%]">
                            <View className="flex-row justify-between items-center mb-6">
                                <Text className="text-xl font-bold text-gray-900">
                                    {editingCatering.id ? 'Edit Katering' : 'Tambah Katering'}
                                </Text>
                                <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                                    <Ionicons name="close" size={24} color="#6B7280" />
                                </TouchableOpacity>
                            </View>

                            <View className="gap-4">
                                <View>
                                    <Text className="text-sm font-medium text-gray-700 mb-1">Nama Katering</Text>
                                    <TextInput
                                        className="border border-gray-300 rounded-lg p-3 text-base"
                                        value={editingCatering.nama}
                                        onChangeText={(t) => setEditingCatering({ ...editingCatering, nama: t })}
                                        placeholder="Contoh: Catering Sehat"
                                    />
                                </View>
                                <View>
                                    <Text className="text-sm font-medium text-gray-700 mb-1">Alamat</Text>
                                    <TextInput
                                        className="border border-gray-300 rounded-lg p-3 text-base"
                                        value={editingCatering.alamat}
                                        onChangeText={(t) => setEditingCatering({ ...editingCatering, alamat: t })}
                                        placeholder="Alamat lengkap"
                                        multiline
                                    />
                                </View>
                                <View>
                                    <Text className="text-sm font-medium text-gray-700 mb-1">Kontak</Text>
                                    <TextInput
                                        className="border border-gray-300 rounded-lg p-3 text-base"
                                        value={editingCatering.kontak}
                                        onChangeText={(t) => setEditingCatering({ ...editingCatering, kontak: t })}
                                        placeholder="Nomor telepon / Email"
                                    />
                                </View>

                                <Button
                                    title="Simpan"
                                    onPress={handleSave}
                                    loading={saving}
                                    className="mt-4"
                                />
                            </View>
                        </View>
                    </View>
                </Modal>
            </View>
        </SafeAreaView>
    );
}
