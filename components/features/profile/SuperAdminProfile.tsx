import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, Platform, Switch, TextInput, ScrollView } from 'react-native';
import { useAuth } from '../../../hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../../components/ui/Card';
import { usePreferences } from '../../../hooks/usePreferences';
import { useNetworkMode } from '../../../hooks/useNetworkMode';
import { useRouter } from 'expo-router';
import Button from '../../../components/ui/Button';

interface SuperAdminProfileProps {
    onChangePassword: () => void;
}

function SectionHeader({ title }: { title: string }) {
    return (
        <Text className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 px-1 mt-2">
            {title}
        </Text>
    );
}

function SettingItem({
    icon,
    iconColor,
    iconBg,
    label,
    value,
    onPress,
    rightElement,
    isLast = false,
}: {
    icon: keyof typeof Ionicons.glyphMap;
    iconColor: string;
    iconBg: string;
    label: string;
    value?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
    isLast?: boolean;
}) {
    const Content = (
        <View className={`flex-row items-center px-4 py-4 ${!isLast ? 'border-b border-gray-100' : ''}`}>
            <View className={`w-10 h-10 rounded-full ${iconBg} items-center justify-center mr-4`}>
                <Ionicons name={icon} size={20} color={iconColor} />
            </View>
            <View className="flex-1">
                <Text className="text-base font-medium text-gray-900">{label}</Text>
                {value && <Text className="text-sm text-gray-500 mt-0.5">{value}</Text>}
            </View>
            {rightElement || <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />}
        </View>
    );

    if (onPress) {
        return (
            <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
                {Content}
            </TouchableOpacity>
        );
    }
    return Content;
}

