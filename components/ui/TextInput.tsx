import React from 'react';
import { TextInput as RNTextInput, TextInputProps, View } from 'react-native';

export default function TextInput(props: TextInputProps) {
  return (
    <View className="bg-neutral-white rounded-card shadow-card px-3 py-2 w-full border border-gray-200 focus-within:border-transparent focus-within:ring-2 focus-within:ring-primary/30">
      <RNTextInput
        placeholderTextColor="#9CA3AF"
        className="text-body text-black w-full"
        {...props}
      />
    </View>
  );
}
