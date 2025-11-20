import { Ionicons } from '@expo/vector-icons';
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
import Card from '../../components/ui/Card';
import type { TranslationKey } from '../../context/PreferencesContext';
import { useAuth } from '../../hooks/useAuth';
import { usePreferences } from '../../hooks/usePreferences';
import { useResponsive } from '../../hooks/useResponsive';
import { changeMyPassword, updateMyProfile } from '../../services/profile';

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="mb-3">
      <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</Text>
      <Text className="text-base text-gray-900 mt-1">{value}</Text>
    </View>
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
  const { user, signOut, refreshProfile } = useAuth();
  const { setDarkMode, isEnglish, setLanguage, t } = usePreferences();
  const { isMobile } = useResponsive();

  const [isEditProfileVisible, setIsEditProfileVisible] = useState(false);
  const [isChangePasswordVisible, setIsChangePasswordVisible] = useState(false);

  const [fullNameInput, setFullNameInput] = useState(user?.fullName ?? '');
  const [healthOfficeAreaInput, setHealthOfficeAreaInput] = useState(user?.healthOfficeArea ?? '');
  const [profileLoading, setProfileLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const placeholderColor = '#9CA3AF';
  const canEditHealthOffice = user?.role === 'admin_dinkes';

  useEffect(() => {
    if (isEditProfileVisible) {
      setFullNameInput(user?.fullName ?? '');
      setHealthOfficeAreaInput(user?.healthOfficeArea ?? '');
    }
  }, [isEditProfileVisible, user?.fullName, user?.healthOfficeArea]);

  const roleLabel = useMemo(() => {
    if (!user?.role) return t('roles.siswa');
    const key = `roles.${user.role}` as TranslationKey;
    return t(key);
  }, [user?.role, t]);

  const accountStatusLabel = useMemo(
    () => t(getAccountStatusKey(user?.accountStatus)),
    [user?.accountStatus, t],
  );

  const schoolDisplay = useMemo(() => {
    if (user?.sekolah?.name) {
      const location = user.sekolah.city ?? user.sekolah.province;
      return location ? `${user.sekolah.name} • ${location}` : user.sekolah.name;
    }
    if (user?.schoolId) {
      return `ID: ${user.schoolId}`;
    }
    return t('profileModal.noData');
  }, [user?.sekolah?.name, user?.sekolah?.city, user?.sekolah?.province, user?.schoolId, t]);

  const cateringDisplay = useMemo(() => {
    if (user?.catering?.name) {
      const location = user.catering.city ?? user.catering.province;
      return location ? `${user.catering.name} • ${location}` : user.catering.name;
    }
    if (user?.cateringId) {
      return `ID: ${user.cateringId}`;
    }
    return t('profileModal.noData');
  }, [user?.catering?.name, user?.catering?.city, user?.catering?.province, user?.cateringId, t]);

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
      <ScrollView className="flex-1">
        <View className={isMobile ? 'p-4' : 'p-8'}>
          <Text className={`${isMobile ? 'text-3xl' : 'text-4xl'} font-bold text-gray-900 mb-8`}>
            {t('settings.title')}
          </Text>

          <Card variant="elevated" className="mb-6">
            <View className="flex-row items-center mb-6">
              <View className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 items-center justify-center mr-5 shadow-lg">
                <Text className="text-3xl font-bold text-white">
                  {user?.username?.[0]?.toUpperCase() ?? 'U'}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-xl font-bold text-gray-900">
                  {user?.fullName || user?.username || 'Guest'}
                </Text>
                <Text className="text-base text-gray-600 capitalize mt-1">
                  {roleLabel}
                </Text>
              </View>
            </View>
            <Button
              title={t('settings.editProfile')}
              variant="outline"
              icon={<Ionicons name="create-outline" size={20} color="#1976D2" />}
              fullWidth
              onPress={() => setIsEditProfileVisible(true)}
            />
          </Card>

          <Text className="text-xl font-bold text-gray-900 mb-4">{t('settings.applicationSectionTitle')}</Text>
          <Card variant="elevated" className="mb-6 p-0 overflow-hidden">
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
              <View className="flex-row items-center flex-1">
                <View className="w-10 h-10 rounded-full bg-blue-50 items-center justify-center mr-4">
                  <Ionicons name="moon" size={20} color="#1976D2" />
                </View>
                <Text className="text-base font-semibold text-gray-900">{t('settings.darkMode')}</Text>
              </View>
              <Switch
                value={false}
                onValueChange={handleDarkModeToggle}
                trackColor={{ false: '#E0E0E0', true: '#90CAF9' }}
                thumbColor="#F5F5F5"
                disabled
              />
            </View>
            <View className="flex-row items-center justify-between px-5 py-4">
              <View className="flex-row items-center flex-1">
                <View className="w-10 h-10 rounded-full bg-green-50 items-center justify-center mr-4">
                  <Ionicons name="language" size={20} color="#4CAF50" />
                </View>
                <Text className="text-base font-semibold text-gray-900">{t('settings.languageToggle')}</Text>
              </View>
              <Switch
                value={isEnglish}
                onValueChange={handleLanguageToggle}
                trackColor={{ false: '#E0E0E0', true: '#A5D6A7' }}
                thumbColor={isEnglish ? '#4CAF50' : '#F5F5F5'}
              />
            </View>
          </Card>

          <Text className="text-xl font-bold text-gray-900 mb-4">{t('settings.accountSectionTitle')}</Text>
          <Card variant="elevated" className="mb-6 p-0 overflow-hidden">
            <TouchableOpacity
              className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100 active:bg-gray-50"
              onPress={() => setIsChangePasswordVisible(true)}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center flex-1">
                <View className="w-10 h-10 rounded-full bg-orange-50 items-center justify-center mr-4">
                  <Ionicons name="key" size={20} color="#FF9800" />
                </View>
                <Text className="text-base font-semibold text-gray-900">{t('settings.changePassword')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color="#BDBDBD" />
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-row items-center justify-between px-5 py-4 active:bg-red-50"
              onPress={signOut}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center flex-1">
                <View className="w-10 h-10 rounded-full bg-red-50 items-center justify-center mr-4">
                  <Ionicons name="log-out" size={20} color="#F44336" />
                </View>
                <Text className="text-base font-semibold text-red-600">{t('settings.signOut')}</Text>
              </View>
            </TouchableOpacity>
          </Card>

          <Text className="text-center text-gray-400 mt-6 text-sm">{versionLabel}</Text>
        </View>
      </ScrollView>

      <Modal visible={isEditProfileVisible} animationType="slide" transparent>
        <Pressable
          className="flex-1 bg-black/60 justify-end"
          onPress={() => setIsEditProfileVisible(false)}
        >
          <Pressable
            className="bg-white rounded-t-3xl h-[75%] shadow-2xl"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="flex-row justify-between items-center p-6 pb-4 border-b border-gray-100">
              <View>
                <Text className="text-2xl font-bold text-gray-900">{t('profileModal.title')}</Text>
                <Text className="text-sm text-gray-500 mt-1">{t('profileModal.subtitle')}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsEditProfileVisible(false)}
                className="p-2 bg-gray-100 rounded-full"
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 px-6 py-4">
              <View className="gap-5">
                <View className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
                  <Text className="text-sm font-semibold text-gray-800 mb-1">{t('profileModal.accountInfoTitle')}</Text>
                  <Text className="text-xs text-gray-500 mb-4">{t('profileModal.accountInfoDescription')}</Text>
                  <InfoRow label={t('profileModal.usernameLabel')} value={user?.username ?? '-'} />
                  <InfoRow label={t('profileModal.roleLabel')} value={roleLabel} />
                  <InfoRow label={t('profileModal.statusLabel')} value={accountStatusLabel} />
                </View>

                <View className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
                  <Text className="text-sm font-semibold text-gray-800 mb-1">{t('profileModal.linkedInfoTitle')}</Text>
                  <Text className="text-xs text-gray-500 mb-4">{t('profileModal.associationsDescription')}</Text>
                  <InfoRow label={t('profileModal.schoolLabel')} value={schoolDisplay} />
                  <InfoRow label={t('profileModal.cateringLabel')} value={cateringDisplay} />
                  <InfoRow label={t('profileModal.dinkesLabel')} value={dinkesDisplay} />
                </View>

                <View>
                  <Text className="text-sm font-semibold text-gray-700 mb-2">{t('profileModal.fullNameLabel')}</Text>
                  <TextInput
                    className="border-2 border-gray-200 rounded-xl p-4 text-base bg-white text-gray-900"
                    value={fullNameInput}
                    onChangeText={setFullNameInput}
                    placeholder={fullNamePlaceholder}
                    placeholderTextColor={placeholderColor}
                  />
                </View>

                <View>
                  <Text className="text-sm font-semibold text-gray-700 mb-2">{t('profileModal.healthOfficeAreaLabel')}</Text>
                  <TextInput
                    className={`border-2 border-gray-200 rounded-xl p-4 text-base bg-white text-gray-900 ${canEditHealthOffice ? '' : 'opacity-60'}`}
                    value={healthOfficeAreaInput}
                    onChangeText={setHealthOfficeAreaInput}
                    placeholder={healthOfficePlaceholder}
                    placeholderTextColor={placeholderColor}
                    editable={canEditHealthOffice}
                    selectTextOnFocus={canEditHealthOffice}
                  />
                  {!canEditHealthOffice && (
                    <Text className="text-xs text-amber-600 mt-1">
                      {t('profileModal.healthOfficeAreaDisabledHint')}
                    </Text>
                  )}
                </View>
              </View>
            </ScrollView>

            <View className="px-6 pb-6">
              <Text className="text-xs text-gray-500 mb-3">{t('profileModal.note')}</Text>
            </View>

            <View className="p-6 pt-0 border-t-2 border-gray-100">
              <Button
                title={t('profileModal.saveButton')}
                onPress={handleUpdateProfile}
                loading={profileLoading}
                fullWidth
                icon={<Ionicons name="checkmark-circle" size={20} color="white" />}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={isChangePasswordVisible} animationType="slide" transparent>
        <Pressable
          className="flex-1 bg-black/60 justify-end"
          onPress={() => setIsChangePasswordVisible(false)}
        >
          <Pressable
            className="bg-white rounded-t-3xl h-[70%] shadow-2xl"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="flex-row justify-between items-center p-6 pb-4 border-b border-gray-100">
              <View>
                <Text className="text-2xl font-bold text-gray-900">{t('passwordModal.title')}</Text>
                <Text className="text-sm text-gray-500 mt-1">{t('passwordModal.subtitle')}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsChangePasswordVisible(false)}
                className="p-2 bg-gray-100 rounded-full"
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 px-6 py-4">
              <View className="gap-5">
                <View>
                  <Text className="text-sm font-semibold text-gray-700 mb-2">
                    {t('passwordModal.currentLabel')}
                  </Text>
                  <TextInput
                    className="border-2 border-gray-200 rounded-xl p-4 text-base bg-white text-gray-900"
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    placeholder={t('passwordModal.currentPlaceholder')}
                    placeholderTextColor={placeholderColor}
                    secureTextEntry
                  />
                </View>

                <View>
                  <Text className="text-sm font-semibold text-gray-700 mb-2">
                    {t('passwordModal.newLabel')}
                  </Text>
                  <TextInput
                    className="border-2 border-gray-200 rounded-xl p-4 text-base bg-white text-gray-900"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder={t('passwordModal.newPlaceholder')}
                    placeholderTextColor={placeholderColor}
                    secureTextEntry
                  />
                </View>

                <View>
                  <Text className="text-sm font-semibold text-gray-700 mb-2">
                    {t('passwordModal.confirmLabel')}
                  </Text>
                  <TextInput
                    className="border-2 border-gray-200 rounded-xl p-4 text-base bg-white text-gray-900"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder={t('passwordModal.confirmPlaceholder')}
                    placeholderTextColor={placeholderColor}
                    secureTextEntry
                  />
                </View>

                <View className="bg-blue-50 p-4 rounded-xl">
                  <View className="flex-row items-start">
                    <Ionicons name="information-circle" size={20} color="#1976D2" />
                    <Text className="text-sm text-blue-700 ml-2 flex-1">
                      {t('passwordModal.hint')}
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>

            <View className="p-6 pt-4 border-t-2 border-gray-100">
              <Button
                title={t('passwordModal.saveButton')}
                onPress={handleChangePassword}
                loading={passwordLoading}
                fullWidth
                icon={<Ionicons name="shield-checkmark" size={20} color="white" />}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
