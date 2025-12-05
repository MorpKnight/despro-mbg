import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import Dropdown from '../../components/ui/Dropdown';
import { fetchSchools } from '../../services/schools';
import StudentManagementPage from './student-management';
import PageHeader from '../../components/ui/PageHeader';
import LoadingState from '../../components/ui/LoadingState';

export default function AdminStudentManagementPage() {
    const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);

    const { data: schools, isLoading } = useQuery({
        queryKey: ['schools'],
        queryFn: () => fetchSchools({}),
    });

    const schoolOptions = schools?.map(s => ({ label: s.name, value: s.id })) || [];

    return (
        <SafeAreaView className="flex-1 bg-[#f5f7fb]">
            <PageHeader
                title="Kelola Siswa Sekolah"
                subtitle="Pilih sekolah untuk mengelola siswa"
                showBackButton={true}
                className="mx-6 mt-6"
            />

            <View className="px-6 mt-4 mb-4 z-10">
                <Text className="mb-2 text-sm font-medium text-gray-700">Pilih Sekolah</Text>
                <Dropdown
                    placeholder="Pilih Sekolah..."
                    options={schoolOptions}
                    value={selectedSchoolId || ''}
                    onValueChange={setSelectedSchoolId}
                />
            </View>

            {selectedSchoolId ? (
                <View className="flex-1">
                    <StudentManagementPage schoolId={selectedSchoolId} />
                </View>
            ) : (
                <View className="flex-1 items-center justify-center">
                    {isLoading ? <LoadingState /> : (
                        <Text className="text-gray-500">Silakan pilih sekolah terlebih dahulu.</Text>
                    )}
                </View>
            )}
        </SafeAreaView>
    );
}
