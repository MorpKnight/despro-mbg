import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Redirect, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import PageHeader from '../../components/ui/PageHeader';
import TextInput from '../../components/ui/TextInput';
import { useAuth } from '../../hooks/useAuth';
import { createApiKey, fetchApiKeys, revokeApiKey, type ApiKey } from '../../services/api-keys';

export default function ApiKeysPage() {
    const { user, isEdgeMode } = useAuth();
    const router = useRouter();

    const [keys, setKeys] = useState<ApiKey[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Create Modal State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newKeyName, setNewKeyName] = useState('');
    const [creating, setCreating] = useState(false);
    const [createdKey, setCreatedKey] = useState<string | null>(null);

    const isAdmin = user?.role === 'super_admin' || user?.role === 'admin_sekolah';

    useEffect(() => {
        if (isAdmin && !isEdgeMode) {
            loadKeys();
        }
    }, [isAdmin, isEdgeMode]);

    const loadKeys = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await fetchApiKeys();
            setKeys(data);
        } catch (e) {
            setError('Gagal memuat API Key.');
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newKeyName.trim()) {
            Alert.alert('Error', 'Nama label harus diisi.');
            return;
        }
        try {
            setCreating(true);
            const res = await createApiKey({ name: newKeyName });
            setCreatedKey(res.key);
            setNewKeyName('');
            loadKeys(); // Refresh list
        } catch (e) {
            Alert.alert('Error', 'Gagal membuat API Key.');
        } finally {
            setCreating(false);
        }
    };

    const handleRevoke = async (id: string, name: string) => {
        if (Platform.OS === 'web') {
            if (window.confirm(`Apakah Anda yakin ingin menghapus key "${name}"? Akses sinkronisasi untuk key ini akan hilang.`)) {
                await performDelete(id);
            }
        } else {
            Alert.alert(
                'Konfirmasi Hapus',
                `Apakah Anda yakin ingin menghapus key "${name}"? Akses sinkronisasi untuk key ini akan hilang.`,
                [
                    { text: 'Batal', style: 'cancel' },
                    {
                        text: 'Hapus',
                        style: 'destructive',
                        onPress: () => performDelete(id),
                    },
                ]
            );
        }
    };

    const performDelete = async (id: string) => {
        try {
            console.log('[API Keys] Deleting key:', id);
            await revokeApiKey(id);
            console.log('[API Keys] Delete successful, reloading...');
            await loadKeys();
            if (Platform.OS !== 'web') {
                Alert.alert('Berhasil', 'API Key berhasil dihapus.');
            } else {
                alert('API Key berhasil dihapus.');
            }
        } catch (e: any) {
            console.error('[API Keys] Delete failed:', e);
            const msg = e?.message || 'Gagal menghapus API Key.';
            if (Platform.OS !== 'web') {
                Alert.alert('Error', msg);
            } else {
                alert('Error: ' + msg);
            }
        }
    };

    const copyToClipboard = async () => {
        if (createdKey) {
            await Clipboard.setStringAsync(createdKey);
            Alert.alert('Disalin', 'API Key berhasil disalin ke clipboard.');
        }
    };

    if (!isAdmin) {
        return <Redirect href="/" />;
    }

    if (isEdgeMode) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center p-6">
                <View className="bg-white p-6 rounded-2xl shadow-sm items-center max-w-sm">
                    <Ionicons name="cloud-offline-outline" size={48} color="#6B7280" />
                    <Text className="text-xl font-bold text-gray-900 mt-4 text-center">
                        Fitur Tidak Tersedia
                    </Text>
                    <Text className="text-gray-500 text-center mt-2">
                        Manajemen API Key hanya dapat dilakukan di Server Pusat.
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <View className="flex-1 p-6">
                <PageHeader
                    title="Manajemen API Key"
                    subtitle="Kelola kunci akses untuk sinkronisasi server Edge"
                    showBackButton={false}
                    onRefresh={loadKeys}
                    isRefreshing={loading}
                    rightAction={
                        <Button
                            title="Buat Baru"
                            size="sm"
                            icon={<Ionicons name="add" size={18} color="white" />}
                            onPress={() => setShowCreateModal(true)}
                        />
                    }
                />

                {loading ? (
                    <ActivityIndicator size="large" color="#2563EB" className="mt-8" />
                ) : error ? (
                    <Text className="text-red-600 text-center mt-8">{error}</Text>
                ) : keys.length === 0 ? (
                    <View className="items-center justify-center py-12 bg-white rounded-2xl border border-gray-100 border-dashed">
                        <Ionicons name="key-outline" size={48} color="#D1D5DB" />
                        <Text className="text-gray-500 mt-3">Belum ada API Key yang dibuat.</Text>
                    </View>
                ) : (
                    <View className="gap-3">
                        {keys.map((key) => (
                            <Card key={key.id} className="flex-row items-center justify-between p-4">
                                <View className="flex-1 mr-4">
                                    <View className="flex-row items-center gap-2 mb-1">
                                        <Text className="font-bold text-gray-900 text-base">{key.name}</Text>
                                        <View className={`px-2 py-0.5 rounded-full ${key.is_active ? 'bg-green-100' : 'bg-gray-100'}`}>
                                            <Text className={`text-xs font-medium ${key.is_active ? 'text-green-700' : 'text-gray-600'}`}>
                                                {key.is_active ? 'Aktif' : 'Nonaktif'}
                                            </Text>
                                        </View>
                                    </View>
                                    <Text className="text-xs text-gray-500 font-mono bg-gray-50 self-start px-1.5 py-0.5 rounded border border-gray-200">
                                        {key.prefix}••••••••
                                    </Text>
                                    <Text className="text-xs text-gray-400 mt-1">
                                        Dibuat: {new Date(key.created_at).toLocaleDateString()}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() => handleRevoke(key.id, key.name)}
                                    className="p-2 bg-red-50 rounded-lg border border-red-100"
                                >
                                    <Ionicons name="trash-outline" size={20} color="#DC2626" />
                                </TouchableOpacity>
                            </Card>
                        ))}
                    </View>
                )}
            </View>

            {/* Create Modal */}
            <Modal
                visible={showCreateModal}
                transparent
                animationType="fade"
                onRequestClose={() => {
                    if (!createdKey) setShowCreateModal(false);
                }}
            >
                <View className="flex-1 bg-black/50 justify-center items-center p-4">
                    <View className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl">
                        <Text className="text-xl font-bold text-gray-900 mb-4">
                            {createdKey ? 'API Key Berhasil Dibuat' : 'Buat API Key Baru'}
                        </Text>

                        {createdKey ? (
                            <View>
                                <View className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 flex-row gap-2">
                                    <Ionicons name="warning" size={20} color="#D97706" />
                                    <Text className="text-yellow-800 text-sm flex-1">
                                        Simpan key ini sekarang. Key ini tidak akan ditampilkan lagi setelah Anda menutup jendela ini.
                                    </Text>
                                </View>

                                <Text className="text-sm font-medium text-gray-700 mb-1">API Key</Text>
                                <View className="bg-gray-100 border border-gray-200 rounded-lg p-3 mb-4 flex-row items-center justify-between">
                                    <Text className="font-mono text-gray-800 text-base flex-1 mr-2" numberOfLines={1}>
                                        {createdKey}
                                    </Text>
                                    <TouchableOpacity onPress={copyToClipboard}>
                                        <Ionicons name="copy-outline" size={20} color="#4B5563" />
                                    </TouchableOpacity>
                                </View>

                                <Button
                                    title="Selesai"
                                    onPress={() => {
                                        setCreatedKey(null);
                                        setShowCreateModal(false);
                                    }}
                                    fullWidth
                                />
                            </View>
                        ) : (
                            <View>
                                <Text className="text-sm text-gray-600 mb-4">
                                    Berikan nama label untuk key ini (misal: nama sekolah atau lokasi server).
                                </Text>

                                <Text className="text-sm font-medium text-gray-700 mb-1.5">Nama Label</Text>
                                <TextInput
                                    placeholder="Contoh: Server Lab 1"
                                    value={newKeyName}
                                    onChangeText={setNewKeyName}
                                    autoFocus
                                />

                                <View className="flex-row gap-3 mt-6">
                                    <View className="flex-1">
                                        <Button
                                            title="Batal"
                                            variant="outline"
                                            onPress={() => setShowCreateModal(false)}
                                            fullWidth
                                        />
                                    </View>
                                    <View className="flex-1">
                                        <Button
                                            title={creating ? 'Memproses...' : 'Buat Key'}
                                            onPress={handleCreate}
                                            disabled={!newKeyName.trim() || creating}
                                            fullWidth
                                        />
                                    </View>
                                </View>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
