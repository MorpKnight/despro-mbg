import React from 'react';
import { Pressable, Text, ViewStyle } from 'react-native';

interface FABProps {
  icon?: React.ReactNode;
  label?: string;
  onPress?: () => void;
  style?: ViewStyle;
  className?: string;
}

export function FAB({ icon, label, onPress, style, className = '' }: FABProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className={`absolute bottom-8 right-6 bg-blue-600 rounded-full shadow-2xl px-6 py-4 flex-row items-center gap-2 active:opacity-85 ${className}`}
      style={style}
    >
      {icon}
      {label && <Text className="text-white font-semibold">{label}</Text>}
    </Pressable>
  );
}
