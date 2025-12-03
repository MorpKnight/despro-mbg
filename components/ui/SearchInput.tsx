import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { TextInput as RNTextInput, TextInputProps, View } from 'react-native';

interface SearchInputProps extends TextInputProps {
    containerClassName?: string;
}

export default function SearchInput({
    containerClassName = '',
    className = '',
    ...props
}: SearchInputProps) {
    return (
        <View className={`flex-row items-center bg-white border border-gray-200 rounded-xl px-4 h-12 ${containerClassName}`}>
            <Ionicons name="search" size={20} color="#9CA3AF" />
            <RNTextInput
                placeholderTextColor="#9CA3AF"
                className={`flex-1 ml-3 text-base text-gray-900 h-full ${className}`}
                {...props}
            />
        </View>
    );
}
