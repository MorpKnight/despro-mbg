import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { api } from '../../services/api';

interface Association {
    id: string;
    school_id: string;
    catering_id: string;
    school_name: string;
    catering_name: string;
}

interface School {
    id: string;
    nama: string;
}

interface Catering {
    id: string;
    nama: string;
}

export default function AssociationManagementPage() {
    const router = useRouter();
    const [associations, setAssociations] = useState<Association[]>([]);
    const [schools, setSchools] = useState<School[]>([]);
    const [caterings, setCaterings] = useState<Catering[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedSchool, setSelectedSchool] = useState<string>('');
    const [selectedCatering, setSelectedCatering] = useState<string>('');
    const [saving, setSaving] = useState(false);

    const fetchData = async () => {
        try {
            const [assocData, schoolData, cateringData] = await Promise.all([
                api('associations/'),
                api('schools/'),
                api('caterings/'),
            ]);
            setAssociations(assocData);
            setSchools(schoolData);
            setCaterings(cateringData);
        } catch (error) {
            console.error('Failed to fetch data:', error);
            Alert.alert('Error', 'Gagal memuat data asosiasi.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSave = async () => {
        if (!selectedSchool || !selectedCatering) {
            Alert.alert('Error', 'Mohon pilih sekolah dan katering.');
            return;
        }

        setSaving(true);
        try {
            await api('associations/', {
                method: 'POST',
                body: JSON.stringify({ school_id: selectedSchool, catering_id: selectedCatering }),
            });
            setIsModalVisible(false);
            fetchData();
            setSelectedSchool('');
            setSelectedCatering('');
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Gagal menyimpan asosiasi.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (id: string) => {
        Alert.alert('Konfirmasi', 'Apakah Anda yakin ingin menghapus asosiasi ini?', [
            { text: 'Batal', style: 'cancel' },
            {
                text: 'Hapus',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await api(`associations/${id}`, { method: 'DELETE' });
                        fetchData();
                    } catch (error) {
                        Alert.alert('Error', 'Gagal menghapus asosiasi.');
                    }
                },
            },
        ]);
    };

    const renderItem = ({ item }: { item: Association }) => (
        <Card className="mb-3 p-4">
            <View className="flex-row justify-between items-center">
                <View className="flex-1">
                    <View className="flex-row items-center mb-2">
                        <Ionicons name="school-outline" size={16} color="#4B5563" />
                        <Text className="text-base font-semibold text-gray-900 ml-2">{item.school_name}</Text>
                    </View>
                    <View className="flex-row items-center">
                        <Ionicons name="restaurant-outline" size={16} color="#4B5563" />
                        <Text className="text-base font-semibold text-gray-900 ml-2">{item.catering_name}</Text>
                    </View>
                </View>
                <TouchableOpacity
                    onPress={() => handleDelete(item.id)}
                    className="p-2 bg-red-50 rounded-full"
                >
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </TouchableOpacity>
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
                        <Text className="text-2xl font-bold text-gray-900">Asosiasi Katering</Text>
                    </View>
                    <Button
                        title="+ Tambah"
                        size="sm"
                        onPress={() => setIsModalVisible(true)}
                    />
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color="#1976D2" />
                ) : (
                    <FlatList
                        data={associations}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.id}
                        ListEmptyComponent={<Text className="text-center text-gray-500 mt-10">Belum ada data asosiasi.</Text>}
                    />
                )}

                <Modal visible={isModalVisible} animationType="slide" transparent>
                    <View className="flex-1 bg-black/50 justify-end">
                        <View className="bg-white rounded-t-3xl p-6 h-[60%]">
                            <View className="flex-row justify-between items-center mb-6">
                                <Text className="text-xl font-bold text-gray-900">Tambah Asosiasi</Text>
                                <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                                    <Ionicons name="close" size={24} color="#6B7280" />
                                </TouchableOpacity>
                            </View>

                            <View className="gap-4">
                                <View>
                                    <Text className="text-sm font-medium text-gray-700 mb-2">Pilih Sekolah</Text>
                                    <FlatList
                                        data={schools}
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        keyExtractor={(item) => item.id}
                                        renderItem={({ item }) => (
                                            <TouchableOpacity
                                                onPress={() => setSelectedSchool(item.id)}
                                                className={`mr-2 px-4 py-2 rounded-full border ${selectedSchool === item.id ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}
                                            >
                                                <Text className={selectedSchool === item.id ? 'text-white' : 'text-gray-700'}>{item.nama}</Text>
                                            </TouchableOpacity>
                                        )}
                                        className="mb-2"
                                    />
                                </View>

                                <View>
                                    <Text className="text-sm font-medium text-gray-700 mb-2">Pilih Katering</Text>
                                    <FlatList
                                        data={caterings}
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        keyExtractor={(item) => item.id}
                                        renderItem={({ item }) => (
                                            <TouchableOpacity
                                                onPress={() => setSelectedCatering(item.id)}
                                                className={`mr-2 px-4 py-2 rounded-full border ${selectedCatering === item.id ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}
                                            >
                                                <Text className={selectedCatering === item.id ? 'text-white' : 'text-gray-700'}>{item.nama}</Text>
                                            </TouchableOpacity>
                                        )}
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
