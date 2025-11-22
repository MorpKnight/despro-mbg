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
    HealthOfficeAreaPayload,
    createHealthOfficeArea,
    deleteHealthOfficeArea,
    fetchHealthOfficeAreas,
    updateHealthOfficeArea,
} from '../../services/healthOfficeAreas';

type HealthAreaFormState = {
  id?: string;
  name: string;
  code?: string | null;
  coverageNotes?: string | null;
};

const EMPTY_FORM: HealthAreaFormState = {
  name: '',
  code: null,
  coverageNotes: null,
};

export default function HealthAreaManagementPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [list, setList] = useState<HealthOfficeAreaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [form, setForm] = useState<HealthAreaFormState>(EMPTY_FORM);
  const [modalVisible, setModalVisible] = useState(false);

  const loadAreas = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchHealthOfficeAreas({ limit: 200 });
      setList(data);
    } catch (error) {
      console.warn('[health-area-management] failed to load areas', error);
      Alert.alert('Error', 'Gagal memuat data area Dinkes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadAreas();
    }, [loadAreas]),
  );

  const filteredList = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return list;
    return list.filter((item) =>
      item.name.toLowerCase().includes(query)
      || (item.code ?? '').toLowerCase().includes(query)
      || (item.coverageNotes ?? '').toLowerCase().includes(query),
    );
  }, [list, searchQuery]);

  const openCreateModal = () => {
    setForm(EMPTY_FORM);
    setModalVisible(true);
  };

  const openEditModal = (item: HealthOfficeAreaItem) => {
    setForm({
      id: item.id,
      name: item.name,
      code: item.code ?? null,
      coverageNotes: item.coverageNotes ?? null,
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

  const buildPayload = (state: HealthAreaFormState): HealthOfficeAreaPayload => ({
    name: state.name.trim(),
    code: normalize(state.code),
    coverageNotes: normalize(state.coverageNotes),
  });

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.alert('Validasi', 'Nama area wajib diisi.');
      return;
    }

    setSaving(true);
    try {
      const payload = buildPayload(form);
      if (form.id) {
        await updateHealthOfficeArea(form.id, payload);
      } else {
        await createHealthOfficeArea(payload);
      }
      closeModal();
      await loadAreas();
    } catch (error: any) {
      console.warn('[health-area-management] save failed', error);
      Alert.alert('Error', error?.message ?? 'Gagal menyimpan area Dinkes.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (item: HealthOfficeAreaItem) => {
    Alert.alert(
      'Hapus Area Dinkes',
      `Hapus ${item.name}? Aksi ini tidak dapat dibatalkan.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteHealthOfficeArea(item.id);
              await loadAreas();
            } catch (error) {
              console.warn('[health-area-management] delete failed', error);
              Alert.alert('Error', 'Gagal menghapus area Dinkes.');
            }
          },
        },
      ],
    );
  };

  const renderItem = ({ item }: { item: HealthOfficeAreaItem }) => (
    <Card className="mb-3 p-4">
      <View className="flex-row justify-between items-start gap-3">
        <View className="flex-1 gap-1">
          <Text className="text-lg font-bold text-gray-900">{item.name}</Text>
          {item.code ? <Text className="text-sm text-blue-700">Kode: {item.code}</Text> : null}
          {item.coverageNotes ? (
            <Text className="text-sm text-gray-600" numberOfLines={3}>
              {item.coverageNotes}
            </Text>
          ) : null}
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
            <Text className="text-2xl font-bold text-gray-900">Manajemen Area Dinkes</Text>
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
            placeholder="Cari area Dinkes..."
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
                {searchQuery.trim() ? 'Tidak ada area yang sesuai.' : 'Belum ada data area.'}
              </Text>
            }
          />
        )}
      </View>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6 h-[70%]">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-gray-900">
                {form.id ? 'Edit Area Dinkes' : 'Tambah Area Dinkes'}
              </Text>
              <TouchableOpacity onPress={closeModal} accessibilityRole="button">
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View className="gap-4 flex-1">
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">Nama Area</Text>
                <TextInput
                  placeholder="Contoh: Jakarta Pusat"
                  value={form.name}
                  onChangeText={(value) => setForm((prev) => ({ ...prev, name: value }))}
                />
              </View>
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">Kode Area (opsional)</Text>
                <TextInput
                  placeholder="Contoh: DKIJKT-PUS"
                  value={form.code ?? ''}
                  onChangeText={(value) => setForm((prev) => ({ ...prev, code: value }))}
                />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-700 mb-1">Catatan Cakupan (opsional)</Text>
                <TextInput
                  multiline
                  placeholder="Deskripsikan wilayah cakupan"
                  value={form.coverageNotes ?? ''}
                  onChangeText={(value) => setForm((prev) => ({ ...prev, coverageNotes: value }))}
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
