import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import Dropdown from '../../components/ui/Dropdown';
import { fetchCaterings } from '../../services/caterings';
import CateringFoodHistoryPage from './food-history-catering';
import PageHeader from '../../components/ui/PageHeader';
import LoadingState from '../../components/ui/LoadingState';

export default function AdminCateringFoodHistoryPage() {
    const [selectedCateringId, setSelectedCateringId] = useState<string | null>(null);

    const { data: caterings, isLoading } = useQuery({
        queryKey: ['caterings'],
        queryFn: () => fetchCaterings({}),
    });

    const cateringOptions = caterings?.map(c => ({ label: c.name, value: c.id })) || [];

    return (
        <SafeAreaView className="flex-1 bg-[#f5f7fb]">
            <PageHeader
                title="History Menu Katering (Admin)"
                subtitle="Pilih katering"
                showBackButton={true}
                className="mx-6 mt-6"
            />

            <View className="px-6 mt-4 mb-4 z-10">
                <Text className="mb-2 text-sm font-medium text-gray-700">Pilih Katering</Text>
                <Dropdown
                    placeholder="Pilih Katering..."
                    options={cateringOptions}
                    value={selectedCateringId || ''}
                    onValueChange={setSelectedCateringId}
                />
            </View>

            {selectedCateringId ? (
                <View className="flex-1">
                    <CateringFoodHistoryPage cateringId={selectedCateringId} />
                </View>
            ) : (
                <View className="flex-1 items-center justify-center">
                    {isLoading ? <LoadingState /> : (
                        <Text className="text-gray-500">Silakan pilih katering terlebih dahulu.</Text>
                    )}
                </View>
            )}
        </SafeAreaView>
    );
}
