import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Grid from '../../components/layout/Grid';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Dropdown, { DropdownOption } from '../../components/ui/Dropdown';
import { useResponsive } from '../../hooks/useResponsive';
import { fetchCaterings, type CateringListItem } from '../../services/caterings';
import { fetchSchools, type SchoolListItem } from '../../services/schools';
import {
  createUser,
  deleteUser,
  fetchUsers,
  updateUser,
  type CreateUserPayload,
  type UpdateUserPayload,
  type User,
  type UserRole
} from '../../services/users';

type RoleFilter = 'all' | UserRole;

const roleOptions: DropdownOption[] = [
  { label: 'Super Admin', value: 'super_admin' },
  { label: 'Admin Sekolah', value: 'admin_sekolah' },
  { label: 'Admin Catering', value: 'admin_catering' },
  { label: 'Admin Dinkes', value: 'admin_dinkes' },
  { label: 'Siswa', value: 'siswa' },
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
  const [activeTab, setActiveTab] = useState<RoleFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Data State
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Dropdown Data
  const [schools, setSchools] = useState<SchoolListItem[]>([]);
  const [caterings, setCaterings] = useState<CateringListItem[]>([]);

  // Modal State
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Partial<User> & { password?: string } | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [usersData, schoolsData, cateringsData] = await Promise.all([
        fetchUsers(),
        fetchSchools(),
        fetchCaterings()
      ]);
      setUsers(usersData);
      setSchools(schoolsData);
      setCaterings(cateringsData);
    } catch (error) {
      Alert.alert('Error', 'Gagal memuat data pengguna');
      console.error(error);
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
    let filtered = users;

    // Filter by role tab
    if (activeTab !== 'all') {
      filtered = filtered.filter(user => user.role === activeTab);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user =>
        (user.fullName?.toLowerCase() || '').includes(query) ||
        user.username.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [activeTab, searchQuery, users]);

  const handleEdit = (user: User) => {
    setSelectedUser({ ...user });
    setIsModalVisible(true);
  };

  const handleCreate = () => {
    setSelectedUser({ role: 'siswa' }); // Default role
    setIsModalVisible(true);
  };

  const handleSave = async () => {
    if (!selectedUser) return;
    if (!selectedUser.username || !selectedUser.role) {
      Alert.alert('Error', 'Username dan Role wajib diisi');
      return;
    }

    try {
      setModalLoading(true);

      if (selectedUser.id) {
        // Update
        const payload: UpdateUserPayload = {
          username: selectedUser.username,
          full_name: selectedUser.fullName || undefined,
          role: selectedUser.role,
          school_id: selectedUser.schoolId,
          catering_id: selectedUser.cateringId,
          health_office_area: selectedUser.healthOfficeArea,
        };
        if (selectedUser.password) {
          payload.password = selectedUser.password;
        }

        await updateUser(selectedUser.id, payload);
        Alert.alert('Sukses', 'Pengguna berhasil diperbarui');
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
          role: selectedUser.role,
          school_id: selectedUser.schoolId || undefined,
          catering_id: selectedUser.cateringId || undefined,
          health_office_area: selectedUser.healthOfficeArea || undefined,
        };

        await createUser(payload);
        Alert.alert('Sukses', 'Pengguna berhasil dibuat');
      }

      setIsModalVisible(false);
      setSelectedUser(null);
      handleRefresh(); // Auto-refresh
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Gagal menyimpan data');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser?.id) return;

    Alert.alert(
      'Konfirmasi Hapus',
      `Apakah Anda yakin ingin menghapus pengguna ${selectedUser.username}?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              setModalLoading(true);
              await deleteUser(selectedUser.id!);
              Alert.alert('Sukses', 'Pengguna berhasil dihapus');
              setIsModalVisible(false);
              setSelectedUser(null);
              handleRefresh();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Gagal menghapus pengguna');
            } finally {
              setModalLoading(false);
            }
          }
        }
      ]
    );
  };

  const schoolOptions = useMemo(() => schools.map(s => ({ label: s.name, value: s.id })), [schools]);
  const cateringOptions = useMemo(() => caterings.map(c => ({ label: c.name, value: c.id })), [caterings]);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        <View className={`${isDesktop ? 'px-12 py-8' : 'px-6 py-6'}`}>
          {/* Header */}
          <View className="mb-8 flex-row justify-between items-start">
            <View>
              <Text className={`${isDesktop ? 'text-4xl' : 'text-3xl'} font-bold text-gray-900 mb-2`}>
                Manajemen Pengguna
              </Text>
              <Text className="text-base text-gray-600">
                Kelola akun, peran, dan akses sistem
              </Text>
            </View>
            <Button
              title="Refresh"
              variant="ghost"
              icon={<Ionicons name="refresh" size={20} color="#4B5563" />}
              onPress={handleRefresh}
              loading={refreshing}
            />
          </View>

          {/* Role Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-6"
            contentContainerStyle={{ paddingRight: 16 }}
          >
            <View className="flex-row gap-3">
              {roleTabs.map((tab) => (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => setActiveTab(tab.key)}
                  className={`px-6 py-3 rounded-xl ${activeTab === tab.key
                    ? 'bg-blue-600 shadow-lg'
                    : 'bg-white border-2 border-gray-200'
                    }`}
                  activeOpacity={0.7}
                >
                  <Text
                    className={`font-bold text-sm ${activeTab === tab.key ? 'text-white' : 'text-gray-700'
                      }`}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Search & Add */}
          <View className={`flex-row gap-4 mb-6 ${isDesktop ? 'items-center' : 'flex-wrap'}`}>
            <View className={`${isDesktop ? 'flex-1 max-w-md' : 'flex-1'} flex-row items-center bg-white border-2 border-gray-200 rounded-xl px-4 h-14 shadow-sm`}>
              <Ionicons name="search" size={22} color="#9CA3AF" />
              <TextInput
                className="flex-1 ml-3 text-base text-gray-900"
                placeholder="Cari pengguna..."
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <Button
              title="Tambah Pengguna"
              icon={<Ionicons name="person-add" size={18} color="white" />}
              onPress={handleCreate}
            />
          </View>

          {/* User List */}
          {loading && !refreshing ? (
            <View className="py-12 items-center">
              <ActivityIndicator size="large" color="#2563EB" />
              <Text className="text-gray-500 mt-4">Memuat data pengguna...</Text>
            </View>
          ) : filteredUsers.length === 0 ? (
            <Card variant="outlined" className="items-center py-12">
              <Ionicons name="people-outline" size={64} color="#D1D5DB" />
              <Text className="text-gray-500 mt-4 text-base font-medium">
                Tidak ada pengguna ditemukan
              </Text>
              <Text className="text-gray-400 mt-1 text-sm">
                Coba ubah filter atau kata kunci pencarian
              </Text>
            </Card>
          ) : (
            <Grid mobileColumns={1} tabletColumns={2} desktopColumns={2} gap={4}>
              {filteredUsers.map((user) => (
                <Card
                  key={user.id}
                  variant="elevated"
                  className="overflow-hidden"
                >
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1 pr-3">
                      <Text className="text-xl font-bold text-gray-900 mb-1">
                        {user.fullName || user.username}
                      </Text>
                      <View className="flex-row items-center mb-3">
                        <Ionicons name="at" size={14} color="#6B7280" />
                        <Text className="text-gray-600 ml-1">{user.username}</Text>
                      </View>

                      <View className="flex-row items-center flex-wrap gap-2 mb-2">
                        <View className="bg-blue-100 px-3 py-1.5 rounded-lg">
                          <Text className="text-sm text-blue-700 font-semibold">
                            {getRoleLabel(user.role)}
                          </Text>
                        </View>
                        <View className={`px-3 py-1.5 rounded-lg ${user.accountStatus === 'active' ? 'bg-green-100' : 'bg-gray-100'
                          }`}>
                          <Text className={`text-sm font-semibold ${user.accountStatus === 'active' ? 'text-green-700' : 'text-gray-700'
                            }`}>
                            {user.accountStatus}
                          </Text>
                        </View>
                      </View>

                      {(user.sekolah || user.catering || user.healthOfficeArea) && (
                        <View className="flex-row items-center mt-2">
                          <Ionicons
                            name={user.sekolah ? 'school' : user.catering ? 'restaurant' : 'location'}
                            size={14}
                            color="#9CA3AF"
                          />
                          <Text className="text-sm text-gray-500 ml-1">
                            {user.sekolah?.name ?? user.catering?.name ?? user.healthOfficeArea}
                          </Text>
                        </View>
                      )}
                    </View>

                    <TouchableOpacity
                      onPress={() => handleEdit(user)}
                      className="p-3 bg-blue-50 rounded-xl active:bg-blue-100"
                      activeOpacity={0.7}
                    >
                      <Ionicons name="create-outline" size={22} color="#1976D2" />
                    </TouchableOpacity>
                  </View>
                </Card>
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
                  <View>
                    <Text className="text-sm font-semibold text-gray-700 mb-2">
                      Wilayah
                    </Text>
                    <TextInput
                      className="border-2 border-gray-200 rounded-xl p-4 text-base bg-white"
                      value={selectedUser?.healthOfficeArea || ''}
                      onChangeText={(t) => setSelectedUser(prev => ({ ...prev!, healthOfficeArea: t }))}
                      placeholder="Wilayah Kerja"
                      placeholderTextColor="#9CA3AF"
                    />
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
