import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Text, TouchableOpacity, View } from 'react-native';

interface ToastProps {
    visible: boolean;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'error';
    onHide: () => void;
    duration?: number;
}

export default function Toast({
    visible,
    message,
    type = 'info',
    onHide,
    duration = 3000
}: ToastProps) {
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.sequence([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.delay(duration),
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                onHide();
            });
        }
    }, [visible, duration, fadeAnim, onHide]);

    if (!visible) return null;

    const getBackgroundColor = () => {
        switch (type) {
            case 'success': return 'bg-green-500';
            case 'warning': return 'bg-orange-500';
            case 'error': return 'bg-red-500';
            default: return 'bg-blue-600';
        }
    };

    const getIcon = () => {
        switch (type) {
            case 'success': return 'checkmark-circle';
            case 'warning': return 'warning';
            case 'error': return 'alert-circle';
            default: return 'information-circle';
        }
    };

    return (
        <Animated.View
            style={{
                opacity: fadeAnim,
                transform: [{
                    translateY: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-20, 0]
                    })
                }]
            }}
            className="absolute top-10 left-4 right-4 z-50"
        >
            <View className={`${getBackgroundColor()} rounded-lg shadow-lg p-4 flex-row items-center`}>
                <Ionicons name={getIcon()} size={24} color="white" />
                <Text className="flex-1 text-white font-medium ml-3">
                    {message}
                </Text>
                <TouchableOpacity onPress={onHide}>
                    <Ionicons name="close" size={20} color="white" />
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
}
