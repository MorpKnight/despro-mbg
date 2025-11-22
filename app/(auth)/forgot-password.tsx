import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/ui/Button';
import { api } from '../../services/api';

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRequestReset = async () => {
        if (!email) {
            Alert.alert('Error', 'Mohon masukkan email Anda.');
            return;
        }

        setLoading(true);
        try {
            await api('password-recovery/request', {
                method: 'POST',
                body: JSON.stringify({ email }),
            });
            Alert.alert('Sukses', 'Link reset password telah dikirim ke email Anda.', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error: any) {
            Alert.alert('Gagal', error.message || 'Gagal memproses permintaan reset password.');
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
                        <TouchableOpacity onPress={() => router.back()} className="mb-6">
                            <Ionicons name="arrow-back" size={24} color="#374151" />
                        </TouchableOpacity>

                        <View className="items-center mb-8">
                            <View className="w-20 h-20 bg-blue-50 rounded-full items-center justify-center mb-4">
                                <Ionicons name="key-outline" size={40} color="#1976D2" />
                            </View>
                            <Text className="text-2xl font-bold text-gray-900 text-center">Lupa Password?</Text>
                            <Text className="text-gray-500 text-center mt-2 px-4">
                                Masukkan email yang terdaftar untuk menerima instruksi reset password.
                            </Text>
                        </View>

                        <View className="gap-4">
                            <View>
                                <Text className="text-sm font-medium text-gray-700 mb-1">Email</Text>
                                <TextInput
                                    className="border border-gray-300 rounded-lg p-3 text-base bg-gray-50"
                                    placeholder="nama@email.com"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    value={email}
                                    onChangeText={setEmail}
                                />
                            </View>

                            <Button
                                title="Kirim Link Reset"
                                onPress={handleRequestReset}
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
