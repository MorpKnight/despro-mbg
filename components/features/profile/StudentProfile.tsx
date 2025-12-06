import React, { useState } from 'react';
import { View, Text, Switch, TouchableOpacity, Alert, Platform } from 'react-native';
import { useAuth } from '../../../hooks/useAuth';
import { useNetworkMode } from '../../../hooks/useNetworkMode';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../../components/ui/Card';
import { router } from 'expo-router';

interface StudentProfileProps {
    onChangePassword: () => void;
}

export function StudentProfile({ onChangePassword }: StudentProfileProps) {
    const { user, signOut } = useAuth();
    const { currentMode, toggleMode } = useNetworkMode();

    const handleSignOut = () => {
        if (Platform.OS === 'web') {
            if (window.confirm("Apakah Anda yakin ingin keluar?")) {
                signOut();
            }
        } else {
            Alert.alert(
                "Keluar",
                "Apakah Anda yakin ingin keluar?",
                [
                    { text: "Batal", style: "cancel" },
                    {
                        text: "Keluar",
                        style: "destructive",
                        onPress: signOut
                    }
                ]
            );
        }
    };

    return (
        <View className="space-y-6">
            <Card className="p-0 overflow-hidden">
                <View className="bg-blue-600 p-6 items-center">
                    <View className="w-24 h-24 bg-white rounded-full items-center justify-center mb-4 border-4 border-blue-400">
                        <Ionicons name="school" size={40} color="#2563EB" />
                    </View>
                    <Text className="text-xl font-bold text-white text-center">
                        {user?.fullName || user?.username}
                    </Text>
                    <Text className="text-blue-100 text-center font-medium opacity-90">
                        {user?.role?.toUpperCase()}
                    </Text>
                    {user?.username && (
                        <Text className="text-blue-200 text-sm mt-1">@{user.username}</Text>
                    )}
                </View>

                <View className="p-4 space-y-4 bg-white">
                    <View className="flex-row items-center justify-between py-2 border-b border-gray-100">
                        <View className="flex-row items-center gap-3">
                            <Ionicons name="business" size={20} color="#64748B" />
                            <Text className="text-gray-600">Sekolah</Text>
                        </View>
                        <Text className="font-medium text-gray-900">
                            {user?.sekolah?.name || (user?.schoolId ? `ID: ${user.schoolId.substring(0, 8)}...` : '-')}
                        </Text>
                    </View>
                </View>
            </Card>

            <Card className="p-4 space-y-4">
                <Text className="text-lg font-bold text-gray-900 mb-2">Pengaturan Akun</Text>

                <TouchableOpacity
                    onPress={onChangePassword}
                    className="flex-row items-center justify-between py-3 border-b border-gray-100"
                >
                    <View className="flex-row items-center gap-3">
                        <View className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center">
                            <Ionicons name="lock-closed" size={18} color="#4B5563" />
                        </View>
                        <Text className="text-gray-700 font-medium">Ganti Password</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </TouchableOpacity>

                <TouchableOpacity
                    className="flex-row items-center justify-between py-3"
                    onPress={handleSignOut}
                >
                    <View className="flex-row items-center gap-3">
                        <View className="w-8 h-8 rounded-full bg-red-50 items-center justify-center">
                            <Ionicons name="log-out" size={18} color="#EF4444" />
                        </View>
                        <Text className="text-red-600 font-medium">Keluar Aplikasi</Text>
                    </View>
                </TouchableOpacity>
            </Card>

            <View className="items-center mt-4">
                <Text className="text-xs text-gray-400">Versi Aplikasi 1.0.0</Text>
            </View>
        </View>
    );
}
