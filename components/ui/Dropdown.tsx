import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import { Modal, Pressable, ScrollView, Text, TouchableOpacity, View, KeyboardAvoidingView, Platform } from 'react-native';
import SearchInput from './SearchInput';

export interface DropdownOption {
    label: string;
    value: string;
}

interface DropdownProps {
    options: DropdownOption[];
    value?: string;
    onValueChange: (value: string) => void;
    placeholder?: string;
    label?: string;
    disabled?: boolean;
    className?: string;
}

export default function Dropdown({
    options,
    value,
    onValueChange,
    placeholder = 'Pilih...',
    label,
    disabled = false,
    className = '',
}: DropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const selectedOption = options.find((opt) => opt.value === value);
    const displayText = selectedOption ? selectedOption.label : (value || placeholder);

    // Reset search query when modal opens/closes
    useEffect(() => {
        if (!isOpen) {
            setSearchQuery('');
        }
    }, [isOpen]);

    const handleSelect = (optionValue: string) => {
        onValueChange(optionValue);
        setIsOpen(false);
    };

    const filteredOptions = options.filter((opt) =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <View className={className}>
            {label && (
                <Text className="text-sm font-semibold text-gray-700 mb-2">{label}</Text>
            )}

            <TouchableOpacity
                onPress={() => !disabled && setIsOpen(true)}
                className={`border-2 rounded-xl p-4 flex-row items-center justify-between ${disabled ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300 active:border-blue-500'
                    }`}
                disabled={disabled}
                activeOpacity={0.7}
            >
                <Text
                    className={`text-base ${selectedOption ? 'text-gray-900 font-medium' : 'text-gray-400'
                        }`}
                >
                    {displayText}
                </Text>
                <Ionicons
                    name={isOpen ? 'chevron-up' : 'chevron-down'}
                    size={22}
                    color={disabled ? '#D1D5DB' : '#6B7280'}
                />
            </TouchableOpacity>

            <Modal
                visible={isOpen}
                transparent
                animationType="slide"
                onRequestClose={() => setIsOpen(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    className="flex-1"
                >
                    <Pressable
                        className="flex-1 bg-black/50 justify-end"
                        onPress={() => setIsOpen(false)}
                    >
                        <Pressable className="bg-white rounded-t-3xl h-[85%] flex w-full overflow-hidden">
                            {/* Handle Indicator */}
                            <View className="items-center pt-3 pb-2 bg-white">
                                <View className="w-12 h-1.5 bg-gray-300 rounded-full" />
                            </View>

                            <View className="flex-row justify-between items-center px-6 pb-4 border-b border-gray-100 bg-white">
                                <Text className="text-xl font-bold text-gray-900">
                                    {label || 'Pilih Opsi'}
                                </Text>
                                <TouchableOpacity
                                    onPress={() => setIsOpen(false)}
                                    className="p-2 bg-gray-100 rounded-full"
                                >
                                    <Ionicons name="close" size={20} color="#6B7280" />
                                </TouchableOpacity>
                            </View>

                            <View className="px-4 py-3 bg-white">
                                <SearchInput
                                    placeholder="Cari..."
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    containerClassName="mb-1"
                                />
                            </View>

                            <ScrollView className="px-4 flex-1 bg-white" showsVerticalScrollIndicator={false}>
                                {filteredOptions.length > 0 ? (
                                    filteredOptions.map((option) => (
                                        <TouchableOpacity
                                            key={option.value}
                                            onPress={() => handleSelect(option.value)}
                                            className={`p-4 rounded-xl flex-row items-center justify-between my-1 ${option.value === value ? 'bg-blue-50 border-2 border-blue-200' : 'bg-gray-50'
                                                }`}
                                            activeOpacity={0.7}
                                        >
                                            <Text
                                                className={`text-base ${option.value === value
                                                    ? 'text-blue-700 font-semibold'
                                                    : 'text-gray-900'
                                                    }`}
                                            >
                                                {option.label}
                                            </Text>
                                            {option.value === value && (
                                                <View className="bg-blue-600 rounded-full p-1">
                                                    <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    ))
                                ) : (
                                    <View className="p-8 items-center justify-center">
                                        <Text className="text-gray-500 text-center">
                                            Tidak ditemukan "{searchQuery}"
                                        </Text>
                                    </View>
                                )}
                                <View className="h-10" />
                            </ScrollView>
                        </Pressable>
                    </Pressable>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}
