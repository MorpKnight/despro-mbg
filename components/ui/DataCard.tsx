import React, { ReactNode } from 'react';
import { Text, View } from 'react-native';
import Card from './Card';

interface DataCardProps {
    title: string;
    subtitle?: string;
    badges?: ReactNode;
    content?: ReactNode;
    actions?: ReactNode;
    onPress?: () => void;
    className?: string;
}

export default function DataCard({
    title,
    subtitle,
    badges,
    content,
    actions,
    onPress,
    className = '',
}: DataCardProps) {
    return (
        <Card onPress={onPress} className={`mb-3 ${className}`}>
            <View className="flex-row justify-between items-start">
                <View className="flex-1 mr-3">
                    <View className="flex-row items-center gap-2 mb-1 flex-wrap">
                        <Text className="text-lg font-bold text-gray-900">
                            {title}
                        </Text>
                        {badges}
                    </View>

                    {subtitle && (
                        <Text className="text-sm text-gray-500 mb-2">
                            {subtitle}
                        </Text>
                    )}

                    {content && (
                        <View className="mt-1">
                            {content}
                        </View>
                    )}
                </View>

                {actions && (
                    <View className="flex-row gap-2">
                        {actions}
                    </View>
                )}
            </View>
        </Card>
    );
}
