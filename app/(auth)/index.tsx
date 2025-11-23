import { Redirect, useRouter } from "expo-router";
import React, { useState } from "react";
import { Image, Platform, Text, View } from "react-native";
import Button from "../../components/ui/Button";
import TextInput from "../../components/ui/TextInput";
import { useAuth } from "../../hooks/useAuth";

export default function AuthIndex() {
  const { user, loading, signIn } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  if (!loading && user) {
    return <Redirect href="/(app)" />;
  }


  // Mobile keeps the simple centered layout; Web gets a polished split view with a card
  if (Platform.OS !== "web") {
    return (
      <View className="flex-1 bg-neutral-gray p-6 gap-4 justify-center">
        <Text className="text-heading font-bold text-center">Sign in</Text>
        {error ? (
          <Text className="text-red-500 text-body text-center">{error}</Text>
        ) : null}
        <TextInput
          placeholder="Username"
          value={username}
          onChangeText={(t) => {
            setUsername(t);
            if (usernameError) setUsernameError(null);
          }}
          autoCapitalize="none"
        />
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={(t) => {
            setPassword(t);
            if (passwordError) setPasswordError(null);
          }}
          secureTextEntry
        />
        <Button
          title={loading ? "Loading…" : "Sign In"}
          onPress={async () => {
            try {
              setError(null);
              if (!username.trim()) {
                setUsernameError("Username is required");
                return;
              }
              if (!password) {
                setPasswordError("Password is required");
                return;
              }
              await signIn(username.trim(), password);
            } catch (e: any) {
              setError(e?.message || "Failed to sign in");
            }
          }}
          disabled={!username.trim() || !password}
        />
        <View className="items-center mt-2">
          <Text className="text-gray-500 text-xs">
            Try: super/super123, sekolah/sekolah123, catering/catering123,
            siswa/siswa123, dinkes/dinkes123
          </Text>
          <View className="items-center mt-2">
            <Text className="text-gray-500 mt-1">
              Don’t have an account?{" "}
              <Text
                className="text-primary font-bold"
                onPress={() => router.push("/(auth)/signup")}
              >
                Sign up
              </Text>
            </Text>
          </View>
        </View>
        <View className="items-center mt-2">
          <Text className="text-gray-500 mt-1">
            Don’t have an account?{" "}
            <Text className="text-primary font-bold">Sign up</Text>
          </Text>
        </View>
      </View>
    );
  }

  // Web layout
  return (
    <View className="bg-neutral-gray min-h-screen">
      <View className="flex-row w-full h-full">
        {/* Left hero panel (hidden on very small widths via CSS, only effective on web) */}
        <View className="hidden md:flex flex-1 items-center justify-center bg-gradient-to-br from-secondary to-primary">
          <View className="px-10">
            <View className="flex-row items-center mb-4">
              <View className="w-16 h-16 rounded-full bg-white/15 items-center justify-center overflow-hidden">
                <Image
                  source={require("../../assets/images/logo.png")}
                  style={{ width: 55, height: 55, alignSelf: "center" }}
                  resizeMode="contain"
                />
              </View>
              <Text className="text-white text-4xl font-extrabold leading-tight ml-4">
                MBGlance
              </Text>
            </View>
            <Text className="text-white/80 mt-3 max-w-md">
              Kelola review dan tracking dengan cepat dan aman. Masuk untuk
              melanjutkan.
            </Text>
          </View>
        </View>

        {/* Right form panel */}
        <View className="flex-1 items-center justify-center p-6">
          <View className="w-full max-w-md bg-neutral-white rounded-card shadow-card p-8">
            <View className="items-center mb-6">
              <Text className="text-2xl font-bold text-gray-900">
                Welcome back
              </Text>
              <Text className="text-gray-500 mt-1">
                Please sign in to your account
              </Text>
            </View>

            {error ? (
              <View className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                <Text className="text-red-600 text-sm">{error}</Text>
              </View>
            ) : null}

            <View className="gap-3">
              <View>
                <Text className="text-sm text-gray-700 mb-1">Username</Text>
                <TextInput
                  placeholder="Enter your username"
                  value={username}
                  onChangeText={(t) => {
                    setUsername(t);
                    if (usernameError) setUsernameError(null);
                  }}
                  autoCapitalize="none"
                />
                {usernameError ? (
                  <Text className="text-red-600 text-xs mt-1">
                    {usernameError}
                  </Text>
                ) : null}
              </View>
              <View>
                <Text className="text-sm text-gray-700 mb-1">Password</Text>
                <View className="relative">
                  <TextInput
                    placeholder="••••••••"
                    value={password}
                    onChangeText={(t) => {
                      setPassword(t);
                      if (passwordError) setPasswordError(null);
                    }}
                    secureTextEntry={!showPassword}
                  />
                  <View className="absolute right-2 top-1/2 -translate-y-1/2">
                    <Text
                      className="text-primary font-semibold text-sm"
                      onPress={() => setShowPassword((s) => !s)}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </Text>
                  </View>
                </View>
                {passwordError ? (
                  <Text className="text-red-600 text-xs mt-1">
                    {passwordError}
                  </Text>
                ) : null}
              </View>
              <Button
                className="w-full"
                title={loading ? "Signing in…" : "Sign In"}
                onPress={async () => {
                  try {
                    setError(null);
                    if (!username.trim()) {
                      setUsernameError("Username is required");
                      return;
                    }
                    if (!password) {
                      setPasswordError("Password is required");
                      return;
                    }
                    await signIn(username.trim(), password);
                  } catch (e: any) {
                    setError(e?.message || "Failed to sign in");
                  }
                }}
                disabled={!username.trim() || !password}
              />
            </View>

            <View className="items-center mt-4">
              <Text className="text-gray-400 text-xs text-center mb-2">
                Fast Login (Demo):
              </Text>
              <View className="flex-row flex-wrap justify-center gap-2">
                <Button
                  title="Super Admin"
                  size="sm"
                  variant="outline"
                  onPress={() => {
                    setUsername('superadmin');
                    setPassword('Admin123!');
                  }}
                />
                <Button
                  title="Sekolah"
                  size="sm"
                  variant="outline"
                  onPress={() => {
                    setUsername('admin_school_1');
                    setPassword('School1Pass!');
                  }}
                />
                <Button
                  title="Catering"
                  size="sm"
                  variant="outline"
                  onPress={() => {
                    setUsername('admin_catering_1');
                    setPassword('Catering1Pass!');
                  }}
                />
                <Button
                  title="Siswa"
                  size="sm"
                  variant="outline"
                  onPress={() => {
                    setUsername('student_001');
                    setPassword('Student1!');
                  }}
                />
                <Button
                  title="Dinkes"
                  size="sm"
                  variant="outline"
                  onPress={() => {
                    setUsername('admin_dinkes_1');
                    setPassword('Dinkes1Pass!');
                  }}
                />
              </View>
            </View>
            <View className="items-center mt-2">
              <View className="items-center mt-2">
                <Text className="text-gray-500 mt-1">
                  Don’t have an account?{" "}
                  <Text
                    className="text-primary font-bold"
                    onPress={() => router.push("/(auth)/signup")}
                  >
                    Sign up
                  </Text>
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
