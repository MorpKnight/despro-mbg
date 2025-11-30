import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Grid from '../../components/layout/Grid';
import Button from '../../components/ui/Button';
import DataCard from '../../components/ui/DataCard';
import Dropdown, { type DropdownOption } from '../../components/ui/Dropdown';
import EmptyState from '../../components/ui/EmptyState';
import LoadingState from '../../components/ui/LoadingState';
import PageHeader from '../../components/ui/PageHeader';
import SearchInput from '../../components/ui/SearchInput';
import TextInput from '../../components/ui/TextInput';
import { useAuth } from '../../hooks/useAuth';
import { useResponsive } from '../../hooks/useResponsive';
import { fetchCaterings, type CateringListItem } from '../../services/caterings';
import { fetchHealthOfficeAreas, type HealthOfficeAreaItem } from '../../services/healthOfficeAreas';
import { fetchSchools, type SchoolListItem } from '../../services/schools';
import {
  createUser,
  deleteUser,
  fetchUsers,
  updateUser,
  type CreateUserPayload,
  type UpdateUserPayload,
  type User,
  type UserAccountStatus,
  type UserRole,
} from '../../services/users';

type RoleFilter = 'all' | UserRole;
type StatusFilter = 'all' | UserAccountStatus;

const roleOptions: DropdownOption[] = [
  { label: 'Super Admin', value: 'super_admin' },
  { label: 'Admin Sekolah', value: 'admin_sekolah' },
  { label: 'Admin Catering', value: 'admin_catering' },
  { label: 'Admin Dinkes', value: 'admin_dinkes' },
  { label: 'Siswa', value: 'siswa' },
];

const accountStatusOptions: DropdownOption[] = [
  { label: 'Menunggu Konfirmasi', value: 'pending_confirmation' },
  { label: 'Aktif', value: 'active' },
  { label: 'Tidak Aktif', value: 'inactive' },
  { label: 'Ditangguhkan', value: 'suspended' },
];

const statusFilterOptions: DropdownOption[] = [
  { label: 'Semua Status', value: 'all' },
  ...accountStatusOptions,
];

const roleTabs: { key: RoleFilter; label: string }[] = [
  { key: 'all', label: 'Semua' },
  { key: 'super_admin', label: 'Super Admin' },
  { key: 'admin_sekolah', label: 'Admin Sekolah' },
  { key: 'admin_catering', label: 'Admin Catering' },
  { key: 'admin_dinkes', label: 'Admin Dinkes' },
  { key: 'siswa', label: 'Siswa' },
];

function getRoleLabel(role: string): string {
  const option = roleOptions.find(opt => opt.value === role);
  return option ? option.label : role.replace('_', ' ');
}

