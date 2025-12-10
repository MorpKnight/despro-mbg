import { Redirect } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Image, Text, View } from "react-native";
import { AuthLayout } from "../../components/auth/AuthLayout";
import { LoginForm } from "../../components/auth/LoginForm";
import { SettingsModal } from "../../components/auth/SettingsModal";
import { useAuth } from "../../hooks/useAuth";
import { getServerUrl, setServerUrl } from "../../services/storage";

export default function AuthIndex() {
  const { user, loading } = useAuth();
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
      await setServerUrl(serverUrl);
      Alert.alert("Success", "Server URL updated successfully");
      setShowSettings(false);
    } catch (e) {
      Alert.alert("Error", "Invalid URL format");
    }
  };

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

  if (!loading && user) {
    return <Redirect href="/(app)" />;
  }

  const heroContent = (
    <View className="px-1 max-w-lg flex h-full justify-center">
      {/* Row: Logo + App Name */}
      <View className="flex-row items-center gap-4 mb-6">
        <View className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-3xl items-center justify-center border border-white/20">
          <Image
            source={require("../../assets/images/logo.png")}
            style={{ width: 50, height: 50 }}
            resizeMode="contain"
          />
        </View>

        <Text className="text-white text-5xl font-extrabold tracking-tight">
          MBGlance
        </Text>
      </View>

      {/* Tagline */}
      <Text className="text-white/90 text-4xl font-bold leading-tight mb-4">
        Monitoring Gizi,{'\n'}Masa Depan Bangsa
      </Text>

      {/* Deskripsi */}
      <Text className="text-blue-100 text-xl leading-relaxed">
        Platform terintegrasi untuk memantau distribusi dan kualitas Makan Bergizi Gratis di seluruh sekolah.
      </Text>
    </View>
  );
  return (
    <AuthLayout
      heroContent={heroContent}
      mobileTitle="MBGlance"
      mobileSubtitle="Sistem Monitoring Makan Bergizi Gratis"
      mobileIcon={
        <Image
          source={require("../../assets/images/logo.png")}
          style={{ width: 60, height: 60 }}
          resizeMode="contain"
        />
      }
    >
      <SettingsModal
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        serverUrl={serverUrl}
        setServerUrl={setServerUrlState}
        onPing={handlePing}
        onSave={handleSaveSettings}
      />
      <LoginForm onShowSettings={() => setShowSettings(true)} />
    </AuthLayout>
  );
}
