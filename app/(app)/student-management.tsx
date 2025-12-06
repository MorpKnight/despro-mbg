import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Modal, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import TextInput from '../../components/ui/TextInput';
import LoadingState from '../../components/ui/LoadingState';
import PageHeader from '../../components/ui/PageHeader';
import SearchInput from '../../components/ui/SearchInput';
import {
    createStudent,
    deleteStudent,
    fetchSchoolStudents,
    updateStudent,
    type Student,
    type StudentCreate
} from '../../services/schoolUsers';

interface Props {
    schoolId?: string; // Optional: If provided, manages students for this school (Super Admin mode)
}

export default function StudentManagementPage({ schoolId }: Props) {
    const router = useRouter();
    const { returnTo } = useLocalSearchParams<{ returnTo: string }>();
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);

    // Form State
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');

    const { data: students, isLoading, isRefetching, refetch } = useQuery({
        queryKey: ['school-students', searchQuery, schoolId],
        queryFn: () => fetchSchoolStudents(searchQuery, schoolId),
    });

    const createMutation = useMutation({
        mutationFn: (data: StudentCreate) => createStudent(data, schoolId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['school-students'] });
            closeModal();
            Alert.alert('Berhasil', 'Siswa berhasil ditambahkan');
        },
        onError: (error) => {
            Alert.alert('Gagal', 'Gagal menambahkan siswa. Pastikan username unik.');
        },
    });

    const updateMutation = useMutation({
        mutationFn: (data: { id: string; payload: any }) => updateStudent(data.id, data.payload, schoolId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['school-students'] });
            closeModal();
            Alert.alert('Berhasil', 'Data siswa berhasil diperbarui');
        },
        onError: () => {
            Alert.alert('Gagal', 'Gagal memperbarui data siswa.');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteStudent(id, schoolId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['school-students'] });
            Alert.alert('Berhasil', 'Siswa berhasil dihapus');
        },
        onError: () => {
            Alert.alert('Gagal', 'Gagal menghapus siswa.');
        },
    });

    const handleOpenCreate = () => {
        setEditingStudent(null);
        setUsername('');
        setPassword('');
        setFullName('');
        setIsModalVisible(true);
    };

    const handleOpenEdit = (student: Student) => {
        setEditingStudent(student);
        setUsername(student.username);
        setPassword(''); // Leave empty to keep unchanged
        setFullName(student.full_name);
        setIsModalVisible(true);
    };

    const closeModal = () => {
        setIsModalVisible(false);
    };

    const handleSubmit = () => {
        if (!username || !fullName) {
            Alert.alert('Error', 'Username dan Nama Lengkap wajib diisi');
            return;
        }

        if (editingStudent) {
            const payload: any = { username, full_name: fullName };
            if (password) payload.password = password;
            updateMutation.mutate({ id: editingStudent.id, payload });
        } else {
            if (!password) {
                Alert.alert('Error', 'Password wajib diisi untuk siswa baru');
                return;
            }
            const payload: StudentCreate = { username, password, full_name: fullName };
            createMutation.mutate(payload);
        }
    };

    const handleDelete = (id: string) => {
        Alert.alert('Konfirmasi', 'Yakin ingin menghapus siswa ini?', [
            { text: 'Batal', style: 'cancel' },
            { text: 'Hapus', style: 'destructive', onPress: () => deleteMutation.mutate(id) },
        ]);
    };

    return (
        <SafeAreaView className="flex-1 bg-[#f5f7fb]">
            <PageHeader
                title="Kelola Siswa"
                subtitle="Daftar siswa di sekolah Anda"
                showBackButton={true}
                backPath={returnTo}
                className="mx-6 mt-6"
                onRefresh={refetch}
                isRefreshing={isRefetching}
                rightAction={
                    <Button size="sm" onPress={handleOpenCreate} title="+ Tambah" />
                }
            />

            <View className="px-6 mb-4 mt-4">
                <SearchInput
                    placeholder="Cari siswa..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            <ScrollView className="flex-1 px-6">
                {isLoading ? (
                    <LoadingState />
                ) : !students || students.length === 0 ? (
                    <EmptyState
                        title="Belum ada siswa"
                        description="Silakan tambahkan siswa baru."
                    />
                ) : (
                    <View className="space-y-3 pb-8">
                        {students.map((student) => (
                            <Card key={student.id} className="p-4">
                                <View className="flex-row justify-between items-start">
                                    <View>
                                        <Text className="text-lg font-bold text-gray-900">{student.full_name}</Text>
                                        <Text className="text-gray-500 text-sm">@{student.username}</Text>
                                        <Text className="text-xs text-gray-400 mt-1">Status: {student.account_status}</Text>
                                    </View>
                                    <View className="flex-row gap-2">
                                        <Button variant="outline" size="sm" onPress={() => handleOpenEdit(student)} title="Edit">
                                            {/* Note: Button with title will render text. If we want icon only, we might strictly need children but Button.tsx seems to enforce title. 
                           However, `Button.tsx` renders `icon` prop if provided. 
                           I will pass title="" and use icon if I can, or just use title "Edit" for clarity. 
                           Actually, the previous code had children <Ionicons>. 
                           Let's check Button.tsx again. It renders `{icon}` then `{title}`. 
                           So passing title="Edit" is fine. width might be an issue. 
                           Let's use title="Edit" and title="Hapus". */}
                                        </Button>
                                        <Button variant="ghost" size="sm" onPress={() => handleDelete(student.id)} title="Hapus">
                                        </Button>
                                    </View>
                                </View>
                            </Card>
                        ))}
                    </View>
                )}
            </ScrollView>

            <Modal visible={isModalVisible} animationType="slide" transparent>
                <View className="flex-1 bg-black/50 justify-center items-center px-6">
                    <View className="bg-white p-6 rounded-2xl w-full max-w-md">
                        <Text className="text-xl font-bold mb-4">
                            {editingStudent ? 'Edit Siswa' : 'Tambah Siswa Baru'}
                        </Text>

                        <View className="gap-4">
                            <View>
                                <Text className="mb-1 text-gray-700 font-medium">Nama Lengkap</Text>
                                <TextInput value={fullName} onChangeText={setFullName} placeholder="Contoh: Budi Santoso" />
                            </View>

                            <View>
                                <Text className="mb-1 text-gray-700 font-medium">Username</Text>
                                <TextInput value={username} onChangeText={setUsername} placeholder="Username unik" autoCapitalize="none" />
                            </View>

                            <View>
                                <Text className="mb-1 text-gray-700 font-medium">Password</Text>
                                <TextInput
                                    value={password}
                                    onChangeText={setPassword}
                                    placeholder={editingStudent ? "(Biarkan kosong jika tidak diubah)" : "Password siswa"}
                                    secureTextEntry
                                />
                            </View>

                            <View className="flex-row justify-end gap-3 mt-4">
                                <Button variant="ghost" onPress={closeModal} title="Batal" />
                                <Button
                                    onPress={handleSubmit}
                                    disabled={createMutation.isPending || updateMutation.isPending}
                                    title={createMutation.isPending || updateMutation.isPending ? 'Menyimpan...' : 'Simpan'}
                                />
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
