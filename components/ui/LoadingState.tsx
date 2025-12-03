import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

interface LoadingStateProps {
    message?: string;
    fullScreen?: boolean;
    className?: string;
}

export default function LoadingState({
    message = 'Memuat data...',
    fullScreen = false,
    className = '',
}: LoadingStateProps) {
    const containerClass = fullScreen
        ? 'flex-1 items-center justify-center bg-white'
        : 'py-12 items-center justify-center';

    return (
        <View className={`${containerClass} ${className}`}>
            <ActivityIndicator size="large" color="#1976D2" />
            {message && (
                <Text className="text-gray-500 mt-4 text-sm font-medium">
                    {message}
                </Text>
            )}
        </View>
    );
}
