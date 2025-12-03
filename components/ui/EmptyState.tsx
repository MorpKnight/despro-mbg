import { Ionicons } from '@expo/vector-icons';
import React, { ReactNode } from 'react';
import { Text, View } from 'react-native';
import Button from './Button';

interface EmptyStateProps {
    icon?: keyof typeof Ionicons.glyphMap;
    title: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
    actionIcon?: ReactNode;
    className?: string;
}

export default function EmptyState({
    icon = 'search',
    title,
    description,
    actionLabel,
    onAction,
    actionIcon,
    className = '',
}: EmptyStateProps) {
    return (
        <View className={`items-center justify-center py-12 px-6 ${className}`}>
            <View className="w-20 h-20 bg-gray-50 rounded-full items-center justify-center mb-6">
                <Ionicons name={icon} size={40} color="#9CA3AF" />
            </View>
            <Text className="text-xl font-bold text-gray-900 text-center mb-2">
                {title}
            </Text>
            {description && (
                <Text className="text-gray-500 text-center mb-8 max-w-xs leading-relaxed">
                    {description}
                </Text>
            )}
            {actionLabel && onAction && (
                <Button
                    title={actionLabel}
                    onPress={onAction}
                    icon={actionIcon}
                    size="md"
                />
            )}
        </View>
    );
}
