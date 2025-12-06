import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View, Modal, Pressable, TextInput, Alert, ActivityIndicator } from 'react-native';
import Button from '../../ui/Button';
import { useAuth } from '../../../hooks/useAuth';
import { api } from '../../../services/api';

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

    const cateringName = user?.catering?.name || "Nama Catering Tidak Tersedia";
    // Fallback address placeholders if not present in user.catering
    const cateringAddress = user?.catering?.addressLine
        ? `${user.catering.addressLine}, ${user.catering.administrativeAreaLevel2 || ''}`
        : "Alamat belum diatur";

    return (
        <View className="flex-1 bg-gray-50">
            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>

                {/* Header Section */}
                <View className="bg-white pb-6 pt-2 px-6 rounded-b-[32px] shadow-sm mb-4">
                    <View className="flex-row items-center justify-between mb-6">
                        <Text className="text-2xl font-bold text-gray-900">Profil Catering</Text>
                        <View className="bg-purple-100 px-3 py-1 rounded-full">
                            <Text className="text-purple-700 text-xs font-bold uppercase">Admin Catering</Text>
                        </View>
                    </View>

                    <View className="flex-row items-center">
                        <View className="w-20 h-20 rounded-full bg-purple-600 items-center justify-center shadow-lg border-4 border-white mr-5">
                            <Text className="text-3xl font-bold text-white">
                                {user?.username?.[0]?.toUpperCase() ?? 'C'}
                            </Text>
                        </View>
                        <View className="flex-1">
                            <Text className="text-xl font-bold text-gray-900 mb-1">
                                {user?.fullName || user?.username}
                            </Text>
                            <Text className="text-gray-500 text-sm">
                                @{user?.username}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Catering Info Card */}
                <View className="px-4 mb-4">
                    <Text className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 px-1 mt-2">
                        Informasi Usaha
                    </Text>
                    <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <View className="flex-row items-start mb-4">
                            <View className="w-10 h-10 rounded-full bg-orange-50 items-center justify-center mr-4">
                                <Ionicons name="restaurant" size={20} color="#F97316" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Nama Catering</Text>
                                <Text className="text-base font-semibold text-gray-900">{cateringName}</Text>
                            </View>
                        </View>
                        <View className="flex-row items-start">
                            <View className="w-10 h-10 rounded-full bg-blue-50 items-center justify-center mr-4">
                                <Ionicons name="location" size={20} color="#3B82F6" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Area Operasional</Text>
                                <Text className="text-base text-gray-900">{cateringAddress}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Schools List */}
                <View className="px-4 mb-4">
                    <Text className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 px-1 mt-4">
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

                {/* Account Settings */}
                <View className="px-4 mt-2">
                    <Text className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 px-1">
                        Akun
                    </Text>
                    <View className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                        <TouchableOpacity
                            onPress={onChangePassword}
                            className="flex-row items-center px-4 py-4 border-b border-gray-100 active:bg-gray-50"
                        >
                            <View className="w-10 h-10 rounded-full bg-orange-50 items-center justify-center mr-4">
                                <Ionicons name="lock-closed-outline" size={20} color="#EA580C" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-base font-medium text-gray-900">Ubah Password</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={signOut}
                            className="flex-row items-center px-4 py-4 active:bg-gray-50"
                        >
                            <View className="w-10 h-10 rounded-full bg-red-50 items-center justify-center mr-4">
                                <Ionicons name="log-out-outline" size={20} color="#DC2626" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-base font-medium text-gray-900">Keluar</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
                        </TouchableOpacity>
                    </View>
                </View>

                <Text className="text-center text-gray-400 mt-8 text-xs font-medium uppercase tracking-widest">
                    Versi Aplikasi 1.0.0
                </Text>

            </ScrollView>
        </View>
    );
}
