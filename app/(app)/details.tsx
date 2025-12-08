import React from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PageHeader from '../../components/ui/PageHeader';

export default function DetailsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-[#f5f7fb]">
      <View className="flex-1 p-6">
        <PageHeader
          title="Details"
          subtitle="Page details"
          showBackButton={false}
        />
        <Text className="text-gray-600">
          This is a placeholder details page.
        </Text>
      </View>
    </SafeAreaView>
  );
}
