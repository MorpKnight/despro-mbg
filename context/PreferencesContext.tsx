import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type PropsWithChildren,
} from 'react';
const nativeWind = require('nativewind') as {
  NativeWindStyleSheet?: {
    setColorScheme?: (scheme: 'light' | 'dark') => void;
  };
};

export type Language = 'id' | 'en';

type ReplacementMap = Record<string, string | number>;

type PreferenceContextValue = {
  isDarkMode: boolean;
  setDarkMode: (value: boolean) => Promise<void>;
  toggleDarkMode: () => Promise<void>;
  language: Language;
  setLanguage: (language: Language) => Promise<void>;
  isEnglish: boolean;
  t: (key: TranslationKey, replacements?: ReplacementMap) => string;
};

const DARK_MODE_KEY = '@dark_mode';
const LANGUAGE_KEY = '@language';

const translations = {
  id: {
    'settings.title': 'Pengaturan',
    'settings.editProfile': 'Edit Profil',
    'settings.applicationSectionTitle': 'Aplikasi',
    'settings.darkMode': 'Mode Gelap (nonaktif)',
    'settings.languageToggle': 'Gunakan Bahasa Inggris',
    'settings.accountSectionTitle': 'Akun',
    'settings.changePassword': 'Ubah Password',
    'settings.signOut': 'Keluar',
    'settings.versionLabel': 'Versi {version}',
    'profileModal.title': 'Edit Profil',
    'profileModal.subtitle': 'Perbarui informasi profil Anda',
    'profileModal.accountInfoTitle': 'Informasi Akun',
    'profileModal.accountInfoDescription': 'Bagian ini menampilkan field langsung dari model pengguna di backend.',
    'profileModal.linkedInfoTitle': 'Relasi Data',
    'profileModal.associationsDescription': 'Sekolah, catering, dan wilayah mengikuti relasi pada model pengguna.',
    'profileModal.usernameLabel': 'Username',
    'profileModal.roleLabel': 'Peran',
    'profileModal.statusLabel': 'Status Akun',
    'profileModal.schoolLabel': 'Sekolah',
    'profileModal.cateringLabel': 'Catering',
    'profileModal.dinkesLabel': 'Wilayah Dinas Kesehatan',
    'profileModal.noData': 'Belum terhubung',
    'profileModal.fullNameLabel': 'Nama Lengkap',
    'profileModal.fullNamePlaceholder': 'Nama saat ini: {value}',
    'profileModal.emptyValue': 'Belum diatur',
    'profileModal.healthOfficeAreaLabel': 'Wilayah Dinas Kesehatan',
    'profileModal.healthOfficeAreaPlaceholder': 'Wilayah saat ini: {value}',
    'profileModal.healthOfficeAreaDisabledHint': 'Hubungi admin untuk memperbarui wilayah.',
    'profileModal.note': 'Kosongkan kolom jika tidak ingin mengubah nilai.',
    'profileModal.saveButton': 'Simpan Perubahan',
    'profileModal.noChangesTitle': 'Tidak ada perubahan',
    'profileModal.noChangesMessage': 'Perbarui salah satu kolom sebelum menyimpan.',
    'profileModal.successTitle': 'Berhasil',
    'profileModal.successMessage': 'Profil berhasil diperbarui.',
    'profileModal.errorTitle': 'Gagal',
    'profileModal.errorMessage': 'Tidak dapat memperbarui profil saat ini.',
    'passwordModal.title': 'Ubah Password',
    'passwordModal.subtitle': 'Pastikan password baru aman',
    'passwordModal.currentLabel': 'Password Saat Ini',
    'passwordModal.newLabel': 'Password Baru',
    'passwordModal.confirmLabel': 'Konfirmasi Password Baru',
    'passwordModal.currentPlaceholder': 'Masukkan password saat ini',
    'passwordModal.newPlaceholder': 'Minimal 8 karakter',
    'passwordModal.confirmPlaceholder': 'Ulangi password baru',
    'passwordModal.hint': 'Password minimal 8 karakter dan idealnya mengandung huruf, angka, dan simbol.',
    'passwordModal.saveButton': 'Ubah Password',
    'passwordModal.mismatchTitle': 'Password tidak cocok',
    'passwordModal.mismatchMessage': 'Pastikan konfirmasi password sama persis.',
    'passwordModal.shortTitle': 'Password terlalu pendek',
    'passwordModal.shortMessage': 'Password baru harus minimal 8 karakter.',
    'passwordModal.successTitle': 'Berhasil',
    'passwordModal.successMessage': 'Password berhasil diperbarui.',
    'passwordModal.errorTitle': 'Gagal',
    'passwordModal.errorMessage': 'Tidak dapat mengubah password saat ini.',
    'statuses.account.active': 'Aktif',
    'statuses.account.pending_confirmation': 'Menunggu konfirmasi',
    'statuses.account.inactive': 'Tidak aktif',
    'statuses.account.suspended': 'Ditangguhkan',
    'roles.super_admin': 'Super Admin',
    'roles.admin_sekolah': 'Admin Sekolah',
    'roles.admin_catering': 'Admin Catering',
    'roles.siswa': 'Siswa',
    'roles.admin_dinkes': 'Admin Dinkes',
  },
  en: {
    'settings.title': 'Settings',
    'settings.editProfile': 'Edit Profile',
    'settings.applicationSectionTitle': 'Application',
    'settings.darkMode': 'Dark Mode (disabled)',
    'settings.languageToggle': 'Use English Language',
    'settings.accountSectionTitle': 'Account',
    'settings.changePassword': 'Change Password',
    'settings.signOut': 'Sign Out',
    'settings.versionLabel': 'Version {version}',
    'profileModal.title': 'Edit Profile',
    'profileModal.subtitle': 'Update your personal information',
    'profileModal.accountInfoTitle': 'Account Information',
    'profileModal.accountInfoDescription': 'These fields are read from the backend user model.',
    'profileModal.linkedInfoTitle': 'Linked Entities',
    'profileModal.associationsDescription': 'School, catering, and region follow the relationships on the user model.',
    'profileModal.usernameLabel': 'Username',
    'profileModal.roleLabel': 'Role',
    'profileModal.statusLabel': 'Account Status',
    'profileModal.schoolLabel': 'School',
    'profileModal.cateringLabel': 'Catering',
    'profileModal.dinkesLabel': 'Health Office Area',
    'profileModal.noData': 'Not linked yet',
    'profileModal.fullNameLabel': 'Full Name',
    'profileModal.fullNamePlaceholder': 'Current name: {value}',
    'profileModal.emptyValue': 'Not set',
    'profileModal.healthOfficeAreaLabel': 'Health Office Area',
    'profileModal.healthOfficeAreaPlaceholder': 'Current area: {value}',
    'profileModal.healthOfficeAreaDisabledHint': 'Contact an admin to update this value.',
    'profileModal.note': 'Leave a field blank to keep the existing value.',
    'profileModal.saveButton': 'Save Changes',
    'profileModal.noChangesTitle': 'No changes detected',
    'profileModal.noChangesMessage': 'Update at least one field before saving.',
    'profileModal.successTitle': 'Success',
    'profileModal.successMessage': 'Profile updated successfully.',
    'profileModal.errorTitle': 'Error',
    'profileModal.errorMessage': 'Unable to update your profile right now.',
    'passwordModal.title': 'Change Password',
    'passwordModal.subtitle': 'Keep your account secure',
    'passwordModal.currentLabel': 'Current Password',
    'passwordModal.newLabel': 'New Password',
    'passwordModal.confirmLabel': 'Confirm New Password',
    'passwordModal.currentPlaceholder': 'Enter current password',
    'passwordModal.newPlaceholder': 'At least 8 characters',
    'passwordModal.confirmPlaceholder': 'Repeat the new password',
    'passwordModal.hint': 'Use at least 8 characters with letters, numbers, and symbols.',
    'passwordModal.saveButton': 'Update Password',
    'passwordModal.mismatchTitle': 'Password mismatch',
    'passwordModal.mismatchMessage': 'Make sure the confirmation matches the new password.',
    'passwordModal.shortTitle': 'Password too short',
    'passwordModal.shortMessage': 'The new password must be at least 8 characters long.',
    'passwordModal.successTitle': 'Success',
    'passwordModal.successMessage': 'Password updated successfully.',
    'passwordModal.errorTitle': 'Error',
    'passwordModal.errorMessage': 'Unable to change the password right now.',
    'statuses.account.active': 'Active',
    'statuses.account.pending_confirmation': 'Pending confirmation',
    'statuses.account.inactive': 'Inactive',
    'statuses.account.suspended': 'Suspended',
    'roles.super_admin': 'Super Admin',
    'roles.admin_sekolah': 'School Admin',
    'roles.admin_catering': 'Catering Admin',
    'roles.siswa': 'Student',
    'roles.admin_dinkes': 'Health Office Admin',
  },
} as const;

