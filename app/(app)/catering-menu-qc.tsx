import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MenuQCForm } from '../../components/features/catering';
import PageHeader from '../../components/ui/PageHeader';

export default function CateringMenuQCPage() {
  const { returnTo } = useLocalSearchParams<{ returnTo: string }>();

  return (
    <SafeAreaView className="flex-1 bg-[#f5f7fb]">
      <PageHeader
        title="Input Menu Harian & QC"
        showBackButton={false}
        className="mx-6 mt-6 mb-4"
      />
      <MenuQCForm />
    </SafeAreaView>
  );
}
