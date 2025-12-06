import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { ActivityIndicator, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, Easing, cancelAnimation } from 'react-native-reanimated';

interface RefreshButtonProps {
    onRefresh: () => void;
    isRefreshing?: boolean;
    color?: string;
    className?: string;
}

export default function RefreshButton({
    onRefresh,
    isRefreshing = false,
    color = '#4B5563', // gray-600
    className = '',
}: RefreshButtonProps) {
    const rotation = useSharedValue(0);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ rotate: `${rotation.value}deg` }],
        };
    });

    useEffect(() => {
        if (isRefreshing) {
            rotation.value = withRepeat(
                withTiming(360, { duration: 1000, easing: Easing.linear }),
                -1,
                false
            );
        } else {
            cancelAnimation(rotation);
            rotation.value = withTiming(0);
        }
    }, [isRefreshing]);

    return (
        <TouchableOpacity
            onPress={onRefresh}
            disabled={isRefreshing}
            className={`p-2 rounded-full active:bg-gray-100 ${className}`}
            activeOpacity={0.7}
        >
            {isRefreshing ? (
                <ActivityIndicator size="small" color={color} />
            ) : (
                <Ionicons name="refresh" size={20} color={color} />
            )}
        </TouchableOpacity>
    );
}
