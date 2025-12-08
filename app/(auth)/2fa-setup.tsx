import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Image,
    Platform,
    Text,
    View,
    Alert,
    Linking,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import Button from "../../components/ui/Button";
import TextInput from "../../components/ui/TextInput";
import Icon from "../../components/ui/Icon";
import { useAuth } from "../../hooks/useAuth";
import {
    setup2FAInitial,
    verify2FAInitial,
    type TwoFactorSetupResponse,
} from "../../services/auth";

export default function TwoFactorSetup() {
    const router = useRouter();
    const { pending2FA, clearPending2FA, user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [verifying, setVerifying] = useState(false);
    const [setupData, setSetupData] = useState<TwoFactorSetupResponse | null>(null);
    const [otpCode, setOtpCode] = useState("");
    const [error, setError] = useState<string | null>(null);

    // Redirect if no pending 2FA or already logged in
    useEffect(() => {
        if (user) {
            router.replace("/(app)");
            return;
        }

        if (!pending2FA) {
            router.replace("/(auth)");
            return;
        }

        // Only setup if initial setup is required
        if (pending2FA.status === "2FA_SETUP_REQUIRED") {
            handleSetup();
        } else {
            // For 2FA_REQUIRED, go back to login to show OTP input
            setLoading(false);
        }
    }, [pending2FA, user]);

    const handleSetup = async () => {
        if (!pending2FA) return;

        try {
            setLoading(true);
            setError(null);
            const data = await setup2FAInitial(pending2FA.tempToken);
            setSetupData(data);
        } catch (e: any) {
            setError(e?.message || "Gagal setup 2FA");
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async () => {
        if (!pending2FA || !otpCode.trim()) return;

        try {
            setVerifying(true);
            setError(null);

            if (pending2FA.status === "2FA_SETUP_REQUIRED") {
                // Initial setup - verify and enable 2FA
                await verify2FAInitial(pending2FA.tempToken, otpCode.trim());
            } else {
                // Regular 2FA verification - use verify2FA from context
                // This path shouldn't normally be hit since 2FA_REQUIRED
                // should show OTP input on login page directly
                const { verify2FA } = await import("../../services/auth");
                await verify2FA(pending2FA.tempToken, otpCode.trim());
            }

            // Clear pending state and redirect
            clearPending2FA();
            router.replace("/(app)");
        } catch (e: any) {
            setError(e?.message || "Kode OTP tidak valid");
            setOtpCode("");
        } finally {
            setVerifying(false);
        }
    };

    const handleCancel = () => {
        clearPending2FA();
        router.replace("/(auth)");
    };

    const openAuthenticator = () => {
        if (setupData?.qr_code_uri) {
            Linking.openURL(setupData.qr_code_uri).catch(() => {
                Alert.alert(
                    "Info",
                    "Tidak dapat membuka aplikasi authenticator. Silakan scan QR code atau masukkan kode manual."
                );
            });
        }
    };

    if (loading) {
        return (
            <View className="flex-1 bg-gray-50 items-center justify-center">
                <ActivityIndicator size="large" color="#2563EB" />
                <Text className="text-gray-500 mt-4">Menyiapkan 2FA...</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-50">
            <View className={`flex-1 ${Platform.OS === "web" ? "items-center justify-center p-8" : "justify-center p-6"}`}>
                <Animated.View
                    entering={FadeInUp.delay(200).duration(800)}
                    className={`bg-white rounded-3xl shadow-lg border border-gray-100 p-8 ${Platform.OS === "web" ? "max-w-lg w-full" : ""}`}
                >
                    {/* Header */}
                    <View className="items-center mb-6">
                        <View className="w-16 h-16 bg-blue-100 rounded-2xl items-center justify-center mb-4">
                            <Icon name="shield-checkmark" size={32} color="#2563EB" />
                        </View>
                        <Text className="text-2xl font-bold text-gray-900 text-center">
                            Setup Autentikasi 2 Faktor
                        </Text>
                        <Text className="text-gray-500 text-center mt-2">
                            {pending2FA?.status === "2FA_SETUP_REQUIRED"
                                ? "Role Anda wajib mengaktifkan 2FA untuk keamanan"
                                : "Masukkan kode OTP dari aplikasi authenticator"}
                        </Text>
                    </View>

                    {/* Error Message */}
                    {error && (
                        <Animated.View
                            entering={FadeInDown}
                            className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6"
                        >
                            <View className="flex-row items-center gap-3">
                                <Icon name="alert-circle" size={20} color="#DC2626" />
                                <Text className="text-red-700 flex-1">{error}</Text>
                            </View>
                        </Animated.View>
                    )}

                    {/* QR Code Section - Only for initial setup */}
                    {setupData && pending2FA?.status === "2FA_SETUP_REQUIRED" && (
                        <Animated.View
                            entering={FadeInDown.delay(300)}
                            className="items-center mb-6"
                        >
                            {/* QR Code Placeholder - Using URI text since we can't render QR in React Native easily */}
                            <View className="bg-white border-2 border-dashed border-gray-300 rounded-2xl p-6 items-center mb-4">
                                <View className="bg-gray-100 p-4 rounded-xl mb-4">
                                    <Icon name="qr-code" size={80} color="#374151" />
                                </View>
                                <Text className="text-sm text-gray-600 text-center mb-2">
                                    Scan QR Code di aplikasi authenticator
                                </Text>
                                <Text className="text-xs text-gray-400 text-center">
                                    Google Authenticator, Authy, atau aplikasi sejenis
                                </Text>
                            </View>

                            {/* Manual Entry Option */}
                            <View className="bg-gray-50 rounded-xl p-4 w-full">
                                <Text className="text-sm font-medium text-gray-700 mb-2">
                                    Atau masukkan kode manual:
                                </Text>
                                <View className="bg-white border border-gray-200 rounded-lg p-3">
                                    <Text className="font-mono text-center text-lg tracking-wider text-gray-900">
                                        {setupData.secret}
                                    </Text>
                                </View>
                            </View>

                            {/* Open Authenticator Button */}
                            <Button
                                title="Buka Aplikasi Authenticator"
                                variant="outline"
                                onPress={openAuthenticator}
                                className="mt-4 w-full"
                            />
                        </Animated.View>
                    )}

                    {/* OTP Input */}
                    <Animated.View
                        entering={FadeInDown.delay(setupData ? 500 : 300)}
                        className="mb-6"
                    >
                        <Text className="text-sm font-semibold text-gray-700 mb-2">
                            Masukkan Kode OTP (6 digit)
                        </Text>
                        <TextInput
                            placeholder="000000"
                            value={otpCode}
                            onChangeText={(text) => {
                                // Only allow numbers, max 6 digits
                                const cleaned = text.replace(/\D/g, "").slice(0, 6);
                                setOtpCode(cleaned);
                            }}
                            keyboardType="number-pad"
                            maxLength={6}
                            className="text-center text-2xl tracking-[0.5em] font-mono h-14"
                            autoFocus
                        />
                    </Animated.View>

                    {/* Action Buttons */}
                    <View className="gap-3">
                        <Button
                            title={verifying ? "Memverifikasi..." : "Verifikasi & Masuk"}
                            onPress={handleVerify}
                            disabled={otpCode.length !== 6 || verifying}
                            size="lg"
                            className="shadow-lg shadow-blue-600/20"
                        />
                        <Button
                            title="Batal"
                            variant="outline"
                            onPress={handleCancel}
                            disabled={verifying}
                        />
                    </View>

                    {/* Help Text */}
                    <View className="mt-6 pt-6 border-t border-gray-100">
                        <View className="flex-row items-start gap-3">
                            <Icon name="information-circle" size={20} color="#6B7280" />
                            <Text className="text-sm text-gray-500 flex-1">
                                Kode OTP berubah setiap 30 detik. Pastikan waktu perangkat Anda sinkron.
                            </Text>
                        </View>
                    </View>
                </Animated.View>
            </View>
        </View>
    );
}