export function SuperAdminProfile({ onChangePassword }: SuperAdminProfileProps) {
    const { user, signOut, isEdgeMode } = useAuth();
    const router = useRouter();
    const { setDarkMode, isEnglish, setLanguage, t } = usePreferences();
    const { currentMode, localIp, toggleMode, setLocalIpAddress, canUseLocal, isReady } = useNetworkMode();

    const [localIpDraft, setLocalIpDraft] = useState(localIp ?? '');
    const [ipSaving, setIpSaving] = useState(false);
    const [modePending, setModePending] = useState(false);

    const isLocalMode = currentMode === 'LOCAL';
    const canSaveLocalIp = localIpDraft.trim().length > 0;
    const networkToggleDisabled = !canUseLocal || !isReady || modePending;
    const networkModeLabel = currentMode === 'LOCAL' ? t('network.modeValue.local') : t('network.modeValue.cloud');

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

    const handleLanguageToggle = async (value: boolean) => {
        try {
            await setLanguage(value ? 'en' : 'id');
        } catch (error) {
            console.warn('[settings] failed to toggle language', error);
        }
    };

    const handleToggleNetworkMode = async () => {
        if (!canUseLocal || !isReady || modePending) return;
        if (currentMode === 'CLOUD') {
            const targetIp = (localIpDraft || localIp || '').trim();
            if (!targetIp) {
                Alert.alert(t('network.requireIpAlertTitle'), t('network.requireIpAlertMessage'));
                return;
            }
        }

        setModePending(true);
        try {
            await toggleMode();
        } catch (error: any) {
            console.warn('[settings] toggle network mode failed', error);
            Alert.alert(t('network.toggleErrorTitle'), error?.message ?? t('network.toggleErrorMessage'));
        } finally {
            setModePending(false);
        }
    };

    const handleSaveLocalIp = async () => {
        const trimmed = localIpDraft.trim();
        if (!trimmed) {
            Alert.alert(t('network.requireIpAlertTitle'), t('network.requireIpAlertMessage'));
            return;
        }

        setIpSaving(true);
        try {
            await setLocalIpAddress(trimmed);
            Alert.alert(t('network.saveSuccessTitle'), t('network.saveSuccessMessage'));
        } catch (error: any) {
            console.warn('[settings] save local ip failed', error);
            Alert.alert(t('network.saveErrorTitle'), error?.message ?? t('network.saveErrorTitle'));
        } finally {
            setIpSaving(false);
        }
    };

    return (
        <View className="space-y-6">
            {/* Header Profile - Purple/Indigo Theme */}
            <Card className="p-0 overflow-hidden">
                <View className="bg-indigo-600 p-6 items-center">
                    <View className="w-24 h-24 bg-white rounded-full items-center justify-center mb-4 border-4 border-indigo-400">
                        <Ionicons name="shield-checkmark" size={40} color="#4F46E5" />
                    </View>
                    <Text className="text-xl font-bold text-white text-center">
                        {user?.fullName || user?.username}
                    </Text>
                    <Text className="text-indigo-100 text-center font-medium opacity-90">
                        SUPER ADMIN
                    </Text>
                    {user?.username && (
                        <Text className="text-indigo-200 text-sm mt-1">@{user.username}</Text>
                    )}
                </View>

                <View className="p-4 bg-white">
                    <View className="flex-row items-center justify-between py-2">
                        <View className="flex-row items-center gap-3">
                            <Ionicons name="key" size={20} color="#64748B" />
                            <Text className="text-gray-600">Akses</Text>
                        </View>
                        <View className="bg-indigo-50 px-3 py-1 rounded-full">
                            <Text className="text-indigo-700 font-semibold text-xs">FULL ACCESS</Text>
                        </View>
                    </View>
                </View>
            </Card>

            {/* Application Settings */}
            <View>
                <SectionHeader title={t('settings.applicationSectionTitle')} />
                <Card className="p-0 overflow-hidden">
                    <SettingItem
                        icon="moon"
                        iconColor="#7C3AED"
                        iconBg="bg-purple-50"
                        label={t('settings.darkMode')}
                        rightElement={
                            <Switch
                                value={false}
                                trackColor={{ false: '#E5E7EB', true: '#C4B5FD' }}
                                thumbColor="#F3F4F6"
                                disabled
                            />
                        }
                    />
                    <SettingItem
                        icon="language"
                        iconColor="#059669"
                        iconBg="bg-green-50"
                        label={t('settings.languageToggle')}
                        value={isEnglish ? 'English' : 'Bahasa Indonesia'}
                        isLast
                        rightElement={
                            <Switch
                                value={isEnglish}
                                onValueChange={handleLanguageToggle}
                                trackColor={{ false: '#E5E7EB', true: '#6EE7B7' }}
                                thumbColor={isEnglish ? '#10B981' : '#F3F4F6'}
                            />
                        }
                    />
                </Card>
            </View>

            {/* Network Settings - Only if Local Mode Available */}
            {canUseLocal && (
                <View>
                    <SectionHeader title={t('network.sectionTitle')} />
                    <Card className="p-0 overflow-hidden">
                        <SettingItem
                            icon="wifi"
                            iconColor="#0EA5E9"
                            iconBg="bg-sky-50"
                            label={t('network.localToggle')}
                            value={networkModeLabel}
                            rightElement={
                                <Switch
                                    value={isLocalMode}
                                    onValueChange={handleToggleNetworkMode}
                                    disabled={networkToggleDisabled}
                                    trackColor={{ false: '#E5E7EB', true: '#7DD3FC' }}
                                    thumbColor={currentMode === 'LOCAL' ? '#0EA5E9' : '#F3F4F6'}
                                />
                            }
                        />
                        <View className="px-4 pt-4 pb-5 border-t border-gray-100">
                            <Text className="text-sm font-semibold text-gray-900">{t('network.localIpLabel')}</Text>
                            <TextInput
                                value={localIpDraft}
                                onChangeText={setLocalIpDraft}
                                placeholder={t('network.localIpPlaceholder')}
                                placeholderTextColor="#9CA3AF"
                                autoCapitalize="none"
                                autoCorrect={false}
                                keyboardType="numbers-and-punctuation"
                                editable={isLocalMode}
                                className={`mt-2 border border-gray-200 rounded-xl px-4 py-3 text-base ${isLocalMode ? 'text-gray-900 bg-white' : 'text-gray-400 bg-gray-50'}`}
                            />
                            <Text className="text-xs text-gray-500 mt-2">{t('network.localIpDescription')}</Text>
                            <Button
                                title={t('network.saveIpButton')}
                                onPress={handleSaveLocalIp}
                                loading={ipSaving}
                                disabled={!canSaveLocalIp || ipSaving}
                                className="mt-3"
                            />
                        </View>
                    </Card>
                </View>
            )}

            {/* Server Sync - Not in Edge Mode */}
            {!isEdgeMode && (
                <View>
                    <SectionHeader title="Sinkronisasi Server" />
                    <Card className="p-0 overflow-hidden">
                        <SettingItem
                            icon="key-outline"
                            iconColor="#2563EB"
                            iconBg="bg-blue-50"
                            label="Kelola API Keys"
                            onPress={() => router.push('/(app)/api-keys')}
                            isLast
                        />
                    </Card>
                </View>
            )}

            {/* Account Settings */}
            <View>
                <SectionHeader title={t('settings.accountSectionTitle')} />
                <Card className="p-0 overflow-hidden">
                    <SettingItem
                        icon="lock-closed-outline"
                        iconColor="#EA580C"
                        iconBg="bg-orange-50"
                        label={t('settings.changePassword')}
                        onPress={onChangePassword}
                    />
                    <SettingItem
                        icon="log-out-outline"
                        iconColor="#DC2626"
                        iconBg="bg-red-50"
                        label={t('settings.signOut')}
                        onPress={handleSignOut}
                        isLast
                    />
                </Card>
            </View>

            <View className="items-center mt-2 mb-6">
                <Text className="text-xs text-gray-400">Versi Aplikasi 1.0.0</Text>
            </View>
        </View>
    );
}
