import React from 'react';
import { Pressable, Text, View, ViewProps } from 'react-native';

interface SegmentedControlProps {
    values: string[];
    selectedIndex: number;
    onChange: (index: number) => void;
    className?: string;
}

export function SegmentedControl({
    values,
    selectedIndex,
    onChange,
    className = '',
}: SegmentedControlProps) {
    return (
        <View className={`flex-row bg-gray-100 p-1 rounded-xl ${className}`}>
            {values.map((value, index) => {
                const isSelected = selectedIndex === index;
                return (
                    <Pressable
                        key={index}
                        onPress={() => onChange(index)}
                        className={`flex-1 py-2 items-center justify-center rounded-lg ${isSelected ? 'bg-white shadow-sm' : ''}`}
                    >
                        <Text className={`text-sm font-medium ${isSelected ? 'text-blue-600' : 'text-gray-500'}`}>
                            {value}
                        </Text>
                    </Pressable>
                );
            })}
        </View>
    );
}
