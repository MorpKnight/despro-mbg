import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import { useSnackbar } from '../../hooks/useSnackbar';

import { readString } from 'react-native-csv';
import * as DocumentPicker from 'expo-document-picker';

import {
  createStudent,
  bulkCreateStudents,
  deleteStudent,
  fetchSchoolStudents,
  updateStudent,
  type Student,
  type StudentCreate
} from '../../services/schoolUsers';

import { pairNfcTagToStudent, unpairNfcTagFromStudent } from '../../services/users';
import { startScan, stopScan, type NFCSource } from '../../lib/nfc';
import { useElectronNfc } from '../../hooks/useElectronNfc';

interface Props {
  schoolId?: string;
}

type CsvRow = {
  username: string;
  full_name: string;
  password?: string;
};

export default function StudentManagementPage({ schoolId: propSchoolId }: Props) {
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo: string }>();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { showSnackbar } = useSnackbar();

  const [searchQuery, setSearchQuery] = useState('');

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const [fileName, setFileName] = useState<string>('');
  const [parsedRows, setParsedRows] = useState<CsvRow[]>([]);

  // Pairing state
  const [pairing, setPairing] = useState(false);
  const [pairingInfo, setPairingInfo] = useState<{ studentId?: string; nfcTagId?: string } | null>(null);

  // Prevent double start scan
  const pairingScanActiveRef = useRef(false);

  // Electron NFC status/error availability (untuk UI dan guard)
  const { available, status, error } = useElectronNfc({
    enabled: Platform.OS === 'web',
  });

  const readerName = status?.reader ?? null;
  const readerStatus = status?.status ?? null;

  const schoolId = useMemo(() => {
    return propSchoolId || user?.schoolId || undefined;
  }, [propSchoolId, user?.schoolId]);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const { data: students, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['school-students', searchQuery, schoolId],
    queryFn: () => fetchSchoolStudents(searchQuery, schoolId),
    enabled: !!schoolId,
  });

  // ========= CSV =========
  const parseCsv = (csvText: string) => {
    const result = readString(csvText, { header: true, skipEmptyLines: true });
    setParsedRows(result.data as CsvRow[]);
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

      console.log("CSV file loaded:", name);
    } catch (err) {
      console.error(err);
      showSnackbar({ message: 'Gagal membaca file CSV', variant: 'error' });
    }
  };

  const uploadCsv = async () => {
    if (!parsedRows || parsedRows.length === 0) return;

    const formatted: StudentCreate[] = parsedRows
      .filter(row => row.username && row.full_name && row.password)
      .map(row => ({
        username: row.username,
        full_name: row.full_name,
        password: row.password!,
        role: 'siswa',
      }));

    if (formatted.length === 0) {
      showSnackbar({
        message: "Tidak ada baris valid. Pastikan kolom username, full_name, password terisi.",
        variant: "error"
      });
      return;
    }

    bulkCreateMutation.mutate({ students: formatted });
  };

  // ========= Mutations =========
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
        } catch (e) { }
      }

      Alert.alert('Gagal', detailMessage || 'Gagal menambahkan siswa. Pastikan username unik.');
    },
  });

  const bulkCreateMutation = useMutation({
    mutationFn: (data: { students: StudentCreate[] }) => bulkCreateStudents(data, schoolId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-students'] });
      setParsedRows([]);
      closeModal();
      showSnackbar({ message: 'Import siswa berhasil', variant: 'success' });
    },
    onError: (error) => {
      console.error('Bulk create error', error);
      showSnackbar({ message: 'Gagal import siswa', variant: 'error' });
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
        } catch (e) { }
      }

      Alert.alert('Gagal', detailMessage || 'Gagal memperbarui data siswa.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      if (!schoolId) {
        throw new Error('School ID tidak ditemukan. Pastikan Anda sudah login sebagai admin sekolah.');
      }
      return deleteStudent(id, schoolId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-students'] });
      Alert.alert('Berhasil', 'Siswa berhasil dihapus');
    },
    onError: (error: any) => {
      console.error('Delete student error:', error);
      const errorMessage = error?.message || 'Gagal menghapus siswa';
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
        } catch (e) { }
      }

      Alert.alert('Gagal', detailMessage || 'Gagal menghapus siswa.');
    },
  });

  const pairNfcMutation = useMutation({
    mutationFn: (data: { studentId: string; nfcTagId: string }) =>
      pairNfcTagToStudent(data.studentId, data.nfcTagId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-students'] });
      setPairing(false);
      setPairingInfo(null);
      pairingScanActiveRef.current = false;
      showSnackbar({ message: 'NFC tag berhasil dipasangkan ke siswa', variant: 'success' });
    },
    onError: (error: any) => {
      console.error('Pair NFC error:', error);
      showSnackbar({ message: error?.message || 'Gagal memasangkan NFC tag', variant: 'error' });
    },
  });

  const unpairNfcMutation = useMutation({
    mutationFn: (studentId: string) => unpairNfcTagFromStudent(studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-students'] });
      showSnackbar({ message: 'NFC tag berhasil dilepas dari siswa', variant: 'success' });
    },
    onError: (error: any) => {
      console.error('Unpair NFC error:', error);
      showSnackbar({ message: error?.message || 'Gagal melepas NFC tag', variant: 'error' });
    },
  });

  // ========= Helpers =========
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
    setPassword('');
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
      if (password && password.length > 0 && password.length < 8) {
        Alert.alert('Error', 'Password minimal 8 karakter');
        return;
      }
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
        role: 'siswa'
      };

      createMutation.mutate(payload);
    }
  };

  const handleDelete = (id: string) => {
    if (!schoolId) {
      Alert.alert('Error', 'School ID tidak ditemukan. Pastikan Anda sudah login sebagai admin sekolah.');
      return;
    }

    if (Platform.OS === 'web') {
      if (window.confirm('Yakin ingin menghapus siswa ini?')) {
        deleteMutation.mutate(id);
      }
    } else {
      Alert.alert('Konfirmasi', 'Yakin ingin menghapus siswa ini?', [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(id)
        },
      ]);
    }
  };

  // ========= Pairing NFC =========
  // Cleanup scan ketika pairing modal ditutup
  useEffect(() => {
    if (!pairing) {
      pairingScanActiveRef.current = false;
      stopScan().catch(() => { });
    }
  }, [pairing]);

  // Cleanup ketika unmount page
  useEffect(() => {
    return () => {
      pairingScanActiveRef.current = false;
      stopScan().catch(() => { });
    };
  }, []);

  // Surface error reader ke UI
  useEffect(() => {
    if (!error) return;
    showSnackbar({
      message: error.message || 'Terjadi error pada NFC reader.',
      variant: 'error',
    });
  }, [error]);

  const handleStartPair = async (studentId: string) => {
    if (pairingScanActiveRef.current) return;

    const source: NFCSource = Platform.OS === 'web' ? 'reader' : 'device';

    // Guard: web reader harus lewat Electron
    if (Platform.OS === 'web' && !available) {
      showSnackbar({
        message: 'Mode reader hanya bisa digunakan saat aplikasi dijalankan lewat Electron.',
        variant: 'error',
      });
      return;
    }

    setPairing(true);
    setPairingInfo({ studentId });
    pairingScanActiveRef.current = true;

    try {
      await startScan(source, (uid: string) => {
        console.log('NFC tag scanned:', uid);

        setPairingInfo({ studentId, nfcTagId: uid });

        // stop scan setelah dapat 1 tag
        stopScan().catch(() => { });
        pairingScanActiveRef.current = false;
      });
    } catch (err) {
      console.error('Scan error:', err);
      showSnackbar({ message: 'Gagal memindai NFC tag', variant: 'error' });
      pairingScanActiveRef.current = false;
      setPairing(false);
      setPairingInfo(null);
    }
  };

  const handleConfirmPair = (studentId: string, nfcTagId: string) => {
    pairNfcMutation.mutate({ studentId, nfcTagId });
  };

  const handleUnpair = (studentId: string) => {
    Alert.alert('Konfirmasi', 'Yakin ingin melepas NFC tag dari siswa ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Lepas',
        style: 'destructive',
        onPress: () => unpairNfcMutation.mutate(studentId)
      },
    ]);
  };

  // ========= Render =========
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
                    <Text className="text-lg font-bold text-gray-900">
                      {student.full_name}
                    </Text>
                    <Text className="text-gray-500 text-sm">
                      @{student.username}
                    </Text>
                    <Text className="text-xs text-gray-400 mt-1">
                      Status: {student.account_status}
                    </Text>
                    {student.nfc_tag_id && (
                      <Text className="text-xs text-gray-500 mt-1">
                        NFC: {student.nfc_tag_id}
                      </Text>
                    )}
                  </View>

                  <View className="flex-row gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onPress={() => handleOpenEdit(student)}
                      title="Edit"
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      onPress={() =>
                        student.nfc_tag_id
                          ? handleUnpair(student.id)
                          : handleStartPair(student.id)
                      }
                      title={student.nfc_tag_id ? "NFC ✓" : "NFC"}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onPress={() => handleDelete(student.id)}
                      title="Hapus"
                    />
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>

      {/* ===== Modal create/edit ===== */}
      <Modal visible={isModalVisible} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="bg-white p-6 rounded-2xl w-full max-w-md">
            <Text className="text-xl font-bold mb-4">
              {editingStudent ? 'Edit Siswa' : 'Tambah Siswa Baru'}
            </Text>

            <View className="gap-4">
              <View>
                <Text className="mb-1 text-gray-700 font-medium">Nama Lengkap</Text>
                <TextInput
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Contoh: Budi Santoso"
                />
              </View>

              <View>
                <Text className="mb-1 text-gray-700 font-medium">Username</Text>
                <TextInput
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Username unik"
                  autoCapitalize="none"
                />
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

              {!editingStudent && (
                <View className="mt-6 border-t pt-4">
                  <Text className="text-gray-600 text-center mb-2">
                    atau impor banyak siswa dari CSV
                  </Text>

                  <Button
                    variant="secondary"
                    title={
                      parsedRows.length > 0
                        ? `Upload CSV (${fileName})`
                        : "Pilih File CSV"
                    }
                    onPress={() => {
                      if (parsedRows.length > 0) {
                        uploadCsv();
                      } else {
                        pickCsvFile();
                      }
                    }}
                    disabled={bulkCreateMutation.isPending}
                  />

                  {fileName.length > 0 && parsedRows.length > 0 && (
                    <Text className="text-center text-gray-600 mt-2">
                      File dipilih: {fileName}
                    </Text>
                  )}
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* ===== Modal pairing NFC ===== */}
      <Modal visible={pairing && !!pairingInfo} animationType="fade" transparent>
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="bg-white p-6 rounded-2xl w-full max-w-md">
            <Text className="text-xl font-bold mb-4">Pasangkan NFC Tag</Text>

            {!pairingInfo?.nfcTagId ? (
              <View>
                <Text className="text-gray-600 mb-2">Menunggu NFC tag...</Text>

                {/* Info status reader untuk web/Electron */}
                {Platform.OS === 'web' && (
                  <Text className="text-xs text-gray-500 mb-4">
                    {!available
                      ? 'Reader mode membutuhkan Electron.'
                      : readerStatus
                        ? `Reader ${readerStatus === 'connected' ? 'terhubung' : 'terputus'}${readerName ? `: ${readerName}` : ''}`
                        : 'Menunggu status reader...'}
                  </Text>
                )}

                <Button
                  variant="ghost"
                  onPress={() => {
                    stopScan().catch(() => { });
                    pairingScanActiveRef.current = false;
                    setPairing(false);
                    setPairingInfo(null);
                  }}
                  title="Batal"
                />
              </View>
            ) : (
              <View>
                <Text className="text-gray-700 mb-2">Tag ID:</Text>
                <Text className="text-lg font-mono bg-gray-100 p-3 rounded mb-4">
                  {pairingInfo.nfcTagId}
                </Text>

                <View className="flex-row justify-end gap-3">
                  <Button
                    variant="ghost"
                    onPress={() => {
                      stopScan().catch(() => { });
                      pairingScanActiveRef.current = false;
                      setPairing(false);
                      setPairingInfo(null);
                    }}
                    title="Batal"
                  />
                  <Button
                    onPress={() => handleConfirmPair(pairingInfo.studentId!, pairingInfo.nfcTagId!)}
                    disabled={pairNfcMutation.isPending}
                    title={pairNfcMutation.isPending ? 'Menyimpan...' : 'Pasangkan'}
                  />
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}