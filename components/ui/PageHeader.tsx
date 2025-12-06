import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { ReactNode } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import RefreshButton from './RefreshButton';

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    showBackButton?: boolean;
    rightAction?: ReactNode;
    onRefresh?: () => void;
    isRefreshing?: boolean;
    className?: string;
    backPath?: string;
}

export default function PageHeader({
    title,
    subtitle,
    showBackButton = true,
    rightAction,
    onRefresh,
    isRefreshing,
    className = '',
    backPath,
}: PageHeaderProps) {
    const router = useRouter();
    const { isEdgeMode } = useAuth();

    return (
        <View className={`flex-row items-center justify-between mb-6 ${className}`}>
            <View className="flex-row items-center flex-1 mr-4">
                {showBackButton && (
                    <TouchableOpacity
                        onPress={() => backPath ? router.replace(backPath as any) : router.back()}
                        className="mr-4 p-2 -ml-2 rounded-full active:bg-gray-100"
                        accessibilityRole="button"
                        accessibilityLabel="Go back"
                    >
                        <Ionicons name="arrow-back" size={24} color="#111827" />
                    </TouchableOpacity>
                )}
                <View className="flex-1">
                    <Text className="text-2xl font-bold text-gray-900" numberOfLines={1}>
                        {title}
                    </Text>
                    {subtitle && (
                        <Text className="text-base text-gray-600 mt-0.5" numberOfLines={1}>
                            {subtitle}
                        </Text>
                    )}
                    {isEdgeMode && (
                        <Text className="text-orange-600 font-bold text-xs mt-1">
                            Read Only - Edge Mode
                        </Text>
                    )}
                </View>
            </View>

            <View className="flex-row items-center gap-2">
                {onRefresh && (
                    <RefreshButton
                        onRefresh={onRefresh}
                        isRefreshing={isRefreshing}
                        className={rightAction ? "mr-1" : ""}
                    />
                )}
                {rightAction && rightAction}
            </View>
        </View>
    );
}
