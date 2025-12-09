/**
 * TwoFactorSettings Component
 * 
 * Provides 2FA enable/disable and configuration UI.
 * Can be embedded in any profile/settings page.
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Linking,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Button from '../../ui/Button';
import TextInput from '../../ui/TextInput';
import { api } from '../../../services/api';
import { useAuth } from '../../../hooks/useAuth';

interface TwoFactorStatus {
    is_enabled: boolean;
    is_mandatory: boolean;
    can_disable: boolean;
}

interface SetupResponse {
    secret: string;
    qr_code_uri: string;
}

export function TwoFactorSettings() {
    const { user } = useAuth();
    const [status, setStatus] = useState<TwoFactorStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [showSetupModal, setShowSetupModal] = useState(false);
    const [showDisableModal, setShowDisableModal] = useState(false);

    // Setup state
    const [setupData, setSetupData] = useState<SetupResponse | null>(null);
    const [setupLoading, setSetupLoading] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [verifying, setVerifying] = useState(false);

    // Siswa tidak bisa menggunakan 2FA
    const isSiswa = user?.role === 'siswa';

    const fetchStatus = async () => {
        if (isSiswa) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const data = await api('auth/2fa/status');
            setStatus(data);
        } catch (error) {
            console.warn('[2fa] failed to fetch status', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
    }, []);

    const handleStartSetup = async () => {
        try {
            setSetupLoading(true);
            const data = await api('auth/2fa/setup', { method: 'POST' });
            setSetupData(data);
            setShowSetupModal(true);
        } catch (error: any) {
            Alert.alert('Error', error?.message || 'Gagal memulai setup 2FA');
        } finally {
            setSetupLoading(false);
        }
    };

    const handleVerifyAndEnable = async () => {
        if (otpCode.length !== 6) return;

        try {
            setVerifying(true);
            await api('auth/2fa/verify', {
                method: 'POST',
                body: { otp_code: otpCode },
            });
            Alert.alert('Berhasil', '2FA berhasil diaktifkan!');
            setShowSetupModal(false);
            setSetupData(null);
            setOtpCode('');
            fetchStatus();
        } catch (error: any) {
            Alert.alert('Error', error?.message || 'Kode OTP tidak valid');
            setOtpCode('');
        } finally {
            setVerifying(false);
        }
    };

    const handleDisable = async () => {
        if (otpCode.length !== 6) return;

        try {
            setVerifying(true);
            await api('auth/2fa/disable', {
                method: 'POST',
                body: { otp_code: otpCode },
            });
            Alert.alert('Berhasil', '2FA berhasil dinonaktifkan');
            setShowDisableModal(false);
            setOtpCode('');
            fetchStatus();
        } catch (error: any) {
            Alert.alert('Error', error?.message || 'Kode OTP tidak valid');
            setOtpCode('');
        } finally {
            setVerifying(false);
        }
    };

    const openAuthenticator = () => {
        if (setupData?.qr_code_uri) {
            Linking.openURL(setupData.qr_code_uri).catch(() => {
                if (Platform.OS === 'web') {
                    alert('Gunakan aplikasi authenticator di ponsel untuk scan QR code atau masukkan kode manual.');
                } else {
                    Alert.alert('Info', 'Tidak dapat membuka aplikasi authenticator. Silakan masukkan kode manual.');
                }
            });
        }
    };

    // Siswa tidak ditampilkan 2FA settings
    if (isSiswa) {
        return null;
    }

    if (loading) {
        return (
            <View className="bg-white rounded-2xl p-6 mb-4 border border-gray-100">
                <View className="flex-row items-center">
                    <ActivityIndicator size="small" color="#3B82F6" />
                    <Text className="text-gray-500 ml-3">Memuat status 2FA...</Text>
                </View>
            </View>
        );
    }

    return (
        <>
            {/* 2FA Status Card */}
            <View className="bg-white rounded-2xl p-6 mb-4 border border-gray-100 shadow-sm">
                <View className="flex-row items-center mb-4">
                    <View className="w-12 h-12 bg-blue-50 rounded-full items-center justify-center mr-4">
                        <Ionicons name="shield-checkmark" size={24} color="#3B82F6" />
                    </View>
                    <View className="flex-1">
                        <Text className="text-lg font-bold text-gray-900">Autentikasi 2 Faktor</Text>
                        <Text className="text-sm text-gray-500">
                            {status?.is_mandatory ? 'Wajib untuk role Anda' : 'Keamanan tambahan'}
                        </Text>
                    </View>
                </View>

                {/* Status Badge */}
                <View className={`flex-row items-center p-3 rounded-xl mb-4 ${status?.is_enabled ? 'bg-green-50' : 'bg-amber-50'
                    }`}>
                    <Ionicons
                        name={status?.is_enabled ? 'checkmark-circle' : 'warning'}
                        size={20}
                        color={status?.is_enabled ? '#059669' : '#D97706'}
                    />
                    <Text className={`ml-2 font-semibold ${status?.is_enabled ? 'text-green-700' : 'text-amber-700'
                        }`}>
                        {status?.is_enabled ? '2FA Aktif' : '2FA Tidak Aktif'}
                    </Text>
                </View>

                {/* Action Button */}
                {status?.is_enabled ? (
                    status?.can_disable && (
                        <Button
                            title="Nonaktifkan 2FA"
                            variant="outline"
                            onPress={() => setShowDisableModal(true)}
                            fullWidth
                        />
                    )
                ) : (
                    <Button
                        title={setupLoading ? 'Mempersiapkan...' : 'Aktifkan 2FA'}
                        onPress={handleStartSetup}
                        loading={setupLoading}
                        fullWidth
                    />
                )}

                {status?.is_mandatory && !status?.is_enabled && (
                    <View className="mt-4 p-3 bg-red-50 rounded-xl flex-row items-start">
                        <Ionicons name="alert-circle" size={20} color="#DC2626" />
                        <Text className="text-red-700 text-sm ml-2 flex-1">
                            2FA wajib untuk role Anda. Segera aktifkan untuk keamanan akun.
                        </Text>
                    </View>
                )}
            </View>

            {/* Setup Modal */}
            <Modal visible={showSetupModal} animationType="slide" transparent>
                <Pressable
                    className="flex-1 bg-black/60 justify-end"
                    onPress={() => {
                        setShowSetupModal(false);
                        setSetupData(null);
                        setOtpCode('');
                    }}
                >
                    <Pressable
                        className="bg-white rounded-t-[32px] max-h-[90%] shadow-2xl"
                        onPress={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <View className="flex-row justify-between items-center px-6 py-5 border-b border-gray-100">
                            <Text className="text-xl font-bold text-gray-900">Setup 2FA</Text>
                            <TouchableOpacity
                                onPress={() => {
                                    setShowSetupModal(false);
                                    setSetupData(null);
                                    setOtpCode('');
                                }}
                                className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center"
                            >
                                <Ionicons name="close" size={20} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView className="px-6 py-6" contentContainerStyle={{ paddingBottom: 24 }}>
                            {/* Instructions */}
                            <View className="bg-blue-50 p-4 rounded-2xl mb-6 flex-row items-start">
                                <Ionicons name="information-circle" size={24} color="#2563EB" />
                                <View className="ml-3 flex-1">
                                    <Text className="text-blue-900 font-bold text-sm mb-1">Petunjuk</Text>
                                    <Text className="text-blue-700 text-xs leading-5">
                                        1. Install Google Authenticator atau Authy di ponsel{'\n'}
                                        2. Scan QR code atau masukkan kode manual{'\n'}
                                        3. Masukkan kode 6 digit dari aplikasi
                                    </Text>
                                </View>
                            </View>

                            {/* QR Code Section */}
                            {setupData && (
                                <>
                                    <View className="bg-gray-50 rounded-2xl p-6 items-center mb-4">
                                        <View className="bg-white p-4 rounded-xl mb-4 border border-gray-200">
                                            <Ionicons name="qr-code" size={100} color="#374151" />
                                        </View>
                                        <Text className="text-sm text-gray-600 text-center mb-2">
                                            Scan QR Code di aplikasi authenticator
                                        </Text>
                                        <TouchableOpacity
                                            onPress={openAuthenticator}
                                            className="bg-blue-100 px-4 py-2 rounded-lg"
                                        >
                                            <Text className="text-blue-700 font-semibold text-sm">
                                                Buka Authenticator
                                            </Text>
                                        </TouchableOpacity>
                                    </View>

                                    {/* Manual Code */}
                                    <View className="bg-gray-50 rounded-xl p-4 mb-6">
                                        <Text className="text-sm font-medium text-gray-700 mb-2">
                                            Atau masukkan kode manual:
                                        </Text>
                                        <View className="bg-white border border-gray-200 rounded-lg p-3">
                                            <Text className="font-mono text-center text-lg tracking-widest text-gray-900">
                                                {setupData.secret}
                                            </Text>
                                        </View>
                                    </View>
                                </>
                            )}

                            {/* OTP Input */}
                            <View className="mb-6">
                                <Text className="text-sm font-semibold text-gray-700 mb-2">
                                    Masukkan Kode OTP (6 digit)
                                </Text>
                                <TextInput
                                    placeholder="000000"
                                    value={otpCode}
                                    onChangeText={(text: string) => {
                                        const cleaned = text.replace(/\D/g, '').slice(0, 6);
                                        setOtpCode(cleaned);
                                    }}
                                    keyboardType="number-pad"
                                    maxLength={6}
                                    className="text-center text-2xl tracking-[0.5em] font-mono h-14"
                                />
                            </View>

                            <Button
                                title={verifying ? 'Memverifikasi...' : 'Verifikasi & Aktifkan'}
                                onPress={handleVerifyAndEnable}
                                disabled={otpCode.length !== 6 || verifying}
                                loading={verifying}
                                fullWidth
                                size="lg"
                            />
                        </ScrollView>
                    </Pressable>
                </Pressable>
            </Modal>

            {/* Disable Modal */}
            <Modal visible={showDisableModal} animationType="slide" transparent>
                <Pressable
                    className="flex-1 bg-black/60 justify-end"
                    onPress={() => {
                        setShowDisableModal(false);
                        setOtpCode('');
                    }}
                >
                    <Pressable
                        className="bg-white rounded-t-[32px] shadow-2xl"
                        onPress={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <View className="flex-row justify-between items-center px-6 py-5 border-b border-gray-100">
                            <Text className="text-xl font-bold text-gray-900">Nonaktifkan 2FA</Text>
                            <TouchableOpacity
                                onPress={() => {
                                    setShowDisableModal(false);
                                    setOtpCode('');
                                }}
                                className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center"
                            >
                                <Ionicons name="close" size={20} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        <View className="px-6 py-6">
                            {/* Warning */}
                            <View className="bg-red-50 p-4 rounded-2xl mb-6 flex-row items-start">
                                <Ionicons name="warning" size={24} color="#DC2626" />
                                <View className="ml-3 flex-1">
                                    <Text className="text-red-900 font-bold text-sm mb-1">Peringatan</Text>
                                    <Text className="text-red-700 text-xs leading-5">
                                        Menonaktifkan 2FA akan mengurangi keamanan akun Anda. Pastikan Anda yakin.
                                    </Text>
                                </View>
                            </View>

                            {/* OTP Input */}
                            <View className="mb-6">
                                <Text className="text-sm font-semibold text-gray-700 mb-2">
                                    Masukkan Kode OTP untuk konfirmasi
                                </Text>
                                <TextInput
                                    placeholder="000000"
                                    value={otpCode}
                                    onChangeText={(text: string) => {
                                        const cleaned = text.replace(/\D/g, '').slice(0, 6);
                                        setOtpCode(cleaned);
                                    }}
                                    keyboardType="number-pad"
                                    maxLength={6}
                                    className="text-center text-2xl tracking-[0.5em] font-mono h-14"
                                />
                            </View>

                            <Button
                                title={verifying ? 'Memproses...' : 'Nonaktifkan 2FA'}
                                onPress={handleDisable}
                                disabled={otpCode.length !== 6 || verifying}
                                loading={verifying}
                                fullWidth
                                size="lg"
                                variant="outline"
                            />
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
        </>
    );
}