export default function UserManagementPage() {
  const { isDesktop } = useResponsive();
  const { isEdgeMode } = useAuth();
  const [activeTab, setActiveTab] = useState<RoleFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [users, setUsers] = useState<User[]>([]);
  const [schools, setSchools] = useState<SchoolListItem[]>([]);
  const [caterings, setCaterings] = useState<CateringListItem[]>([]);
  const [healthAreas, setHealthAreas] = useState<HealthOfficeAreaItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<(Partial<User> & { password?: string }) | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [usersData, schoolsData, cateringsData, healthAreasData] = await Promise.all([
        fetchUsers(),
        fetchSchools(),
        fetchCaterings(),
        fetchHealthOfficeAreas(),
      ]);
      setUsers(usersData);
      setSchools(schoolsData);
      setCaterings(cateringsData);
      setHealthAreas(healthAreasData);
    } catch (error) {
      Alert.alert('Error', 'Gagal memuat data pengguna');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesRole = activeTab === 'all' || user.role === activeTab;
      const matchesSearch =
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.fullName && user.fullName.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesRole && matchesSearch;
    });
  }, [users, activeTab, searchQuery]);

  const schoolOptions = useMemo(() => schools.map(s => ({ label: s.name, value: s.id })), [schools]);
  const cateringOptions = useMemo(() => caterings.map(c => ({ label: c.name, value: c.id })), [caterings]);
  const healthAreaOptions = useMemo(() => healthAreas.map(h => ({ label: h.name, value: h.id })), [healthAreas]);

  const handleCreate = () => {
    setSelectedUser({
      role: 'siswa',
      accountStatus: 'active',
    });
    setIsModalVisible(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser({ ...user });
    setIsModalVisible(true);
  };

  const handleDelete = () => {
    if (!selectedUser?.id) return;
    Alert.alert(
      'Hapus Pengguna',
      `Apakah Anda yakin ingin menghapus user ${selectedUser.username}?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              setModalLoading(true);
              await deleteUser(selectedUser.id!);
              setIsModalVisible(false);
              loadData();
            } catch (error) {
              Alert.alert('Error', 'Gagal menghapus pengguna');
            } finally {
              setModalLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleSave = async () => {
    if (!selectedUser?.username) {
      Alert.alert('Error', 'Username wajib diisi');
      return;
    }

    try {
      setModalLoading(true);
      if (selectedUser.id) {
        // Update
        const payload: UpdateUserPayload = {
          full_name: selectedUser.fullName || undefined,
          role: selectedUser.role,
          account_status: selectedUser.accountStatus,
          school_id: selectedUser.schoolId || undefined,
          catering_id: selectedUser.cateringId || undefined,
          health_office_area_id: selectedUser.healthOfficeAreaId || undefined,
          health_office_area: selectedUser.healthOfficeArea || undefined,
        };
        if (selectedUser.password) {
          payload.password = selectedUser.password;
        }
        await updateUser(selectedUser.id, payload);
      } else {
        // Create
        if (!selectedUser.password) {
          Alert.alert('Error', 'Password wajib diisi untuk pengguna baru');
          setModalLoading(false);
          return;
        }
        const payload: CreateUserPayload = {
          username: selectedUser.username,
          password: selectedUser.password,
          full_name: selectedUser.fullName || undefined,
          role: selectedUser.role || 'siswa',
          account_status: selectedUser.accountStatus || 'active',
          school_id: selectedUser.schoolId || undefined,
          catering_id: selectedUser.cateringId || undefined,
          health_office_area_id: selectedUser.healthOfficeAreaId || undefined,
          health_office_area: selectedUser.healthOfficeArea || undefined,
        };
        await createUser(payload);
      }
      setIsModalVisible(false);
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Gagal menyimpan data pengguna');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f5f7fb]">
      <ScrollView className="flex-1">
        <View className="p-6 pb-24">
          {/* Header */}
          <PageHeader
            title="Manajemen Pengguna"
            subtitle="Kelola akun, peran, dan akses sistem"
            showBackButton={false}
            rightAction={
              <Button
                title="Refresh"
                variant="ghost"
                icon={<Ionicons name="refresh" size={20} color="#4B5563" />}
                onPress={handleRefresh}
                loading={refreshing}
              />
            }
          />

          {/* Role Tabs */}
          <View className="flex-row justify-between items-center mb-6">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-grow mr-4">
              <View className="flex-row gap-2">
                {roleTabs.map((tab) => (
                  <TouchableOpacity
                    key={tab.key}
                    onPress={() => setActiveTab(tab.key)}
                    className={`px-4 py-2 rounded-full border ${activeTab === tab.key
                      ? 'bg-blue-600 border-blue-600'
                      : 'bg-white border-gray-200'
                      }`}
                  >
                    <Text
                      className={`font-medium ${activeTab === tab.key ? 'text-white' : 'text-gray-600'
                        }`}
                    >
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            {!isEdgeMode && (
              <Button
                title="Tambah"
                icon={<Ionicons name="person-add" size={18} color="white" />}
                onPress={handleCreate}
                size="sm"
              />
            )}
          </View>

          {/* Search */}
          <SearchInput
            placeholder="Cari pengguna..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            containerClassName="mb-6"
          />

          {loading ? (
            <LoadingState />
          ) : filteredUsers.length === 0 ? (
            <EmptyState
              title="Tidak ada pengguna"
              description={searchQuery ? `Tidak ditemukan pengguna dengan kata kunci "${searchQuery}"` : "Belum ada data pengguna untuk filter ini."}
              actionLabel={!searchQuery && !isEdgeMode ? "Tambah Pengguna" : undefined}
              onAction={handleCreate}
              actionIcon={<Ionicons name="add" size={20} color="white" />}
            />
          ) : (
            <Grid desktopColumns={3} mobileColumns={1} gap={4}>
              {filteredUsers.map((user) => (
                <DataCard
                  key={user.id}
                  title={user.fullName || user.username}
                  subtitle={`@${user.username}`}
                  badges={
                    <View
                      className={`px-2 py-0.5 rounded-full ${user.accountStatus === 'active'
                        ? 'bg-green-100'
                        : 'bg-gray-100'
                        }`}
                    >
                      <Text
                        className={`text-xs font-medium ${user.accountStatus === 'active'
                          ? 'text-green-700'
                          : 'text-gray-600'
                          }`}
                      >
                        {user.accountStatus}
                      </Text>
                    </View>
                  }
                  content={
                    <View className="flex-row flex-wrap gap-2 mt-1">
                      <View className="bg-blue-50 px-2 py-1 rounded-md">
                        <Text className="text-xs text-blue-700 font-medium">
                          {getRoleLabel(user.role)}
                        </Text>
                      </View>
                      {user.sekolah && (
                        <View className="bg-orange-50 px-2 py-1 rounded-md">
                          <Text className="text-xs text-orange-700">
                            {user.sekolah.name}
                          </Text>
                        </View>
                      )}
                      {user.catering && (
                        <View className="bg-purple-50 px-2 py-1 rounded-md">
                          <Text className="text-xs text-purple-700">
                            {user.catering.name}
                          </Text>
                        </View>
                      )}
                    </View>
                  }
                  actions={
                    !isEdgeMode ? (
                      <TouchableOpacity
                        onPress={() => handleEdit(user)}
                        className="p-2 bg-blue-50 rounded-full active:bg-blue-100"
                        activeOpacity={0.7}
                      >
                        <Ionicons name="create-outline" size={20} color="#1976D2" />
                      </TouchableOpacity>
                    ) : undefined
                  }
                />
              ))}
            </Grid>
          )}
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={isModalVisible} animationType="slide" transparent>
        <Pressable
          className="flex-1 bg-black/60 justify-end"
          onPress={() => setIsModalVisible(false)}
        >
          <Pressable
            className="bg-white rounded-t-3xl h-[90%] shadow-2xl"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="flex-row justify-between items-center p-6 pb-4 border-b border-gray-100">
              <View>
                <Text className="text-2xl font-bold text-gray-900">
                  {selectedUser?.id ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}
                </Text>
                <Text className="text-sm text-gray-500 mt-1">
                  {selectedUser?.id ? 'Ubah informasi pengguna' : 'Buat akun pengguna baru'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsModalVisible(false)}
                className="p-2 bg-gray-100 rounded-full"
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 px-6 py-4">
              <View className="gap-5">
                {/* Username */}
                <View>
                  <Text className="text-sm font-semibold text-gray-700 mb-2">
                    Username <Text className="text-red-500">*</Text>
                  </Text>
                  <TextInput
                    className="border-2 border-gray-200 rounded-xl p-4 text-base bg-white"
                    value={selectedUser?.username}
                    onChangeText={(t) => setSelectedUser(prev => ({ ...prev!, username: t }))}
                    placeholder="username"
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="none"
                  />
                </View>

                {/* Password */}
                <View>
                  <Text className="text-sm font-semibold text-gray-700 mb-2">
                    Password {selectedUser?.id ? '(Kosongkan jika tidak diubah)' : <Text className="text-red-500">*</Text>}
                  </Text>
                  <TextInput
                    className="border-2 border-gray-200 rounded-xl p-4 text-base bg-white"
                    value={selectedUser?.password}
                    onChangeText={(t) => setSelectedUser(prev => ({ ...prev!, password: t }))}
                    placeholder="Password"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry
                  />
                </View>

                {/* Name */}
                <View>
                  <Text className="text-sm font-semibold text-gray-700 mb-2">
                    Nama Lengkap
                  </Text>
                  <TextInput
                    className="border-2 border-gray-200 rounded-xl p-4 text-base bg-white"
                    value={selectedUser?.fullName || ''}
                    onChangeText={(t) => setSelectedUser(prev => ({ ...prev!, fullName: t }))}
                    placeholder="Nama Lengkap"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                {/* Role Dropdown */}
                <Dropdown
                  label="Role"
                  options={roleOptions}
                  value={selectedUser?.role}
                  onValueChange={(role) => setSelectedUser(prev => ({ ...prev!, role: role as UserRole }))}
                  placeholder="Pilih role"
                />

                <Dropdown
                  label="Status Akun"
                  options={accountStatusOptions}
                  value={selectedUser?.accountStatus}
                  onValueChange={(status) => setSelectedUser(prev => ({ ...prev!, accountStatus: status as UserAccountStatus }))}
                  placeholder="Pilih status akun"
                />

                {/* Conditional fields */}
                {(selectedUser?.role === 'admin_sekolah' || selectedUser?.role === 'siswa') && (
                  <Dropdown
                    label="Sekolah"
                    options={schoolOptions}
                    value={selectedUser?.schoolId || undefined}
                    onValueChange={(val) => setSelectedUser(prev => ({ ...prev!, schoolId: val }))}
                    placeholder="Pilih Sekolah"
                  />
                )}

                {selectedUser?.role === 'admin_catering' && (
                  <Dropdown
                    label="Katering"
                    options={cateringOptions}
                    value={selectedUser?.cateringId || undefined}
                    onValueChange={(val) => setSelectedUser(prev => ({ ...prev!, cateringId: val }))}
                    placeholder="Pilih Katering"
                  />
                )}

                {selectedUser?.role === 'admin_dinkes' && (
                  <View className="gap-3">
                    <Dropdown
                      label="Wilayah Kesehatan"
                      options={healthAreaOptions}
                      value={selectedUser?.healthOfficeAreaId ?? undefined}
                      onValueChange={(val) => {
                        const found = healthAreas.find((area) => area.id === val);
                        setSelectedUser((prev) => ({
                          ...prev!,
                          healthOfficeAreaId: val ?? null,
                          healthOfficeArea: found?.name ?? (prev?.healthOfficeArea ?? ''),
                        }));
                      }}
                      placeholder="Pilih Wilayah"
                    />
                    <View>
                      <Text className="text-sm font-semibold text-gray-700 mb-2">
                        Wilayah Baru / Catatan
                      </Text>
                      <TextInput
                        className="border-2 border-gray-200 rounded-xl p-4 text-base bg-white"
                        value={selectedUser?.healthOfficeArea || ''}
                        onChangeText={(t) => setSelectedUser(prev => ({ ...prev!, healthOfficeArea: t, healthOfficeAreaId: null }))}
                        placeholder="Masukkan nama wilayah"
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>
                  </View>
                )}
              </View>
            </ScrollView>

            {/* Action Buttons */}
            <View className="p-6 pt-4 border-t-2 border-gray-100 gap-3">
              <Button
                title="Simpan Perubahan"
                onPress={handleSave}
                fullWidth
                loading={modalLoading}
                icon={<Ionicons name="checkmark-circle" size={20} color="white" />}
              />
              {selectedUser?.id && (
                <Button
                  title="Hapus Pengguna"
                  variant="outline"
                  fullWidth
                  className="border-red-300"
                  textClassName="text-red-600"
                  icon={<Ionicons name="trash-outline" size={18} color="#DC2626" />}
                  onPress={handleDelete}
                  loading={modalLoading}
                />
              )}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
