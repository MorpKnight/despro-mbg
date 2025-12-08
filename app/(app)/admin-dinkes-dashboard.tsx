import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import Dropdown from '../../components/ui/Dropdown';
import { fetchHealthOfficeAreas } from '../../services/healthAreas';
import DinkesDashboard from './dinkes-dashboard';
import PageHeader from '../../components/ui/PageHeader';
import LoadingState from '../../components/ui/LoadingState';

export default function AdminDinkesDashboardPage() {
    const [selectedHealthAreaId, setSelectedHealthAreaId] = useState<string | null>(null);

    const { data: healthAreas, isLoading: areasLoading } = useQuery({
        queryKey: ['health-areas'],
        queryFn: () => fetchHealthOfficeAreas({}),
    });

    const areaOptions = healthAreas?.map(a => ({ label: a.name, value: a.id })) || [];

    return (
        <SafeAreaView className="flex-1 bg-[#f5f7fb]">
            <PageHeader
                title="Dashboard Dinkes (Admin)"
                subtitle="Pilih wilayah untuk melihat dashboard"
                showBackButton={true}
                className="mx-6 mt-6"
            />

            <View className="px-6 mt-4 mb-4 z-10">
                <Text className="mb-2 text-sm font-medium text-gray-700">Pilih Wilayah Dinkes</Text>
                <Dropdown
                    placeholder="Pilih Wilayah..."
                    options={areaOptions}
                    value={selectedHealthAreaId || ''}
                    onValueChange={setSelectedHealthAreaId}
                />
            </View>

            {selectedHealthAreaId ? (
                <View className="flex-1">
                    <DinkesDashboard healthAreaId={selectedHealthAreaId} />
                </View>
            ) : (
                <View className="flex-1 items-center justify-center">
                    {areasLoading ? <LoadingState /> : (
                        <Text className="text-gray-500">Silakan pilih wilayah terlebih dahulu.</Text>
                    )}
                </View>
            )}
        </SafeAreaView>
    );
}
