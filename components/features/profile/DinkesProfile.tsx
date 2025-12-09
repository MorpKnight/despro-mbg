import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Alert, Platform, Text, TouchableOpacity, View } from 'react-native';
import { Card } from '../../ui/Card';
import { useAuth } from '../../../hooks/useAuth';
import { TwoFactorSettings } from './TwoFactorSettings';

interface DinkesProfileProps {
    onChangePassword: () => void;
}

export function DinkesProfile({ onChangePassword }: DinkesProfileProps) {
    const { user, signOut } = useAuth();

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

    const instansiName = "Dinas Kesehatan";
    const area = user?.healthOfficeArea || "Wilayah belum diatur";

    return (
        <View className="space-y-6">
            <Card className="p-0 overflow-hidden">
                <View className="bg-cyan-600 p-6 items-center">
                    <View className="w-24 h-24 bg-white rounded-full items-center justify-center mb-4 border-4 border-cyan-300">
                        <Ionicons name="medkit" size={40} color="#0891B2" />
                    </View>
                    <Text className="text-xl font-bold text-white text-center">
                        {user?.fullName || user?.username}
                    </Text>
                    <Text className="text-cyan-100 text-center font-medium opacity-90">
                        ADMIN DINKES
                    </Text>
                    {user?.username && (
                        <Text className="text-cyan-200 text-sm mt-1">@{user.username}</Text>
                    )}
                </View>

                <View className="p-4 space-y-4 bg-white">
                    <View className="flex-row items-center justify-between py-2 border-b border-gray-100">
                        <View className="flex-row items-center gap-3">
                            <Ionicons name="business" size={20} color="#64748B" />
                            <Text className="text-gray-600">Instansi</Text>
                        </View>
                        <Text className="font-medium text-gray-900">
                            {instansiName}
                        </Text>
                    </View>

                    <View className="flex-row items-center justify-between py-2 border-b border-gray-100">
                        <View className="flex-row items-center gap-3">
                            <Ionicons name="map" size={20} color="#64748B" />
                            <Text className="text-gray-600">Wilayah Kerja</Text>
                        </View>
                        <Text className="font-medium text-gray-900 max-w-[60%] text-right" numberOfLines={2}>
                            {area}
                        </Text>
                    </View>
                </View>
            </Card>

            {/* 2FA Security Settings */}
            <TwoFactorSettings />

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
