import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import Button from "../../components/ui/Button";
import Icon from "../../components/ui/Icon";
import TextInput from "../../components/ui/TextInput";
import { useAuth } from "../../hooks/useAuth";

interface LoginFormProps {
    onShowSettings: () => void;
}

export const LoginForm = ({ onShowSettings }: LoginFormProps) => {
    const { loading, signIn } = useAuth();
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [usernameError, setUsernameError] = useState<string | null>(null);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [loginType, setLoginType] = useState<'staff' | 'student'>('staff');

    const handleLogin = async () => {
        try {
            setError(null);
            if (!username.trim()) {
                setUsernameError("Username wajib diisi");
                return;
            }
            if (!password) {
                setPasswordError("Password wajib diisi");
                return;
            }
            await signIn(username.trim(), password, loginType === 'student' ? 'auth/login/student' : 'auth/login');
        } catch (e: any) {
            setError(e?.message || "Gagal masuk");
        }
    };

    // Demo accounts for quick testing
    const demoAccounts = [
        { label: 'Super Admin', u: 'superadmin', p: 'password' },
        { label: 'Sekolah', u: 'admin_sekolah_active_1', p: 'password' },
        { label: 'Catering', u: 'admin_catering_active_1', p: 'password' },
        { label: 'Dinkes', u: 'admin_dinkes_active_1', p: 'password' },
        { label: 'Siswa', u: 'siswa_active_1', p: 'password' },
    ];

    return (
        <View>
            <View className="mb-6">
                <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-3xl font-bold text-gray-900">
                        Selamat Datang
                    </Text>
                    <TouchableOpacity onPress={onShowSettings} className="p-2">
                        <Icon name="settings-outline" size={24} color="#374151" />
                    </TouchableOpacity>
                </View>
                <Text className="text-gray-500 text-lg">
                    Silakan masuk ke akun Anda
                </Text>
            </View>

            {/* Login Type Toggle */}
            <View className="flex-row mb-6 bg-gray-100 p-1.5 rounded-xl">
                <TouchableOpacity
                    className={`flex-1 py-3 rounded-lg items-center transition-all ${loginType === 'staff' ? 'bg-white shadow-sm' : 'hover:bg-gray-200/50'}`}
                    onPress={() => setLoginType('staff')}
                >
                    <Text className={`font-medium text-base ${loginType === 'staff' ? 'text-blue-600' : 'text-gray-500'}`}>Staf / Admin</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    className={`flex-1 py-3 rounded-lg items-center transition-all ${loginType === 'student' ? 'bg-white shadow-sm' : 'hover:bg-gray-200/50'}`}
                    onPress={() => setLoginType('student')}
                >
                    <Text className={`font-medium text-base ${loginType === 'student' ? 'text-blue-600' : 'text-gray-500'}`}>Siswa</Text>
                </TouchableOpacity>
            </View>

            {error ? (
                <Animated.View entering={FadeInDown} className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex-row items-center gap-3">
                    <Icon name="alert-circle" size={20} color="#DC2626" />
                    <Text className="text-red-700 font-medium flex-1">{error}</Text>
                </Animated.View>
            ) : null}

            <View className="gap-5">
                <View>
                    <Text className="text-sm font-semibold text-gray-700 mb-2">Username</Text>
                    <TextInput
                        placeholder="Masukkan username"
                        value={username}
                        onChangeText={(t) => {
                            setUsername(t);
                            if (usernameError) setUsernameError(null);
                        }}
                        autoCapitalize="none"
                        className="h-12 bg-white border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-base"
                    />
                    {usernameError ? (
                        <Text className="text-red-600 text-sm mt-1.5 ml-1">
                            {usernameError}
                        </Text>
                    ) : null}
                </View>

                <View>
                    <Text className="text-sm font-semibold text-gray-700 mb-2">Password</Text>
                    <View className="relative">
                        <TextInput
                            placeholder="Masukkan password"
                            value={password}
                            onChangeText={(t) => {
                                setPassword(t);
                                if (passwordError) setPasswordError(null);
                            }}
                            secureTextEntry={!showPassword}
                            className="h-12 bg-white border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-base pr-12"
                        />
                        <TouchableOpacity
                            className="absolute right-0 top-0 h-12 w-12 items-center justify-center"
                            onPress={() => setShowPassword(!showPassword)}
                        >
                            <Icon name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#9CA3AF" />
                        </TouchableOpacity>
                    </View>
                    {passwordError ? (
                        <Text className="text-red-600 text-sm mt-1.5 ml-1">
                            {passwordError}
                        </Text>
                    ) : null}
                </View>

                <Button
                    className="w-full h-12 mt-2 shadow-lg shadow-blue-600/20"
                    title={loading ? "Memproses..." : "Masuk"}
                    onPress={handleLogin}
                    disabled={!username.trim() || !password || loading}
                    size="lg"
                />
            </View>

            <View className="mt-8 pt-8 border-t border-gray-100">
                <Text className="text-gray-400 text-xs text-center mb-4 uppercase tracking-wider font-semibold">
                    Akun Demo
                </Text>
                <View className="flex-row flex-wrap justify-center gap-2">
                    {demoAccounts.map((demo) => (
                        <TouchableOpacity
                            key={demo.label}
                            onPress={() => {
                                setUsername(demo.u);
                                setPassword(demo.p);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-all"
                        >
                            <Text className="text-xs font-medium text-gray-600">{demo.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View className="items-center mt-8">
                <Text className="text-gray-500">
                    Belum punya akun?{" "}
                    <Text
                        className="text-blue-600 font-bold hover:underline cursor-pointer"
                        onPress={() => router.push("/(auth)/signup")}
                    >
                        Daftar Sekarang
                    </Text>
                </Text>
            </View>
        </View>
    );
};
