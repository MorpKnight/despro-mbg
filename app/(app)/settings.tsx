import { Link } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';
import Button from '../../components/ui/Button';

export default function SettingsScreen() {
  return (
    <View className="flex-1 bg-neutral-gray p-4 gap-4">
      <Text className="text-heading font-bold">Settings</Text>
      <Link href="/details" asChild>
        <Button title="Go to Details" />
      </Link>
    </View>
  );
}
