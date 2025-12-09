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
import EmptyState from '../../components/ui/EmptyState';
import LoadingState from '../../components/ui/LoadingState';
import PageHeader from '../../components/ui/PageHeader';
import SearchInput from '../../components/ui/SearchInput';
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
          title="Manajemen Area Dinkes"
          subtitle="Kelola wilayah kerja dinas kesehatan"
          showBackButton={false}
          onRefresh={() => loadAreas()}
          isRefreshing={loading}
          rightAction={
            <Button
              title="Tambah"
              size="sm"
              onPress={openCreateModal}
              icon={<Ionicons name="add" size={18} color="white" />}
            />
          }
        />

        <SearchInput
          placeholder="Cari area Dinkes..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          containerClassName="mb-6"
        />

        {loading ? (
          <LoadingState />
        ) : filteredList.length === 0 ? (
          <EmptyState
            title="Tidak ada area"
            description={searchQuery ? `Tidak ditemukan area dengan kata kunci "${searchQuery}"` : "Belum ada data area."}
            actionLabel={!searchQuery ? "Tambah Area" : undefined}
            onAction={openCreateModal}
            actionIcon={<Ionicons name="add" size={20} color="white" />}
          />
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            <Grid desktopColumns={3} mobileColumns={1} gap={4}>
              {filteredList.map((item) => (
                <DataCard
                  key={item.id}
                  title={item.name}
                  subtitle={item.code ? `Kode: ${item.code}` : undefined}
                  content={
                    item.coverageNotes ? (
                      <Text className="text-sm text-gray-600 mt-1" numberOfLines={3}>
                        {item.coverageNotes}
                      </Text>
                    ) : undefined
                  }
                  actions={
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
          <View className="bg-white rounded-t-3xl p-6 h-[70%]">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-gray-900">
                {form.id ? 'Edit Area Dinkes' : 'Tambah Area Dinkes'}
              </Text>
              <TouchableOpacity onPress={closeModal} accessibilityRole="button">
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
              <View className="gap-4 pb-6">
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-1">Nama Area <Text className="text-red-500">*</Text></Text>
                  <TextInput
                    placeholder="Contoh: Jakarta Pusat"
                    value={form.name}
                    onChangeText={(value) => setForm((prev) => ({ ...prev, name: value }))}
                    className="bg-white"
                  />
                </View>
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-1">Kode Area (opsional)</Text>
                  <TextInput
                    placeholder="Contoh: DKIJKT-PUS"
                    value={form.code ?? ''}
                    onChangeText={(value) => setForm((prev) => ({ ...prev, code: value }))}
                    className="bg-white"
                  />
                </View>
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-1">Catatan Cakupan (opsional)</Text>
                  <TextInput
                    multiline
                    placeholder="Deskripsikan wilayah cakupan"
                    value={form.coverageNotes ?? ''}
                    onChangeText={(value) => setForm((prev) => ({ ...prev, coverageNotes: value }))}
                    className="bg-white h-24"
                    textAlignVertical="top"
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
