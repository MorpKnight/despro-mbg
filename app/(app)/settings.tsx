import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/ui/Button';
import type { TranslationKey } from '../../context/PreferencesContext';
import { useAuth } from '../../hooks/useAuth';
import { useNetworkMode } from '../../hooks/useNetworkMode';
import { usePreferences } from '../../hooks/usePreferences';
import { useResponsive } from '../../hooks/useResponsive';
import { changeMyPassword, updateMyProfile } from '../../services/profile';
import { CateringProfile } from '../../components/features/profile/CateringProfile';
import { StudentProfile } from '../../components/features/profile/StudentProfile';
import { SchoolProfile } from '../../components/features/profile/SchoolProfile';
import { DinkesProfile } from '../../components/features/profile/DinkesProfile';
import { SuperAdminProfile } from '../../components/features/profile/SuperAdminProfile';

function InfoRow({ label, value, icon }: { label: string; value: string; icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <View className="flex-row items-start mb-4">
      <View className="w-8 h-8 rounded-full bg-blue-50 items-center justify-center mr-3 mt-0.5">
        <Ionicons name={icon} size={16} color="#3B82F6" />
      </View>
      <View className="flex-1">
        <Text className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">{label}</Text>
        <Text className="text-base text-gray-900 leading-6">{value}</Text>
      </View>
    </View>
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

function SectionHeader({ title }: { title: string }) {
  return (
    <Text className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 px-4 mt-6">
      {title}
    </Text>
  );
}

function getAccountStatusKey(status?: string) {
  switch (status) {
    case 'active':
      return 'statuses.account.active' as TranslationKey;
    case 'pending_confirmation':
      return 'statuses.account.pending_confirmation' as TranslationKey;
    case 'suspended':
      return 'statuses.account.suspended' as TranslationKey;
    default:
      return 'statuses.account.inactive' as TranslationKey;
  }
}

export default function SettingsScreen() {
  const { user, signOut, refreshProfile, isEdgeMode } = useAuth();
  const router = useRouter();
  const { setDarkMode, isEnglish, setLanguage, t } = usePreferences();
  const { isMobile } = useResponsive();
  const { currentMode, localIp, toggleMode, setLocalIpAddress, canUseLocal, isReady } = useNetworkMode();

  const [isEditProfileVisible, setIsEditProfileVisible] = useState(false);
  const [isChangePasswordVisible, setIsChangePasswordVisible] = useState(false);

  const [fullNameInput, setFullNameInput] = useState(user?.fullName ?? '');
  const [healthOfficeAreaInput, setHealthOfficeAreaInput] = useState(user?.healthOfficeArea ?? '');
  const [profileLoading, setProfileLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [localIpDraft, setLocalIpDraft] = useState(localIp ?? '');
  const [ipSaving, setIpSaving] = useState(false);
  const [modePending, setModePending] = useState(false);

  const placeholderColor = '#9CA3AF';
  const canEditHealthOffice = user?.role === 'admin_dinkes';
  // isAdmin logic simplified: canSeeNetworkSection usage now delegated to components or handled differently
  const canSeeNetworkSection = user?.role === 'admin_sekolah' || user?.role === 'admin_catering';
  // const networkToggleDisabled = !canUseLocal || !isReady || modePending; // Moved to components
  // const isLocalMode = currentMode === 'LOCAL'; // Moved to components
  // const canSaveLocalIp = localIpDraft.trim().length > 0; // Moved to components


  useEffect(() => {
    if (isEditProfileVisible) {
      setFullNameInput(user?.fullName ?? '');
      setHealthOfficeAreaInput(user?.healthOfficeArea ?? '');
    }
  }, [isEditProfileVisible, user?.fullName, user?.healthOfficeArea]);

  useEffect(() => {
    setLocalIpDraft(localIp ?? '');
  }, [localIp]);

  const roleLabel = useMemo(() => {
    if (!user?.role) return t('roles.siswa');
    const key = `roles.${user.role}` as TranslationKey;
    return t(key);
  }, [user?.role, t]);

  const accountStatusLabel = useMemo(
    () => t(getAccountStatusKey(user?.accountStatus)),
    [user?.accountStatus, t],
  );

  const networkModeLabel = useMemo(
    () => (currentMode === 'LOCAL' ? t('network.modeValue.local') : t('network.modeValue.cloud')),
    [currentMode, t],
  );

  const schoolDisplay = useMemo(() => {
    if (user?.sekolah?.name) {
      const location = user.sekolah.administrativeAreaLevel2 ?? user.sekolah.administrativeAreaLevel1;
      return location ? `${user.sekolah.name} • ${location}` : user.sekolah.name;
    }
    if (user?.schoolId) {
      return `ID: ${user.schoolId}`;
    }
    return t('profileModal.noData');
  }, [user?.sekolah?.name, user?.sekolah?.administrativeAreaLevel2, user?.sekolah?.administrativeAreaLevel1, user?.schoolId, t]);

  const cateringDisplay = useMemo(() => {
    if (user?.catering?.name) {
      const location = user.catering.administrativeAreaLevel2 ?? user.catering.administrativeAreaLevel1;
      return location ? `${user.catering.name} • ${location}` : user.catering.name;
    }
    if (user?.cateringId) {
      return `ID: ${user.cateringId}`;
    }
    return t('profileModal.noData');
  }, [user?.catering?.name, user?.catering?.administrativeAreaLevel2, user?.catering?.administrativeAreaLevel1, user?.cateringId, t]);

  const dinkesDisplay = useMemo(() => {
    const area = user?.healthOfficeArea?.trim();
    return area && area.length > 0 ? area : t('profileModal.noData');
  }, [user?.healthOfficeArea, t]);

  const fullNamePlaceholder = useMemo(
    () => t('profileModal.fullNamePlaceholder', { value: user?.fullName || t('profileModal.emptyValue') }),
    [t, user?.fullName],
  );

  const healthOfficePlaceholder = useMemo(
    () =>
      t('profileModal.healthOfficeAreaPlaceholder', {
        value: user?.healthOfficeArea || t('profileModal.emptyValue'),
      }),
    [t, user?.healthOfficeArea],
  );

  const versionLabel = useMemo(() => t('settings.versionLabel', { version: '1.0.0' }), [t]);

  const handleDarkModeToggle = async (_value: boolean) => {
    try {
      await setDarkMode(false);
    } catch (error) {
      console.warn('[settings] failed to toggle dark mode', error);
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

  const handleUpdateProfile = async () => {
    const trimmedName = fullNameInput.trim();
    const trimmedArea = healthOfficeAreaInput.trim();

    const updates: { fullName?: string | null; healthOfficeArea?: string | null } = {};
    let hasChanges = false;

    if (trimmedName !== (user?.fullName ?? '')) {
      updates.fullName = trimmedName.length ? trimmedName : null;
      hasChanges = true;
    }

    if (canEditHealthOffice && trimmedArea !== (user?.healthOfficeArea ?? '')) {
      updates.healthOfficeArea = trimmedArea.length ? trimmedArea : null;
      hasChanges = true;
    }

    if (!hasChanges) {
      Alert.alert(t('profileModal.noChangesTitle'), t('profileModal.noChangesMessage'));
      return;
    }

    try {
      setProfileLoading(true);
      await updateMyProfile(updates);
      await refreshProfile();
      Alert.alert(t('profileModal.successTitle'), t('profileModal.successMessage'));
      setIsEditProfileVisible(false);
    } catch (error: any) {
      console.warn('[settings] update profile failed', error);
      Alert.alert(t('profileModal.errorTitle'), error?.message ?? t('profileModal.errorMessage'));
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async () => {
    const trimmedCurrent = currentPassword.trim();
    const trimmedNew = newPassword.trim();
    const trimmedConfirm = confirmPassword.trim();

    if (trimmedNew !== trimmedConfirm) {
      Alert.alert(t('passwordModal.mismatchTitle'), t('passwordModal.mismatchMessage'));
      return;
    }

    if (trimmedNew.length < 8) {
      Alert.alert(t('passwordModal.shortTitle'), t('passwordModal.shortMessage'));
      return;
    }

    try {
      setPasswordLoading(true);
      await changeMyPassword(trimmedCurrent, trimmedNew);
      Alert.alert(t('passwordModal.successTitle'), t('passwordModal.successMessage'));
      setIsChangePasswordVisible(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.warn('[settings] change password failed', error);
      Alert.alert(t('passwordModal.errorTitle'), error?.message ?? t('passwordModal.errorMessage'));
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Role-based Profile Rendering */}
      {user?.role === 'admin_catering' ? (
        <>
          <SafeAreaView className="flex-1 bg-[#f5f7fb]" edges={['top']}>
            <View className="flex-row items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
              <View>
                <Text className="text-xl font-bold text-gray-900">Profil Catering</Text>
                <Text className="text-sm text-gray-500">Kelola akun katering</Text>
              </View>
            </View>
            <ScrollView className="flex-1 px-6 pt-6" contentContainerStyle={{ paddingBottom: 24 }}>
              <CateringProfile onChangePassword={() => setIsChangePasswordVisible(true)} />
            </ScrollView>
          </SafeAreaView>
          {/* Change Password Modal (shared) */}
          <Modal visible={isChangePasswordVisible} animationType="slide" transparent>
            <Pressable
              className="flex-1 bg-black/60 justify-end"
              onPress={() => setIsChangePasswordVisible(false)}
            >
              <Pressable
                className="bg-white rounded-t-[32px] h-[75%] shadow-2xl"
                onPress={(e) => e.stopPropagation()}
              >
                <View className="flex-row justify-between items-center px-6 py-5 border-b border-gray-100">
                  <Text className="text-xl font-bold text-gray-900">{t('passwordModal.title')}</Text>
                  <TouchableOpacity
                    onPress={() => setIsChangePasswordVisible(false)}
                    className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center"
                  >
                    <Ionicons name="close" size={20} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                <ScrollView className="flex-1 px-6 py-6">
                  <View className="bg-orange-50 p-4 rounded-2xl mb-6 flex-row items-start">
                    <Ionicons name="shield-checkmark" size={24} color="#EA580C" />
                    <View className="ml-3 flex-1">
                      <Text className="text-orange-900 font-bold text-sm mb-1">Keamanan Akun</Text>
                      <Text className="text-orange-700 text-xs leading-4">{t('passwordModal.hint')}</Text>
                    </View>
                  </View>

                  <View className="gap-5">
                    <View>
                      <Text className="text-sm font-medium text-gray-700 mb-2">{t('passwordModal.currentLabel')}</Text>
                      <TextInput
                        className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-base text-gray-900"
                        value={currentPassword}
                        onChangeText={setCurrentPassword}
                        placeholder={t('passwordModal.currentPlaceholder')}
                        placeholderTextColor={placeholderColor}
                        secureTextEntry
                      />
                    </View>

                    <View>
                      <Text className="text-sm font-medium text-gray-700 mb-2">{t('passwordModal.newLabel')}</Text>
                      <TextInput
                        className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-base text-gray-900"
                        value={newPassword}
                        onChangeText={setNewPassword}
                        placeholder={t('passwordModal.newPlaceholder')}
                        placeholderTextColor={placeholderColor}
                        secureTextEntry
                      />
                    </View>

                    <View>
                      <Text className="text-sm font-medium text-gray-700 mb-2">{t('passwordModal.confirmLabel')}</Text>
                      <TextInput
                        className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-base text-gray-900"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        placeholder={t('passwordModal.confirmPlaceholder')}
                        placeholderTextColor={placeholderColor}
                        secureTextEntry
                      />
                    </View>
                  </View>
                </ScrollView>

                <View className="p-6 border-t border-gray-100 bg-white pb-8">
                  <Button
                    title={t('passwordModal.saveButton')}
                    onPress={handleChangePassword}
                    loading={passwordLoading}
                    fullWidth
                    size="lg"
                  />
                </View>
              </Pressable>
            </Pressable>
          </Modal>
        </>
      ) : user?.role === 'siswa' ? (
        <>
          <SafeAreaView className="flex-1 bg-[#f5f7fb]" edges={['top']}>
            <View className="flex-row items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
              <View>
                <Text className="text-xl font-bold text-gray-900">Profil Saya</Text>
                <Text className="text-sm text-gray-500">Kelola akun siswa</Text>
              </View>
            </View>
            <ScrollView className="flex-1 px-6 pt-6" contentContainerStyle={{ paddingBottom: 24 }}>
              <StudentProfile onChangePassword={() => setIsChangePasswordVisible(true)} />
            </ScrollView>
          </SafeAreaView>
        </>
      ) : user?.role === 'admin_sekolah' ? (
        <>
          <SafeAreaView className="flex-1 bg-[#f5f7fb]" edges={['top']}>
            <View className="flex-row items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
              <View>
                <Text className="text-xl font-bold text-gray-900">Profil Sekolah</Text>
                <Text className="text-sm text-gray-500">Kelola akun sekolah</Text>
              </View>
            </View>
            <ScrollView className="flex-1 px-6 pt-6" contentContainerStyle={{ paddingBottom: 24 }}>
              <SchoolProfile onChangePassword={() => setIsChangePasswordVisible(true)} />
            </ScrollView>
          </SafeAreaView>

          {/* Change Password Modal (shared) */}
          <Modal visible={isChangePasswordVisible} animationType="slide" transparent>
            <Pressable
              className="flex-1 bg-black/60 justify-end"
              onPress={() => setIsChangePasswordVisible(false)}
            >
              <Pressable
                className="bg-white rounded-t-[32px] h-[75%] shadow-2xl"
                onPress={(e) => e.stopPropagation()}
              >
                <View className="flex-row justify-between items-center px-6 py-5 border-b border-gray-100">
                  <Text className="text-xl font-bold text-gray-900">{t('passwordModal.title')}</Text>
                  <TouchableOpacity
                    onPress={() => setIsChangePasswordVisible(false)}
                    className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center"
                  >
                    <Ionicons name="close" size={20} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                <ScrollView className="flex-1 px-6 py-6">
                  <View className="bg-orange-50 p-4 rounded-2xl mb-6 flex-row items-start">
                    <Ionicons name="shield-checkmark" size={24} color="#EA580C" />
                    <View className="ml-3 flex-1">
                      <Text className="text-orange-900 font-bold text-sm mb-1">Keamanan Akun</Text>
                      <Text className="text-orange-700 text-xs leading-4">{t('passwordModal.hint')}</Text>
                    </View>
                  </View>

                  <View className="gap-5">
                    <View>
                      <Text className="text-sm font-medium text-gray-700 mb-2">{t('passwordModal.currentLabel')}</Text>
                      <TextInput
                        className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-base text-gray-900"
                        value={currentPassword}
                        onChangeText={setCurrentPassword}
                        placeholder={t('passwordModal.currentPlaceholder')}
                        placeholderTextColor={placeholderColor}
                        secureTextEntry
                      />
                    </View>

                    <View>
                      <Text className="text-sm font-medium text-gray-700 mb-2">{t('passwordModal.newLabel')}</Text>
                      <TextInput
                        className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-base text-gray-900"
                        value={newPassword}
                        onChangeText={setNewPassword}
                        placeholder={t('passwordModal.newPlaceholder')}
                        placeholderTextColor={placeholderColor}
                        secureTextEntry
                      />
                    </View>

                    <View>
                      <Text className="text-sm font-medium text-gray-700 mb-2">{t('passwordModal.confirmLabel')}</Text>
                      <TextInput
                        className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-base text-gray-900"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        placeholder={t('passwordModal.confirmPlaceholder')}
                        placeholderTextColor={placeholderColor}
                        secureTextEntry
                      />
                    </View>
                  </View>
                </ScrollView>

                <View className="p-6 border-t border-gray-100 bg-white pb-8">
                  <Button
                    title={t('passwordModal.saveButton')}
                    onPress={handleChangePassword}
                    loading={passwordLoading}
                    fullWidth
                    size="lg"
                  />
                </View>
              </Pressable>
            </Pressable>
          </Modal>
        </>
      ) : user?.role === 'admin_dinkes' ? (
        <>
          <SafeAreaView className="flex-1 bg-[#f5f7fb]" edges={['top']}>
            <View className="flex-row items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
              <View>
                <Text className="text-xl font-bold text-gray-900">Profil Dinkes</Text>
                <Text className="text-sm text-gray-500">Kelola akun dinas kesehatan</Text>
              </View>
            </View>
            <ScrollView className="flex-1 px-6 pt-6" contentContainerStyle={{ paddingBottom: 24 }}>
              <DinkesProfile onChangePassword={() => setIsChangePasswordVisible(true)} />
            </ScrollView>
          </SafeAreaView>

          {/* Change Password Modal (shared) */}
          <Modal visible={isChangePasswordVisible} animationType="slide" transparent>
            <Pressable
              className="flex-1 bg-black/60 justify-end"
              onPress={() => setIsChangePasswordVisible(false)}
            >
              <Pressable
                className="bg-white rounded-t-[32px] h-[75%] shadow-2xl"
                onPress={(e) => e.stopPropagation()}
              >
                <View className="flex-row justify-between items-center px-6 py-5 border-b border-gray-100">
                  <Text className="text-xl font-bold text-gray-900">{t('passwordModal.title')}</Text>
                  <TouchableOpacity
                    onPress={() => setIsChangePasswordVisible(false)}
                    className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center"
                  >
                    <Ionicons name="close" size={20} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                <ScrollView className="flex-1 px-6 py-6">
                  <View className="bg-orange-50 p-4 rounded-2xl mb-6 flex-row items-start">
                    <Ionicons name="shield-checkmark" size={24} color="#EA580C" />
                    <View className="ml-3 flex-1">
                      <Text className="text-orange-900 font-bold text-sm mb-1">Keamanan Akun</Text>
                      <Text className="text-orange-700 text-xs leading-4">{t('passwordModal.hint')}</Text>
                    </View>
                  </View>

                  <View className="gap-5">
                    <View>
                      <Text className="text-sm font-medium text-gray-700 mb-2">{t('passwordModal.currentLabel')}</Text>
                      <TextInput
                        className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-base text-gray-900"
                        value={currentPassword}
                        onChangeText={setCurrentPassword}
                        placeholder={t('passwordModal.currentPlaceholder')}
                        placeholderTextColor={'#9CA3AF'}
                        secureTextEntry
                      />
                    </View>

                    <View>
                      <Text className="text-sm font-medium text-gray-700 mb-2">{t('passwordModal.newLabel')}</Text>
                      <TextInput
                        className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-base text-gray-900"
                        value={newPassword}
                        onChangeText={setNewPassword}
                        placeholder={t('passwordModal.newPlaceholder')}
                        placeholderTextColor={'#9CA3AF'}
                        secureTextEntry
                      />
                    </View>

                    <View>
                      <Text className="text-sm font-medium text-gray-700 mb-2">{t('passwordModal.confirmLabel')}</Text>
                      <TextInput
                        className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-base text-gray-900"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        placeholder={t('passwordModal.confirmPlaceholder')}
                        placeholderTextColor={'#9CA3AF'}
                        secureTextEntry
                      />
                    </View>
                  </View>
                </ScrollView>

                <View className="p-6 border-t border-gray-100 bg-white pb-8">
                  <Button
                    title={t('passwordModal.saveButton')}
                    onPress={handleChangePassword}
                    loading={passwordLoading}
                    fullWidth
                    size="lg"
                  />
                </View>
              </Pressable>
            </Pressable>
          </Modal>
        </>
      ) : user?.role === 'super_admin' ? (
        <>
          <SafeAreaView className="flex-1 bg-[#f5f7fb]" edges={['top']}>
            <View className="flex-row items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
              <View>
                <Text className="text-xl font-bold text-gray-900">Profil Super Admin</Text>
                <Text className="text-sm text-gray-500">Pusat kendali sistem</Text>
              </View>
            </View>
            <ScrollView className="flex-1 px-6 pt-6" contentContainerStyle={{ paddingBottom: 24 }}>
              <SuperAdminProfile onChangePassword={() => setIsChangePasswordVisible(true)} />
            </ScrollView>
          </SafeAreaView>

          {/* Change Password Modal (shared) */}
          <Modal visible={isChangePasswordVisible} animationType="slide" transparent>
            <Pressable
              className="flex-1 bg-black/60 justify-end"
              onPress={() => setIsChangePasswordVisible(false)}
            >
              <Pressable
                className="bg-white rounded-t-[32px] h-[75%] shadow-2xl"
                onPress={(e) => e.stopPropagation()}
              >
                <View className="flex-row justify-between items-center px-6 py-5 border-b border-gray-100">
                  <Text className="text-xl font-bold text-gray-900">{t('passwordModal.title')}</Text>
                  <TouchableOpacity
                    onPress={() => setIsChangePasswordVisible(false)}
                    className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center"
                  >
                    <Ionicons name="close" size={20} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                <ScrollView className="flex-1 px-6 py-6">
                  <View className="bg-orange-50 p-4 rounded-2xl mb-6 flex-row items-start">
                    <Ionicons name="shield-checkmark" size={24} color="#EA580C" />
                    <View className="ml-3 flex-1">
                      <Text className="text-orange-900 font-bold text-sm mb-1">Keamanan Akun</Text>
                      <Text className="text-orange-700 text-xs leading-4">{t('passwordModal.hint')}</Text>
                    </View>
                  </View>

                  <View className="gap-5">
                    <View>
                      <Text className="text-sm font-medium text-gray-700 mb-2">{t('passwordModal.currentLabel')}</Text>
                      <TextInput
                        className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-base text-gray-900"
                        value={currentPassword}
                        onChangeText={setCurrentPassword}
                        placeholder={t('passwordModal.currentPlaceholder')}
                        placeholderTextColor={'#9CA3AF'}
                        secureTextEntry
                      />
                    </View>

                    <View>
                      <Text className="text-sm font-medium text-gray-700 mb-2">{t('passwordModal.newLabel')}</Text>
                      <TextInput
                        className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-base text-gray-900"
                        value={newPassword}
                        onChangeText={setNewPassword}
                        placeholder={t('passwordModal.newPlaceholder')}
                        placeholderTextColor={'#9CA3AF'}
                        secureTextEntry
                      />
                    </View>

                    <View>
                      <Text className="text-sm font-medium text-gray-700 mb-2">{t('passwordModal.confirmLabel')}</Text>
                      <TextInput
                        className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-base text-gray-900"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        placeholder={t('passwordModal.confirmPlaceholder')}
                        placeholderTextColor={'#9CA3AF'}
                        secureTextEntry
                      />
                    </View>
                  </View>
                </ScrollView>

                <View className="p-6 border-t border-gray-100 bg-white pb-8">
                  <Button
                    title={t('passwordModal.saveButton')}
                    onPress={handleChangePassword}
                    loading={passwordLoading}
                    fullWidth
                    size="lg"
                  />
                </View>
              </Pressable>
            </Pressable>
          </Modal>
        </>
      ) : (
        <>
          <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
            {/* Header Profile Section */}
            <View className="bg-white pb-6 pt-2 px-6 rounded-b-[32px] shadow-sm mb-4">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-2xl font-bold text-gray-900">{t('settings.title')}</Text>
                <View className="bg-blue-50 px-3 py-1 rounded-full">
                  <Text className="text-blue-700 text-xs font-bold uppercase">{roleLabel}</Text>
                </View>
              </View>

              <View className="flex-row items-center">
                <View className="w-20 h-20 rounded-full bg-blue-600 items-center justify-center shadow-lg border-4 border-white mr-5">
                  <Text className="text-3xl font-bold text-white">
                    {user?.username?.[0]?.toUpperCase() ?? 'U'}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-xl font-bold text-gray-900 mb-1">
                    {user?.fullName || user?.username || 'Guest'}
                  </Text>
                  <Text className="text-gray-500 text-sm mb-3">
                    {user?.username ? `@${user.username}` : ''}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setIsEditProfileVisible(true)}
                    className="bg-gray-100 self-start px-4 py-2 rounded-full flex-row items-center"
                  >
                    <Ionicons name="create-outline" size={16} color="#4B5563" />
                    <Text className="text-gray-700 text-xs font-semibold ml-2">{t('settings.editProfile')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View className="px-4">
              {/* App Settings */}
              <SectionHeader title={t('settings.applicationSectionTitle')} />
              <View className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                <SettingItem
                  icon="moon"
                  iconColor="#7C3AED"
                  iconBg="bg-purple-50"
                  label={t('settings.darkMode')}
                  rightElement={
                    <Switch
                      value={false}
                      onValueChange={handleDarkModeToggle}
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
              </View>

              {canSeeNetworkSection && canUseLocal && (
                <>
                  <SectionHeader title={t('network.sectionTitle')} />
                  <View className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
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
                        placeholderTextColor={placeholderColor}
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="numbers-and-punctuation"
                        editable={isLocalMode}
                        className={`mt-2 border border-gray-200 rounded-2xl px-4 py-3 text-base ${isLocalMode ? 'text-gray-900 bg-white' : 'text-gray-400 bg-gray-50'}`}
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
                  </View>
                </>
              )}

              {/* Server Sync - Admin Only & Not Edge */}
              {isAdmin && !isEdgeMode && (
                <>
                  <SectionHeader title="Sinkronisasi Server" />
                  <View className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                    <SettingItem
                      icon="key-outline"
                      iconColor="#2563EB"
                      iconBg="bg-blue-50"
                      label="Kelola API Keys"
                      onPress={() => router.push('/(app)/api-keys' as any)}
                      isLast
                    />
                  </View>
                </>
              )}

              {/* Account Settings */}
              <SectionHeader title={t('settings.accountSectionTitle')} />
              <View className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                <SettingItem
                  icon="lock-closed-outline"
                  iconColor="#EA580C"
                  iconBg="bg-orange-50"
                  label={t('settings.changePassword')}
                  onPress={() => setIsChangePasswordVisible(true)}
                />
                <SettingItem
                  icon="log-out-outline"
                  iconColor="#DC2626"
                  iconBg="bg-red-50"
                  label={t('settings.signOut')}
                  onPress={signOut}
                  isLast
                />
              </View>

              <Text className="text-center text-gray-400 mt-8 text-xs font-medium uppercase tracking-widest">
                {versionLabel}
              </Text>
            </View>
          </ScrollView>

          <Modal visible={isEditProfileVisible} animationType="slide" transparent>
            <Pressable
              className="flex-1 bg-black/60 justify-end"
              onPress={() => setIsEditProfileVisible(false)}
            >
              <Pressable
                className="bg-white rounded-t-[32px] h-[85%] shadow-2xl"
                onPress={(e) => e.stopPropagation()}
              >
                <View className="flex-row justify-between items-center px-6 py-5 border-b border-gray-100">
                  <Text className="text-xl font-bold text-gray-900">{t('profileModal.title')}</Text>
                  <TouchableOpacity
                    onPress={() => setIsEditProfileVisible(false)}
                    className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center"
                  >
                    <Ionicons name="close" size={20} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                <ScrollView className="flex-1 px-6 py-6">
                  <View className="bg-blue-50 p-4 rounded-2xl mb-6 flex-row items-start">
                    <Ionicons name="information-circle" size={24} color="#2563EB" />
                    <View className="ml-3 flex-1">
                      <Text className="text-blue-900 font-bold text-sm mb-1">{t('profileModal.accountInfoTitle')}</Text>
                      <Text className="text-blue-700 text-xs leading-4">{t('profileModal.accountInfoDescription')}</Text>
                    </View>
                  </View>

                  <View className="mb-8">
                    <Text className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Detail Akun</Text>
                    <InfoRow label={t('profileModal.usernameLabel')} value={user?.username ?? '-'} icon="person-outline" />
                    <InfoRow label={t('profileModal.roleLabel')} value={roleLabel} icon="shield-outline" />
                    <InfoRow label={t('profileModal.statusLabel')} value={accountStatusLabel} icon="checkmark-circle-outline" />
                  </View>

                  <View className="mb-8">
                    <Text className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Afiliasi</Text>
                    <InfoRow label={t('profileModal.schoolLabel')} value={schoolDisplay} icon="school-outline" />
                    <InfoRow label={t('profileModal.cateringLabel')} value={cateringDisplay} icon="restaurant-outline" />
                    <InfoRow label={t('profileModal.dinkesLabel')} value={dinkesDisplay} icon="medkit-outline" />
                  </View>

                  <View className="mb-6">
                    <Text className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Edit Informasi</Text>

                    <View className="mb-4">
                      <Text className="text-sm font-medium text-gray-700 mb-2">{t('profileModal.fullNameLabel')}</Text>
                      <TextInput
                        className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-base text-gray-900"
                        value={fullNameInput}
                        onChangeText={setFullNameInput}
                        placeholder={fullNamePlaceholder}
                        placeholderTextColor={placeholderColor}
                      />
                    </View>

                    <View>
                      <Text className="text-sm font-medium text-gray-700 mb-2">{t('profileModal.healthOfficeAreaLabel')}</Text>
                      <TextInput
                        className={`bg-gray-50 border border-gray-200 rounded-xl p-4 text-base text-gray-900 ${!canEditHealthOffice && 'opacity-50'}`}
                        value={healthOfficeAreaInput}
                        onChangeText={setHealthOfficeAreaInput}
                        placeholder={healthOfficePlaceholder}
                        placeholderTextColor={placeholderColor}
                        editable={canEditHealthOffice}
                      />
                      {!canEditHealthOffice && (
                        <Text className="text-xs text-gray-500 mt-2 italic">
                          {t('profileModal.healthOfficeAreaDisabledHint')}
                        </Text>
                      )}
                    </View>
                  </View>
                </ScrollView>

                <View className="p-6 border-t border-gray-100 bg-white pb-8">
                  <Button
                    title={t('profileModal.saveButton')}
                    onPress={handleUpdateProfile}
                    loading={profileLoading}
                    fullWidth
                    size="lg"
                  />
                </View>
              </Pressable>
            </Pressable>
          </Modal>

          {/* Change Password Modal */}
          <Modal visible={isChangePasswordVisible} animationType="slide" transparent>
            <Pressable
              className="flex-1 bg-black/60 justify-end"
              onPress={() => setIsChangePasswordVisible(false)}
            >
              <Pressable
                className="bg-white rounded-t-[32px] h-[75%] shadow-2xl"
                onPress={(e) => e.stopPropagation()}
              >
                <View className="flex-row justify-between items-center px-6 py-5 border-b border-gray-100">
                  <Text className="text-xl font-bold text-gray-900">{t('passwordModal.title')}</Text>
                  <TouchableOpacity
                    onPress={() => setIsChangePasswordVisible(false)}
                    className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center"
                  >
                    <Ionicons name="close" size={20} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                <ScrollView className="flex-1 px-6 py-6">
                  <View className="bg-orange-50 p-4 rounded-2xl mb-6 flex-row items-start">
                    <Ionicons name="shield-checkmark" size={24} color="#EA580C" />
                    <View className="ml-3 flex-1">
                      <Text className="text-orange-900 font-bold text-sm mb-1">Keamanan Akun</Text>
                      <Text className="text-orange-700 text-xs leading-4">{t('passwordModal.hint')}</Text>
                    </View>
                  </View>

                  <View className="gap-5">
                    <View>
                      <Text className="text-sm font-medium text-gray-700 mb-2">{t('passwordModal.currentLabel')}</Text>
                      <TextInput
                        className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-base text-gray-900"
                        value={currentPassword}
                        onChangeText={setCurrentPassword}
                        placeholder={t('passwordModal.currentPlaceholder')}
                        placeholderTextColor={placeholderColor}
                        secureTextEntry
                      />
                    </View>

                    <View>
                      <Text className="text-sm font-medium text-gray-700 mb-2">{t('passwordModal.newLabel')}</Text>
                      <TextInput
                        className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-base text-gray-900"
                        value={newPassword}
                        onChangeText={setNewPassword}
                        placeholder={t('passwordModal.newPlaceholder')}
                        placeholderTextColor={placeholderColor}
                        secureTextEntry
                      />
                    </View>

                    <View>
                      <Text className="text-sm font-medium text-gray-700 mb-2">{t('passwordModal.confirmLabel')}</Text>
                      <TextInput
                        className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-base text-gray-900"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        placeholder={t('passwordModal.confirmPlaceholder')}
                        placeholderTextColor={placeholderColor}
                        secureTextEntry
                      />
                    </View>
                  </View>
                </ScrollView>

                <View className="p-6 border-t border-gray-100 bg-white pb-8">
                  <Button
                    title={t('passwordModal.saveButton')}
                    onPress={handleChangePassword}
                    loading={passwordLoading}
                    fullWidth
                    size="lg"
                  />
                </View>
              </Pressable>
            </Pressable>
          </Modal>
        </>
      )}
    </SafeAreaView >
  );
}
