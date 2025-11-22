import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/ui/Button';
import { api } from '../../services/api';

export default function ResetPasswordPage() {
    const router = useRouter();
    const { token } = useLocalSearchParams<{ token: string }>();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleResetPassword = async () => {
        if (!token) {
            Alert.alert('Error', 'Token reset password tidak valid atau hilang.');
            return;
        }
        if (!newPassword || !confirmPassword) {
            Alert.alert('Error', 'Mohon lengkapi semua kolom.');
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'Konfirmasi password tidak cocok.');
            return;
        }
        if (newPassword.length < 8) {
            Alert.alert('Error', 'Password minimal 8 karakter.');
            return;
        }

        setLoading(true);
        try {
            await api('password-recovery/reset', {
                method: 'POST',
                body: JSON.stringify({ token, new_password: newPassword }),
            });
            Alert.alert('Sukses', 'Password berhasil direset. Silakan login dengan password baru.', [
                { text: 'Login', onPress: () => router.replace('/(auth)') }
            ]);
        } catch (error: any) {
            Alert.alert('Gagal', error.message || 'Gagal mereset password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                    <View className="p-6">
                        <View className="items-center mb-8 mt-10">
                            <View className="w-20 h-20 bg-green-50 rounded-full items-center justify-center mb-4">
                                <Ionicons name="lock-closed-outline" size={40} color="#10B981" />
                            </View>
                            <Text className="text-2xl font-bold text-gray-900 text-center">Reset Password</Text>
                            <Text className="text-gray-500 text-center mt-2 px-4">
                                Buat password baru untuk akun Anda.
                            </Text>
                        </View>

                        <View className="gap-4">
                            <View>
                                <Text className="text-sm font-medium text-gray-700 mb-1">Password Baru</Text>
                                <View className="flex-row items-center border border-gray-300 rounded-lg bg-gray-50 px-3">
                                    <TextInput
                                        className="flex-1 py-3 text-base"
                                        placeholder="Minimal 8 karakter"
                                        secureTextEntry={!showPassword}
                                        value={newPassword}
                                        onChangeText={setNewPassword}
                                    />
                                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                        <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#6B7280" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View>
                                <Text className="text-sm font-medium text-gray-700 mb-1">Konfirmasi Password</Text>
                                <View className="flex-row items-center border border-gray-300 rounded-lg bg-gray-50 px-3">
                                    <TextInput
                                        className="flex-1 py-3 text-base"
                                        placeholder="Ulangi password baru"
                                        secureTextEntry={!showPassword}
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                    />
                                </View>
                            </View>

                            <Button
                                title="Simpan Password Baru"
                                onPress={handleResetPassword}
                                loading={loading}
                                className="mt-2"
                            />
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
