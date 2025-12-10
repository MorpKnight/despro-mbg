import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, Modal, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import TextInput from '../../components/ui/TextInput';
import LoadingState from '../../components/ui/LoadingState';
import PageHeader from '../../components/ui/PageHeader';
import SearchInput from '../../components/ui/SearchInput';
import { useAuth } from '../../hooks/useAuth';
import { readString } from 'react-native-csv';
import * as DocumentPicker from 'expo-document-picker';
import {
    createStudent,
    bulkCreateStudentsSimple,
    deleteStudent,
    fetchSchoolStudents,
    updateStudent,
    type Student,
    type StudentCreate,
    type BulkCreateResult
} from '../../services/schoolUsers';

interface Props {
    schoolId?: string; // Optional: If provided, manages students for this school (Super Admin mode)
}

// CSV row type for simplified bulk import (only full_name)
type SimpleCsvRow = {
    full_name: string;
};

export default function StudentManagementPage({ schoolId: propSchoolId }: Props) {
    const router = useRouter();
    const { returnTo } = useLocalSearchParams<{ returnTo: string }>();
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [fileName, setFileName] = useState<string>('');
    const [parsedNames, setParsedNames] = useState<string[]>([]);
    const [bulkResults, setBulkResults] = useState<BulkCreateResult[]>([]);

    // Use schoolId from prop if provided (Super Admin mode), otherwise use schoolId from logged-in user
    const schoolId = useMemo(() => {
        return propSchoolId || user?.schoolId || undefined;
    }, [propSchoolId, user?.schoolId]);

    // Form State
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');

    const { data: students, isLoading, isRefetching, refetch } = useQuery({
        queryKey: ['school-students', searchQuery, schoolId],
        queryFn: () => fetchSchoolStudents(searchQuery, schoolId),
        enabled: !!schoolId, // Only fetch if schoolId is available
    });

    // Parse CSV - now only expects full_name column
    const parseCsv = (csvText: string) => {
        const result = readString(csvText, { header: true, skipEmptyLines: true });
        const names = (result.data as SimpleCsvRow[])
            .map(row => row.full_name?.trim())
            .filter(name => name && name.length > 0);
        setParsedNames(names);
    };

    // Download template CSV
    const downloadTemplate = () => {
        const csvContent = 'full_name\nBudi Santoso\nSiti Rahayu\nAndi Wijaya';
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'template_siswa.csv';
        link.click();
    };

    // Download result CSV with credentials
    const downloadResultCsv = (results: BulkCreateResult[]) => {
        const successResults = results.filter(r => r.success);
        if (successResults.length === 0) return;

        const csvHeader = 'full_name,username,password';
        const csvRows = successResults.map(r =>
            `"${r.full_name}","${r.username}","${r.password}"`
        );
        const csvContent = [csvHeader, ...csvRows].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'kredensial_siswa.csv';
        link.click();
    };

    const pickCsvFile = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({ type: "text/csv" });

            if (result.canceled) return;

            const fileUri = result.assets[0].uri;
            const name = result.assets[0].name;

            const response = await fetch(fileUri);
            const fileContent = await response.text();

            parseCsv(fileContent);
            setFileName(name);

            console.log("CSV file parsed:", parsedNames);

        } catch (err) {
            console.error(err);
        }
    };

    const uploadCsv = async () => {
        if (!parsedNames || parsedNames.length === 0) { return; }
        bulkSimpleMutation.mutate({ students: parsedNames });
    };

    const createMutation = useMutation({
        mutationFn: (data: StudentCreate) => createStudent(data, schoolId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['school-students'] });
            closeModal();
            Alert.alert('Berhasil', 'Siswa berhasil ditambahkan');
        },
        onError: (error: any) => {
            console.error('Create student error:', error);
            const errorMessage = error?.message || 'Gagal menambahkan siswa';
            // Try to extract detailed error from response
            let detailMessage = errorMessage;
            if (errorMessage.includes('422')) {
                try {
                    const errorText = errorMessage.split('422:')[1]?.trim();
                    if (errorText) {
                        const errorJson = JSON.parse(errorText);
                        if (errorJson.detail) {
                            if (Array.isArray(errorJson.detail)) {
                                detailMessage = errorJson.detail.map((e: any) =>
                                    `${e.loc?.join('.')}: ${e.msg}`
                                ).join('\n');
                            } else {
                                detailMessage = errorJson.detail;
                            }
                        }
                    }
                } catch (e) {
                    // If parsing fails, use original message
                }
            }
            Alert.alert('Gagal', detailMessage || 'Gagal menambahkan siswa. Pastikan username unik.');
        },
    });

    // Simplified bulk create mutation
    const bulkSimpleMutation = useMutation({
        mutationFn: (data: { students: string[] }) => bulkCreateStudentsSimple(data, schoolId),
        onSuccess: (results) => {
            queryClient.invalidateQueries({ queryKey: ['school-students'] });
            setBulkResults(results);
            setParsedNames([]);
            setFileName('');

            const successCount = results.filter(r => r.success).length;
            const failCount = results.filter(r => !r.success).length;

            // Auto download result CSV
            if (successCount > 0) {
                downloadResultCsv(results);
            }

            closeModal();
            Alert.alert(
                'Berhasil',
                `${successCount} siswa berhasil ditambahkan${failCount > 0 ? `, ${failCount} gagal` : ''}. File kredensial telah diunduh.`
            );
        },
        onError: (error) => {
            console.error('Bulk simple create error', error);
            Alert.alert('Gagal', 'Gagal menambahkan siswa. Silakan coba lagi.');
        },
    });

    const updateMutation = useMutation({
        mutationFn: (data: { id: string; payload: any }) => updateStudent(data.id, data.payload, schoolId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['school-students'] });
            closeModal();
            Alert.alert('Berhasil', 'Data siswa berhasil diperbarui');
        },
        onError: (error: any) => {
            console.error('Update student error:', error);
            const errorMessage = error?.message || 'Gagal memperbarui data siswa';
            // Try to extract detailed error from response
            let detailMessage = errorMessage;
            if (errorMessage.includes('422') || errorMessage.includes('403') || errorMessage.includes('404')) {
                try {
                    const errorText = errorMessage.split(/422:|403:|404:/)[1]?.trim();
                    if (errorText) {
                        const errorJson = JSON.parse(errorText);
                        if (errorJson.detail) {
                            detailMessage = errorJson.detail;
                        }
                    }
                } catch (e) {
                    // If parsing fails, use original message
                }
            }
            Alert.alert('Gagal', detailMessage || 'Gagal memperbarui data siswa.');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => {
            if (!schoolId) {
                throw new Error('School ID tidak ditemukan. Pastikan Anda sudah login sebagai admin sekolah.');
            }
            console.log('Deleting student:', id);
            console.log('School ID:', schoolId);
            return deleteStudent(id, schoolId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['school-students'] });
            Alert.alert('Berhasil', 'Siswa berhasil dihapus');
        },
        onError: (error: any) => {
            console.error('Delete student error:', error);
            const errorMessage = error?.message || 'Gagal menghapus siswa';
            // Try to extract detailed error from response
            let detailMessage = errorMessage;
            if (errorMessage.includes('422') || errorMessage.includes('403') || errorMessage.includes('404')) {
                try {
                    const errorText = errorMessage.split(/422:|403:|404:/)[1]?.trim();
                    if (errorText) {
                        const errorJson = JSON.parse(errorText);
                        if (errorJson.detail) {
                            detailMessage = errorJson.detail;
                        }
                    }
                } catch (e) {
                    // If parsing fails, use original message
                }
            }
            Alert.alert('Gagal', detailMessage || 'Gagal menghapus siswa.');
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
        if (!schoolId) {
            Alert.alert('Error', 'School ID tidak ditemukan. Pastikan Anda sudah login sebagai admin sekolah.');
            return;
        }

        if (!username || !fullName) {
            Alert.alert('Error', 'Username dan Nama Lengkap wajib diisi');
            return;
        }

        if (editingStudent) {
            // Validate password length if provided
            if (password && password.length > 0 && password.length < 8) {
                Alert.alert('Error', 'Password minimal 8 karakter');
                return;
            }
            // Validate username length
            if (username.length < 3) {
                Alert.alert('Error', 'Username minimal 3 karakter');
                return;
            }
            const payload: any = {
                username: username.trim(),
                full_name: fullName.trim()
            };
            if (password && password.length > 0) {
                payload.password = password;
            }
            console.log('Updating student with payload:', { ...payload, password: payload.password ? '***' : undefined });
            console.log('Student ID:', editingStudent.id);
            console.log('School ID:', schoolId);
            updateMutation.mutate({ id: editingStudent.id, payload });
        } else {
            if (!password) {
                Alert.alert('Error', 'Password wajib diisi untuk siswa baru');
                return;
            }
            if (password.length < 8) {
                Alert.alert('Error', 'Password minimal 8 karakter');
                return;
            }
            if (username.length < 3) {
                Alert.alert('Error', 'Username minimal 3 karakter');
                return;
            }
            const payload: StudentCreate = {
                username: username.trim(),
                password,
                full_name: fullName.trim(),
                role: 'siswa' // Required by backend schema
            };
            console.log('Creating student with payload:', { ...payload, password: '***' });
            console.log('School ID:', schoolId);
            createMutation.mutate(payload);
        }
    };

    const handleDelete = (id: string) => {
        console.log('handleDelete called with id:', id);
        console.log('schoolId:', schoolId);

        if (!schoolId) {
            Alert.alert('Error', 'School ID tidak ditemukan. Pastikan Anda sudah login sebagai admin sekolah.');
            return;
        }

        if (Platform.OS === 'web') {
            if (window.confirm('Yakin ingin menghapus siswa ini?')) {
                console.log('User confirmed delete, calling deleteMutation.mutate');
                deleteMutation.mutate(id);
            } else {
                console.log('User cancelled delete');
            }
        } else {
            Alert.alert('Konfirmasi', 'Yakin ingin menghapus siswa ini?', [
                { text: 'Batal', style: 'cancel', onPress: () => console.log('User cancelled delete') },
                {
                    text: 'Hapus',
                    style: 'destructive',
                    onPress: () => {
                        console.log('User confirmed delete, calling deleteMutation.mutate');
                        deleteMutation.mutate(id);
                    }
                },
            ]);
        }
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
                            {/* Form single-create tetap tampil */}
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

                            {/* Tombol simpan form single-create */}
                            <View className="flex-row justify-end gap-3 mt-4">
                                <Button variant="ghost" onPress={closeModal} title="Batal" />
                                <Button
                                    onPress={handleSubmit}
                                    disabled={createMutation.isPending || updateMutation.isPending}
                                    title={createMutation.isPending || updateMutation.isPending ? 'Menyimpan...' : 'Simpan'}
                                />
                            </View>

                            {/* Bulk import CSV hanya untuk create (bukan edit) */}
                            {!editingStudent && (
                                <View className="mt-6 border-t pt-4">
                                    <Text className="text-gray-600 text-center mb-3">
                                        atau impor banyak siswa dari CSV
                                    </Text>

                                    {/* Step 1: Download Template */}
                                    <Button
                                        variant="outline"
                                        title="📥 Download Template CSV"
                                        onPress={downloadTemplate}
                                        className="mb-2"
                                    />

                                    {/* Step 2: Pick & Upload CSV */}
                                    <Button
                                        variant="secondary"
                                        title={
                                            parsedNames.length > 0
                                                ? `📤 Upload ${parsedNames.length} Siswa`
                                                : "📂 Pilih File CSV"
                                        }
                                        onPress={() => {
                                            if (parsedNames.length > 0) {
                                                uploadCsv();
                                            } else {
                                                pickCsvFile();
                                            }
                                        }}
                                        disabled={bulkSimpleMutation.isPending}
                                    />

                                    {/* Show selected file info */}
                                    {fileName.length > 0 && parsedNames.length > 0 && (
                                        <View className="mt-2">
                                            <Text className="text-center text-gray-600">
                                                File: {fileName} ({parsedNames.length} nama)
                                            </Text>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                title="Ganti file"
                                                onPress={() => {
                                                    setFileName('');
                                                    setParsedNames([]);
                                                    pickCsvFile();
                                                }}
                                                className="mt-1"
                                            />
                                        </View>
                                    )}

                                    {bulkSimpleMutation.isPending && (
                                        <Text className="text-center text-blue-600 mt-2">
                                            Memproses... Username & password sedang di-generate
                                        </Text>
                                    )}
                                </View>
                            )}
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
