import { Redirect, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Image, KeyboardAvoidingView, Modal, Platform, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import Button from "../../components/ui/Button";
import Icon from "../../components/ui/Icon";
import TextInput from "../../components/ui/TextInput";
import { useAuth } from "../../hooks/useAuth";
import { getServerUrl, normalizeServerUrl, setServerUrl } from "../../services/storage";

export default function AuthIndex() {
  const { user, loading, signIn } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loginType, setLoginType] = useState<'staff' | 'student'>('staff');

  // Server Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [serverUrl, setServerUrlState] = useState("");

  useEffect(() => {
    getServerUrl().then(setServerUrlState);
  }, []);

  const handleSaveSettings = async () => {
    if (!serverUrl.trim()) {
      Alert.alert("Error", "Server URL cannot be empty");
      return;
    }
    try {
      // Basic URL validation
      new URL(serverUrl);
      const normalized = normalizeServerUrl(serverUrl);
      await setServerUrl(normalized);
      setServerUrlState(normalized);
      Alert.alert("Success", "Server URL updated successfully");
      setShowSettings(false);
    } catch (e) {
      Alert.alert("Error", "Invalid URL format");
    }
  };

  if (!loading && user) {
    return <Redirect href="/(app)" />;
  }



  const handlePing = async () => {
    if (!serverUrl.trim()) return;
    try {
      const response = await fetch(`${serverUrl.replace(/\/$/, "")}/health`);
      if (response.ok) {
        Alert.alert("Success", "Server is reachable!");
      } else {
        Alert.alert("Warning", `Server reachable but returned ${response.status}`);
      }
    } catch (e) {
      Alert.alert("Error", "Could not connect to server");
    }
  };

  // Mobile keeps the simple centered layout; Web gets a polished split view with a card
  if (Platform.OS !== "web") {
    return (
      <View className="flex-1 bg-gray-50">
        <Image
          source={require("../../assets/images/logo.png")}
          style={{ width: 400, height: 400, position: 'absolute', top: -100, right: -100, opacity: 0.05 }}
          resizeMode="contain"
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 justify-center p-6"
        >
          <Animated.View
            entering={FadeInUp.delay(200).duration(1000).springify()}
            className="items-center mb-8"
          >
            <View className="w-24 h-24 bg-white rounded-3xl shadow-lg items-center justify-center mb-4 border border-gray-100">
              <Image
                source={require("../../assets/images/logo.png")}
                style={{ width: 60, height: 60 }}
                resizeMode="contain"
              />
            </View>
            <Text className="text-3xl font-bold text-gray-900">MBGlance</Text>
            <Text className="text-gray-500 mt-2 text-center px-8">
              Sistem Monitoring Makan Bergizi Gratis
            </Text>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(400).duration(1000).springify()}
            className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 gap-4"
          >
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-xl font-bold text-gray-900">Masuk</Text>
              <TouchableOpacity onPress={() => setShowSettings(true)}>
                <Icon name="settings-outline" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Login Type Toggle */}
            <View className="flex-row mb-2 bg-gray-100 p-1 rounded-xl">
              <TouchableOpacity
                className={`flex-1 py-2.5 rounded-lg items-center ${loginType === 'staff' ? 'bg-white shadow-sm' : ''}`}
                onPress={() => setLoginType('staff')}
              >
                <Text className={`font-medium ${loginType === 'staff' ? 'text-blue-600' : 'text-gray-500'}`}>Staf / Admin</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 py-2.5 rounded-lg items-center ${loginType === 'student' ? 'bg-white shadow-sm' : ''}`}
                onPress={() => setLoginType('student')}
              >
                <Text className={`font-medium ${loginType === 'student' ? 'text-blue-600' : 'text-gray-500'}`}>Siswa</Text>
              </TouchableOpacity>
            </View>

            <SettingsModal
              visible={showSettings}
              onClose={() => setShowSettings(false)}
              serverUrl={serverUrl}
              setServerUrl={setServerUrlState}
              onPing={handlePing}
              onSave={handleSaveSettings}
            />

            {error ? (
              <Animated.View entering={FadeInDown} className="bg-red-50 p-3 rounded-xl border border-red-100">
                <Text className="text-red-600 text-sm text-center">{error}</Text>
              </Animated.View>
            ) : null}

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1.5 ml-1">Username</Text>
              <TextInput
                placeholder="Masukkan username"
                value={username}
                onChangeText={(t) => {
                  setUsername(t);
                  if (usernameError) setUsernameError(null);
                }}
                autoCapitalize="none"
                className="bg-gray-50 border-gray-200 focus:border-primary focus:bg-white transition-all"
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1.5 ml-1">Password</Text>
              <View className="relative">
                <TextInput
                  placeholder="Masukkan password"
                  value={password}
                  onChangeText={(t) => {
                    setPassword(t);
                    if (passwordError) setPasswordError(null);
                  }}
                  secureTextEntry={!showPassword}
                  className="bg-gray-50 border-gray-200 focus:border-primary focus:bg-white transition-all"
                />
                <TouchableOpacity
                  className="absolute right-3 top-3.5"
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Icon name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            </View>

            <Button
              title={loading ? "Memproses..." : "Masuk Sekarang"}
              onPress={async () => {
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
              }}
              disabled={!username.trim() || !password || loading}
              className="mt-2 shadow-md shadow-blue-500/30"
              size="lg"
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(600).duration(1000)} className="items-center mt-8">
            <Text className="text-gray-400 text-xs">
              Belum punya akun? <Text className="text-primary font-bold" onPress={() => router.push("/(auth)/signup")}>Daftar</Text>
            </Text>
          </Animated.View>
          <View className="mt-4">
  <Button
    title="Test Notifikasi"
    variant="outline"
    fullWidth
    onPress={() => router.push('/(auth)/test')}
  />
</View>

        </KeyboardAvoidingView>
      </View>
    );
  }

  // Web layout
  return (
    <View className="bg-gray-50 min-h-screen flex-row">
      <SettingsModal
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        serverUrl={serverUrl}
        setServerUrl={setServerUrlState}
        onPing={handlePing}
        onSave={handleSaveSettings}
      />

      {/* Left hero panel */}
      <View className="hidden md:flex flex-1 relative overflow-hidden bg-blue-600 items-center justify-center">
        <View className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-800" />
        <Image
          source={require("../../assets/images/logo.png")}
          style={{ width: 600, height: 600, position: 'absolute', bottom: -100, left: -100, opacity: 0.1 }}
          resizeMode="contain"
        />

        <Animated.View
          entering={FadeInUp.delay(200).duration(1000).springify()}
          className="z-10 px-16 max-w-2xl"
        >
          <View className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-3xl items-center justify-center mb-8 border border-white/20">
            <Image
              source={require("../../assets/images/logo.png")}
              style={{ width: 50, height: 50 }}
              resizeMode="contain"
            />
          </View>
          <Text className="text-white text-5xl font-bold leading-tight mb-6">
            Monitoring Gizi,{'\n'}Masa Depan Bangsa
          </Text>
          <Text className="text-blue-100 text-xl leading-relaxed">
            Platform terintegrasi untuk memantau distribusi dan kualitas Makan Bergizi Gratis di seluruh sekolah.
          </Text>
        </Animated.View>
      </View>

      {/* Right form panel */}
      <View className="flex-1 items-center justify-center p-12 relative">
        <TouchableOpacity
          className="absolute top-8 right-8 z-10 p-3 bg-white rounded-full shadow-sm border border-gray-100 hover:bg-gray-50 transition-all"
          onPress={() => setShowSettings(true)}
        >
          <Icon name="settings-outline" size={24} color="#374151" />
        </TouchableOpacity>

        <Animated.View
          entering={FadeInDown.delay(400).duration(1000).springify()}
          className="w-full max-w-md"
        >
          <View className="mb-6">
            <Text className="text-3xl font-bold text-gray-900 mb-2">
              Selamat Datang
            </Text>
            <Text className="text-gray-500 text-lg">
              Silakan masuk ke akun Anda
            </Text>
          </View>

          {/* Login Type Toggle Web */}
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
              onPress={async () => {
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
              }}
              disabled={!username.trim() || !password || loading}
              size="lg"
            />
          </View>

          <View className="mt-8 pt-8 border-t border-gray-100">
            <Text className="text-gray-400 text-xs text-center mb-4 uppercase tracking-wider font-semibold">
              Akun Demo
            </Text>
            <View className="flex-row flex-wrap justify-center gap-2">
              {[
                { label: 'Super Admin', u: 'superadmin', p: 'Admin123!' },
                { label: 'Sekolah', u: 'admin_school_1', p: 'School1Pass!' },
                { label: 'Catering', u: 'admin_catering_1', p: 'Catering1Pass!' },
                { label: 'Dinkes', u: 'admin_dinkes_1', p: 'Dinkes1Pass!' },
                { label: 'Siswa', u: 'student_001', p: 'Student1!' },
              ].map((demo) => (
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
        </Animated.View>
      </View>
    </View>
  );
}

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  serverUrl: string;
  setServerUrl: (url: string) => void;
  onPing: () => void;
  onSave: () => void;
}

const SettingsModal = ({ visible, onClose, serverUrl, setServerUrl, onPing, onSave }: SettingsModalProps) => {
  const [centralApiKey, setCentralApiKeyState] = useState('');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Load Central API Key when modal opens
  useEffect(() => {
    if (visible) {
      import('../../services/storage').then(({ getCentralApiKey }) => {
        getCentralApiKey().then((key) => {
          if (key) setCentralApiKeyState(key);
        });
      });
    }
  }, [visible]);

  const handleTestConnection = async () => {
    if (!serverUrl.trim()) {
      setTestStatus('error');
      setTestMessage('Server URL is required');
      return;
    }

    if (!centralApiKey.trim()) {
      setTestStatus('error');
      setTestMessage('Central API Key is required');
      return;
    }

    try {
      setTestStatus('testing');
      setTestMessage('Testing connection...');

      const response = await fetch(`${serverUrl.replace(/\/$/, '')}/central-sync/check-auth`, {
        method: 'GET',
        headers: {
          'X-School-Token': centralApiKey.trim(),
        },
      });

      if (response.ok) {
        setTestStatus('success');
        setTestMessage('Connection successful! You can now save the configuration.');
      } else {
        setTestStatus('error');
        setTestMessage(`Server returned ${response.status}. Please check your credentials.`);
      }
    } catch (error: any) {
      setTestStatus('error');
      setTestMessage(error?.message || 'Could not connect to server. Please check the URL.');
    }
  };

  const handleSaveConfiguration = async () => {
    if (testStatus !== 'success') {
      Alert.alert('Test Required', 'Please test the connection before saving.');
      return;
    }

    try {
      setIsSaving(true);

      // Import storage functions
      const { setCentralApiKey: saveCentralApiKey } = await import('../../services/storage');

      // Save both server URL and Central API Key
      await onSave(); // This saves the server URL
      await saveCentralApiKey(centralApiKey.trim());

      Alert.alert('Success', 'Central Server configuration saved successfully!');
      onClose();

      // Reset state
      setTestStatus('idle');
      setTestMessage('');
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setTestStatus('idle');
    setTestMessage('');
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
    >
      <View className="flex-1 justify-center items-center bg-black/50">
        <View className="bg-white p-6 rounded-lg w-11/12 max-w-md shadow-xl">
          <Text className="text-xl font-bold mb-4">Server Settings</Text>

          {/* Server URL Section */}
          <View className="mb-4">
            <Text className="text-gray-600 mb-2 font-medium">Server URL</Text>
            <TextInput
              value={serverUrl}
              onChangeText={setServerUrl}
              placeholder="http://..."
              autoCapitalize="none"
              className="border border-gray-300 rounded-lg px-3 py-2 bg-white"
            />
          </View>

          {/* Central API Key Section */}
          <View className="mb-4">
            <Text className="text-gray-600 mb-2 font-medium">Central API Key (Edge Mode)</Text>
            <TextInput
              value={centralApiKey}
              onChangeText={(text) => {
                setCentralApiKeyState(text);
                if (testStatus !== 'idle') {
                  setTestStatus('idle');
                  setTestMessage('');
                }
              }}
              placeholder="sk_..."
              autoCapitalize="none"
              secureTextEntry
              className="border border-gray-300 rounded-lg px-3 py-2 bg-white"
            />
            <Text className="text-xs text-gray-500 mt-1">
              Required for Edge Mode to sync with Central Server
            </Text>
          </View>

          {/* Test Status Message */}
          {testMessage ? (
            <View className={`mb-4 p-3 rounded-lg ${testStatus === 'success' ? 'bg-green-50 border border-green-200' :
              testStatus === 'error' ? 'bg-red-50 border border-red-200' :
                'bg-blue-50 border border-blue-200'
              }`}>
              <Text className={`text-sm ${testStatus === 'success' ? 'text-green-700' :
                testStatus === 'error' ? 'text-red-700' :
                  'text-blue-700'
                }`}>
                {testMessage}
              </Text>
            </View>
          ) : null}

          {/* Action Buttons */}
          <View className="gap-3">
            <Button
              title={testStatus === 'testing' ? 'Testing...' : 'Test Connection'}
              variant="outline"
              onPress={handleTestConnection}
              disabled={testStatus === 'testing' || !serverUrl.trim() || !centralApiKey.trim()}
            />

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={handleClose}
                />
              </View>
              <View className="flex-1">
                <Button
                  title={isSaving ? 'Saving...' : 'Save'}
                  onPress={handleSaveConfiguration}
                  disabled={testStatus !== 'success' || isSaving}
                />
              </View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};
