import React from 'react';
import { Pressable, PressableProps, ScrollView, Text, View } from 'react-native';

interface ChipProps extends PressableProps {
  label: string;
  active?: boolean;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  className?: string;
}

export function Chip({
  label,
  active,
  leadingIcon,
  trailingIcon,
  style,
  className = '',
  ...rest
}: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      className={`${active ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'} border px-4 py-2 rounded-full flex-row items-center gap-2 active:opacity-90 ${className}`}
      style={style as any}
      {...rest}
    >
      {leadingIcon}
      <Text className={`text-sm font-semibold ${active ? 'text-white' : 'text-gray-700'}`}>{label}</Text>
      {trailingIcon}
    </Pressable>
  );
}

interface ChipGroupOption {
  label: string;
  value: string;
}

interface ChipGroupProps {
  options: ChipGroupOption[];
  value: string;
  onChange: (value: string) => void;
  scrollable?: boolean;
  className?: string;
}

export function ChipGroup({ options, value, onChange, scrollable, className = '' }: ChipGroupProps) {
  if (scrollable) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className={`flex-row gap-2 ${className}`}>
        {options.map((option) => (
          <Chip
            key={option.value}
            label={option.label}
            active={option.value === value}
            onPress={() => onChange(option.value)}
          />
        ))}
      </ScrollView>
    );
  }
  return (
    <View className={`flex-row flex-wrap gap-2 ${className}`}>
      {options.map((option) => (
        <Chip
          key={option.value}
          label={option.label}
          active={option.value === value}
          onPress={() => onChange(option.value)}
        />
      ))}
    </View>
  );
}
