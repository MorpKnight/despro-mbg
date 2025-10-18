import { useRouter } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';
import Button from '../../components/ui/Button';

export default function DetailsScreen() {
  const router = useRouter();
  return (
    <View className="flex-1 bg-neutral-gray p-4 gap-4">
      <Text className="text-heading font-bold">Details</Text>
      <Button title="Go Back" onPress={() => router.back()} />
    </View>
  );
}
