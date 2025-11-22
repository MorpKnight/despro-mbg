import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/ui/Button';
import { api } from '../../services/api';


export default function SignUpPage() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [fullName, setFullName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSignUp = async () => {
        if (!username || !fullName || !password || !confirmPassword) {
            Alert.alert('Error', 'Mohon lengkapi semua kolom.');
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert('Error', 'Konfirmasi password tidak cocok.');
            return;
        }
        if (password.length < 8) {
            Alert.alert('Error', 'Password minimal 8 karakter.');
            return;
        }

        setLoading(true);
        try {
            await api('register', {
                method: 'POST',
                body: JSON.stringify({
                    username,
                    full_name: fullName,
                    password,
                }),
            });

            Alert.alert('Sukses', 'Akun berhasil dibuat. Silakan login.', [
                { text: 'Login', onPress: () => router.replace('/(auth)') }
            ]);
        } catch (error: any) {
            Alert.alert('Gagal', error.message || 'Gagal membuat akun.');
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
                        
                        {/* --- HEADER --- */}
                        <View className="items-center mb-8 mt-10">
                            <View className="w-20 h-20 bg-green-50 rounded-full items-center justify-center mb-4">
                                <Ionicons name="person-add-outline" size={40} color="#10B981" />
                            </View>
                            <Text className="text-2xl font-bold text-gray-900 text-center">Buat Akun Baru</Text>
                            <Text className="text-gray-500 text-center mt-2 px-4">
                                Daftar untuk mulai menggunakan aplikasi.
                            </Text>
                        </View>

                        {/* --- FORM FIELDS --- */}
                        <View className="gap-4">

                            <View>
                                <Text className="text-sm font-medium text-gray-700 mb-1">Nama Lengkap</Text>
                                <View className="flex-row items-center border border-gray-300 rounded-lg bg-gray-50 px-3">
                                    <TextInput
                                        className="flex-1 py-3 text-base"
                                        placeholder="Masukkan nama lengkap"
                                        value={fullName}
                                        onChangeText={setFullName}
                                    />
                                </View>
                            </View>

                            <View>
                                <Text className="text-sm font-medium text-gray-700 mb-1">Username</Text>
                                <View className="flex-row items-center border border-gray-300 rounded-lg bg-gray-50 px-3">
                                    <TextInput
                                        className="flex-1 py-3 text-base"
                                        placeholder="Masukkan username"
                                        autoCapitalize="none"
                                        value={username}
                                        onChangeText={setUsername}
                                    />
                                </View>
                            </View>

                            <View>
                                <Text className="text-sm font-medium text-gray-700 mb-1">Password</Text>
                                <View className="flex-row items-center border border-gray-300 rounded-lg bg-gray-50 px-3">
                                    <TextInput
                                        className="flex-1 py-3 text-base"
                                        placeholder="Minimal 8 karakter"
                                        secureTextEntry={!showPassword}
                                        value={password}
                                        onChangeText={setPassword}
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
                                        placeholder="Ulangi password"
                                        secureTextEntry={!showPassword}
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                    />
                                </View>
                            </View>

                            {/* --- SUBMIT BUTTON --- */}
                            <Button
                                title="Daftar"
                                onPress={handleSignUp}
                                loading={loading}
                                className="mt-2"
                            />

                            {/* --- LOGIN LINK --- */}
                            <View className="items-center mt-4">
                                <Text>
                                    Sudah punya akun?{' '}
                                    <Text
                                        className="text-primary font-semibold underline"
                                        onPress={() => router.push('/(auth)')}
                                    >
                                        Login
                                    </Text>
                                </Text>
                            </View>

                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
