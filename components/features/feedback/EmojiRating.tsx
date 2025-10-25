import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, View } from 'react-native';

type Props = {
  value: number;
  onChange: (v: number) => void;
  size?: number;
  disabled?: boolean;
};

// Simple 1-5 star rating using Ionicons
export default function EmojiRating({ value, onChange, size = 28, disabled }: Props) {
  return (
    <View className="flex-row items-center gap-2">
      {Array.from({ length: 5 }).map((_, idx) => {
        const score = idx + 1;
        const filled = score <= value;
        return (
          <Pressable
            key={score}
            accessibilityRole="button"
            accessibilityLabel={`Rating ${score}`}
            disabled={disabled}
            onPress={() => onChange(score)}
            hitSlop={8}
            className="active:opacity-80"
          >
            <Ionicons
              name={filled ? 'star' : 'star-outline'}
              size={size}
              color={filled ? '#f59e0b' : '#9ca3af'}
            />
          </Pressable>
        );
      })}
    </View>
  );
}
