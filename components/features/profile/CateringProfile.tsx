import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Text, TouchableOpacity, View } from 'react-native';
import { Card } from '../../ui/Card';
import { useAuth } from '../../../hooks/useAuth';
import { api } from '../../../services/api';
import { TwoFactorSettings } from './TwoFactorSettings';

interface School {
    id: string;
    name: string;
    address?: string;
}

interface CateringProfileProps {
    onChangePassword: () => void;
}

export function CateringProfile({ onChangePassword }: CateringProfileProps) {
    const { user, signOut } = useAuth();
    const [schools, setSchools] = useState<School[]>([]);
    const [loadingSchools, setLoadingSchools] = useState(false);

    useEffect(() => {
        const fetchSchools = async () => {
            if (!user?.cateringId) return;
            setLoadingSchools(true);
            try {
                const res = await api(`caterings/${user.cateringId}/schools`);
                setSchools(res);
            } catch (error) {
                console.error('Failed to fetch affiliated schools', error);
            } finally {
                setLoadingSchools(false);
            }
        };

        fetchSchools();
    }, [user?.cateringId]);

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

    const cateringName = user?.catering?.name || "Nama Catering Tidak Tersedia";
    const cateringAddress = user?.catering?.addressLine
        ? `${user.catering.addressLine}, ${user.catering.administrativeAreaLevel2 || ''}`
        : "Alamat belum diatur";

    return (
        <View className="space-y-6">
            <Card className="p-0 overflow-hidden">
                <View className="bg-orange-500 p-6 items-center">
                    <View className="w-24 h-24 bg-white rounded-full items-center justify-center mb-4 border-4 border-orange-300">
                        <Ionicons name="restaurant" size={40} color="#F97316" />
                    </View>
                    <Text className="text-xl font-bold text-white text-center">
                        {user?.fullName || user?.username}
                    </Text>
                    <Text className="text-orange-100 text-center font-medium opacity-90">
                        ADMIN CATERING
                    </Text>
                    {user?.username && (
                        <Text className="text-orange-200 text-sm mt-1">@{user.username}</Text>
                    )}
                </View>

                <View className="p-4 space-y-4 bg-white">
                    <View className="flex-row items-center justify-between py-2 border-b border-gray-100">
                        <View className="flex-row items-center gap-3">
                            <Ionicons name="business" size={20} color="#64748B" />
                            <Text className="text-gray-600">Nama Usaha</Text>
                        </View>
                        <Text className="font-medium text-gray-900">
                            {cateringName}
                        </Text>
                    </View>

                    <View className="flex-row items-center justify-between py-2 border-b border-gray-100">
                        <View className="flex-row items-center gap-3">
                            <Ionicons name="location" size={20} color="#64748B" />
                            <Text className="text-gray-600">Area</Text>
                        </View>
                        <Text className="font-medium text-gray-900 max-w-[60%] text-right" numberOfLines={2}>
                            {cateringAddress}
                        </Text>
                    </View>
                </View>
            </Card>

            <View>
                <Text className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 px-1">
                    Sekolah Terafiliasi ({schools.length})
                </Text>

                {loadingSchools ? (
                    <ActivityIndicator size="small" color="#6B7280" className="py-4" />
                ) : schools.length > 0 ? (
                    <View className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 divide-y divide-gray-100">
                        {schools.map((school) => (
                            <View key={school.id} className="p-4 flex-row items-center">
                                <View className="w-8 h-8 rounded-full bg-green-50 items-center justify-center mr-3">
                                    <Ionicons name="school" size={16} color="#10B981" />
                                </View>
                                <Text className="text-gray-900 font-medium flex-1">
                                    {school.name}
                                </Text>
                            </View>
                        ))}
                    </View>
                ) : (
                    <View className="bg-white rounded-2xl p-6 items-center justify-center border border-dashed border-gray-300">
                        <Ionicons name="school-outline" size={32} color="#D1D5DB" />
                        <Text className="text-gray-400 mt-2 text-center">Belum ada sekolah yang terhubung</Text>
                    </View>
                )}
            </View>

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
