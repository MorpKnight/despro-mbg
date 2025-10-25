import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

const TABS = ['Pengguna', 'Sekolah', 'Katering'] as const;

type TabType = typeof TABS[number];

const dummyUsers = [
  { id: 'u1', name: 'Ahmad Rizki', role: 'Super Admin', entity: '-', status: 'Aktif' },
  { id: 'u2', name: 'Siti Nurhaliza', role: 'Admin Sekolah', entity: 'SDN 1', status: 'Aktif' },
  { id: 'u3', name: 'Budi Santoso', role: 'Admin Katering', entity: 'Catering Sehat', status: 'Nonaktif' },
];
const dummySchools = [
  { id: 's1', name: 'SDN 1', address: 'Jl. Merdeka 1', students: 320, status: 'Aktif' },
  { id: 's2', name: 'SMPN 2', address: 'Jl. Sudirman 2', students: 410, status: 'Nonaktif' },
];
const dummyCaterings = [
  { id: 'c1', name: 'Catering Sehat', address: 'Jl. Makan 3', status: 'Aktif' },
  { id: 'c2', name: 'Catering Lezat', address: 'Jl. Lezat 4', status: 'Nonaktif' },
];

export default function UserManagementPage() {
  const [tab, setTab] = React.useState<TabType>('Pengguna');
  const [search, setSearch] = React.useState('');
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editData, setEditData] = React.useState<any>(null);

  // Filtered data
  const users = dummyUsers.filter(u => u.name.toLowerCase().includes(search.toLowerCase()));
  const schools = dummySchools.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
  const caterings = dummyCaterings.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  // Table columns
  const renderTable = () => {
    if (tab === 'Pengguna') {
      return (
        <View>
          <View className="flex-row font-bold mb-2">
            <Text className="flex-2">Nama Lengkap</Text>
            <Text className="flex-1">Peran</Text>
            <Text className="flex-1">Entitas</Text>
            <Text className="flex-1">Status</Text>
            <Text className="flex-row">Aksi</Text>
          </View>
          {users.length === 0 ? (
            <Text className="text-gray-500 py-8 text-center">Tidak ada pengguna ditemukan.</Text>
          ) : (
            users.map(u => (
              <View key={u.id} className="flex-row items-center py-2 border-b border-gray-200">
                <Text className="flex-2">{u.name}</Text>
                <View className={`flex-1 px-2 py-1 rounded-full ${u.role === 'Admin Sekolah' ? 'bg-secondary' : 'bg-primary'}`}><Text className="text-white text-xs">{u.role}</Text></View>
                <Text className="flex-1">{u.entity}</Text>
                <View className={`flex-1 px-2 py-1 rounded-full ${u.status === 'Aktif' ? 'bg-primary' : 'bg-accent-red'}`}><Text className="text-white text-xs">{u.status}</Text></View>
                <View className="flex-row gap-2">
                  <TouchableOpacity onPress={() => { setEditData(u); setModalOpen(true); }}><Ionicons name="pencil" size={18} color="#1976D2" /></TouchableOpacity>
                  <TouchableOpacity onPress={() => { /* show confirm dialog */ }}><Ionicons name="trash" size={18} color="#E53935" /></TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      );
    }
    if (tab === 'Sekolah') {
      return (
        <View>
          <View className="flex-row font-bold mb-2">
            <Text className="flex-2">Nama Sekolah</Text>
            <Text className="flex-2">Alamat</Text>
            <Text className="flex-1">Jumlah Siswa</Text>
            <Text className="flex-1">Status</Text>
            <Text className="flex-row">Aksi</Text>
          </View>
          {schools.length === 0 ? (
            <Text className="text-gray-500 py-8 text-center">Tidak ada sekolah ditemukan.</Text>
          ) : (
            schools.map(s => (
              <View key={s.id} className="flex-row items-center py-2 border-b border-gray-200">
                <Text className="flex-2">{s.name}</Text>
                <Text className="flex-2">{s.address}</Text>
                <Text className="flex-1">{s.students}</Text>
                <View className={`flex-1 px-2 py-1 rounded-full ${s.status === 'Aktif' ? 'bg-primary' : 'bg-accent-red'}`}><Text className="text-white text-xs">{s.status}</Text></View>
                <View className="flex-row gap-2">
                  <TouchableOpacity onPress={() => { setEditData(s); setModalOpen(true); }}><Ionicons name="pencil" size={18} color="#1976D2" /></TouchableOpacity>
                  <TouchableOpacity onPress={() => { /* show confirm dialog */ }}><Ionicons name="trash" size={18} color="#E53935" /></TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      );
    }
    if (tab === 'Katering') {
      return (
        <View>
          <View className="flex-row font-bold mb-2">
            <Text className="flex-2">Nama Katering</Text>
            <Text className="flex-2">Alamat</Text>
            <Text className="flex-1">Status</Text>
            <Text className="flex-row">Aksi</Text>
          </View>
          {caterings.length === 0 ? (
            <Text className="text-gray-500 py-8 text-center">Tidak ada katering ditemukan.</Text>
          ) : (
            caterings.map(c => (
              <View key={c.id} className="flex-row items-center py-2 border-b border-gray-200">
                <Text className="flex-2">{c.name}</Text>
                <Text className="flex-2">{c.address}</Text>
                <View className={`flex-1 px-2 py-1 rounded-full ${c.status === 'Aktif' ? 'bg-primary' : 'bg-accent-red'}`}><Text className="text-white text-xs">{c.status}</Text></View>
                <View className="flex-row gap-2">
                  <TouchableOpacity onPress={() => { setEditData(c); setModalOpen(true); }}><Ionicons name="pencil" size={18} color="#1976D2" /></TouchableOpacity>
                  <TouchableOpacity onPress={() => { /* show confirm dialog */ }}><Ionicons name="trash" size={18} color="#E53935" /></TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      );
    }
    return null;
  };

  // Modal form (simplified)
  const renderModal = () => {
    if (!modalOpen) return null;
    return (
      <View className="absolute top-0 left-0 right-0 bottom-0 bg-black/40 items-center justify-center z-50">
        <View className="bg-white rounded-xl p-6 w-80">
          <Text className="text-lg font-bold mb-4">{editData ? 'Edit Data' : 'Tambah Baru'}</Text>
          <TextInput className="mb-2 border rounded px-3 py-2" placeholder="Nama" value={editData?.name || ''} />
          {/* ...other fields, dropdowns, etc... */}
          <View className="flex-row gap-2 mt-4">
            <Button title="Simpan" className="flex-1 bg-primary" onPress={() => setModalOpen(false)} />
            <Button title="Batal" className="flex-1" onPress={() => setModalOpen(false)} />
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f5f7fb]">
    <ScrollView className="flex-1 bg-neutral-gray">
      <View className="p-6">
        <Text className="text-2xl font-bold mb-6">Manajemen Pengguna & Entitas</Text>
        {/* Tabs */}
        <View className="flex-row gap-2 mb-4">
          {TABS.map(t => (
            <TouchableOpacity key={t} onPress={() => setTab(t)}>
              <View className={`px-4 py-2 rounded-full ${tab === t ? 'bg-primary' : 'bg-gray-200'}`}>
                <Text className={`font-semibold ${tab === t ? 'text-white' : 'text-gray-700'}`}>{t}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        {/* Search & Add */}
        <View className="flex-row items-center mb-4 gap-2">
          <TextInput className="flex-1 border rounded px-3 py-2" placeholder={`Cari ${tab.toLowerCase()}...`} value={search} onChangeText={setSearch} />
          <Button title="+ Tambah Baru" className="bg-primary" onPress={() => { setEditData(null); setModalOpen(true); }} />
        </View>
        {/* Table */}
        <Card>{renderTable()}</Card>
        {/* Modal */}
        {renderModal()}
      </View>
    </ScrollView>
    </SafeAreaView>
  );
}