type TranslationMap = typeof translations;
export type TranslationKey = keyof TranslationMap['id'];

const PreferencesContext = createContext<PreferenceContextValue | undefined>(undefined);

function formatMessage(message: string, replacements?: ReplacementMap): string {
  if (!replacements) return message;
  return Object.entries(replacements).reduce<string>((acc, [key, value]) => {
    const pattern = new RegExp(`{${key}}`, 'g');
    return acc.replace(pattern, String(value));
  }, message);
}

export function PreferencesProvider({ children }: PropsWithChildren) {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [language, setLanguageState] = useState<Language>('id');

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const [storedDark, storedLanguage] = await Promise.all([
          AsyncStorage.getItem(DARK_MODE_KEY),
          AsyncStorage.getItem(LANGUAGE_KEY),
        ]);
        if (!isMounted) return;
        if (storedDark !== null) {
          setIsDarkMode(storedDark === 'true');
        } else {
          setIsDarkMode(false);
        }
        if (storedLanguage === 'en' || storedLanguage === 'id') {
          setLanguageState(storedLanguage);
        }
      } catch (error) {
        console.warn('[preferences] failed to restore', error);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    try {
      nativeWind?.NativeWindStyleSheet?.setColorScheme?.('light');
    } catch (error) {
      console.warn('[preferences] setColorScheme failed', error);
    }
  }, []);

  const persistDarkMode = useCallback(async (_value: boolean) => {
    setIsDarkMode(false);
    try {
      await AsyncStorage.setItem(DARK_MODE_KEY, 'false');
    } catch (error) {
      console.warn('[preferences] failed to persist dark mode', error);
    }
  }, []);

  const toggleDarkMode = useCallback(async () => {
    await persistDarkMode(false);
  }, [persistDarkMode]);

  const persistLanguage = useCallback(async (next: Language) => {
    setLanguageState(next);
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, next);
    } catch (error) {
      console.warn('[preferences] failed to persist language', error);
    }
  }, []);

  const translate = useCallback<PreferenceContextValue['t']>((key, replacements) => {
    const languagePack = translations[language] ?? translations.id;
    const fallbackPack = translations.id;
    const template = languagePack[key] ?? fallbackPack[key] ?? key;
    return formatMessage(template as string, replacements);
  }, [language]);

  const value = useMemo<PreferenceContextValue>(() => ({
    isDarkMode,
    setDarkMode: persistDarkMode,
    toggleDarkMode,
    language,
    setLanguage: persistLanguage,
    isEnglish: language === 'en',
    t: translate,
  }), [isDarkMode, persistDarkMode, toggleDarkMode, language, persistLanguage, translate]);

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferencesContext() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferencesContext must be used within PreferencesProvider');
  }
  return context;
}
